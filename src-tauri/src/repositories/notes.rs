use std::collections::HashMap;

use rusqlite::{params, params_from_iter, types::Value as SqlValue, Connection, OptionalExtension};
use serde_json::{Map, Value};

use crate::error::{AppError, Result};
use crate::models::branch::{BranchOverride, OverlayOperation};
use crate::models::note::{
    CreateNoteInput, DeleteNoteInput, GetNoteInput, Note, NotesListInput, NotesListResult,
    SetNoteTagsInput, UpdateNoteInput,
};
use crate::models::tag::Tag;
use crate::models::tag_association::{EntityTagsInput, SetEntityTagsInput};
use crate::services::branch_overlay;
use crate::services::branch_scope;
use crate::services::tag_associations;

const NOTE_LIST_MAX_LIMIT: i32 = 500;
const DEFAULT_PAGE: i32 = 1;
const DEFAULT_LIMIT: i32 = 50;

#[derive(Debug, Clone)]
struct NoteRow {
    id: i32,
    project_id: i32,
    folder_id: Option<i32>,
    title: String,
    content: String,
    format: String,
    note_type: String,
    is_pinned: i32,
    created_at: String,
    updated_at: String,
    created_branch_id: Option<i32>,
}

pub fn list_notes(connection: &Connection, input: &NotesListInput) -> Result<NotesListResult> {
    let page = input.page.unwrap_or(DEFAULT_PAGE).max(1);
    let limit = input
        .limit
        .unwrap_or(DEFAULT_LIMIT)
        .clamp(1, NOTE_LIST_MAX_LIMIT);
    let offset = (page - 1) * limit;

    let sort_column = match input.sort_by.as_deref() {
        Some("title") => "title",
        Some("createdAt") => "created_at",
        _ => "updated_at",
    };
    let sort_order = if input.sort_order.as_deref() == Some("asc") {
        "ASC"
    } else {
        "DESC"
    };

    let mut where_clause = String::from("WHERE project_id = ?");
    let mut where_params = vec![SqlValue::Integer(i64::from(input.project_id))];

    if let Some(search) = input.search.as_deref().filter(|value| !value.is_empty()) {
        let like = format!("%{search}%");
        where_clause.push_str(" AND (title LIKE ? OR content LIKE ?)");
        where_params.push(SqlValue::Text(like.clone()));
        where_params.push(SqlValue::Text(like));
    }

    if let Some(note_type) = input.note_type.as_deref().filter(|value| !value.is_empty()) {
        where_clause.push_str(" AND note_type = ?");
        where_params.push(SqlValue::Text(note_type.to_string()));
    }

    if let Some(folder_filter) = input.folder_id {
        match folder_filter {
            Some(folder_id) => {
                where_clause.push_str(" AND folder_id = ?");
                where_params.push(SqlValue::Integer(i64::from(folder_id)));
            }
            None => {
                where_clause.push_str(" AND folder_id IS NULL");
            }
        }
    }

    let query = format!(
        r#"
        SELECT
            id,
            project_id,
            folder_id,
            title,
            content,
            format,
            note_type,
            is_pinned,
            created_at,
            updated_at,
            created_branch_id
        FROM notes
        {where_clause}
        ORDER BY is_pinned DESC, {sort_column} {sort_order}
        "#
    );

    let mut statement = connection.prepare(&query)?;
    let rows = statement.query_map(params_from_iter(where_params.iter()), map_note_row)?;
    let fetched_rows = rows.collect::<std::result::Result<Vec<_>, _>>()?;

    let mut visible_notes = Vec::new();
    for row in fetched_rows {
        if branch_scope::is_entity_visible_in_branch(
            connection,
            row.project_id,
            input.branch_id,
            row.created_branch_id,
            Some(row.created_at.as_str()),
        )? {
            visible_notes.push(map_note(row));
        }
    }

    let effective_notes = if let Some(branch_id) = input.branch_id {
        let overrides = list_branch_overrides_for_entity_type(connection, branch_id, "note")?;
        apply_note_overrides(visible_notes, overrides)?
    } else {
        visible_notes
    };

    let total = i32::try_from(effective_notes.len()).map_err(|_| {
        AppError::internal("NOTES_TOTAL_RANGE_ERROR", "Notes total is out of range")
    })?;

    let start = usize::try_from(offset).unwrap_or(0);
    let end = usize::try_from(offset + limit).unwrap_or(start);
    let page_items = effective_notes
        .into_iter()
        .skip(start)
        .take(end.saturating_sub(start))
        .collect::<Vec<_>>();

    let mut items = page_items;
    attach_tags_for_notes(connection, &mut items)?;

    let total_pages = if total == 0 {
        0
    } else {
        ((total as f64) / (limit as f64)).ceil() as i32
    };

    Ok(NotesListResult {
        items,
        total,
        page,
        limit,
        total_pages,
    })
}

pub fn get_note_by_id(connection: &Connection, input: &GetNoteInput) -> Result<Note> {
    let row = connection
        .query_row(
            r#"
            SELECT
                id,
                project_id,
                folder_id,
                title,
                content,
                format,
                note_type,
                is_pinned,
                created_at,
                updated_at,
                created_branch_id
            FROM notes
            WHERE id = ?1
            "#,
            params![input.id],
            map_note_row,
        )
        .optional()?
        .ok_or_else(|| AppError::internal("NOTE_NOT_FOUND", "Note not found"))?;

    let view_branch_id =
        branch_scope::effective_branch_id_for_read(connection, row.project_id, input.branch_id)?;

    if !branch_scope::is_entity_visible_in_branch(
        connection,
        row.project_id,
        view_branch_id,
        row.created_branch_id,
        Some(row.created_at.as_str()),
    )? {
        return Err(AppError::internal("NOTE_NOT_FOUND", "Note not found"));
    }

    let note = if let Some(branch_id) = view_branch_id {
        if let Some(override_row) = get_branch_override(connection, branch_id, "note", row.id)? {
            branch_overlay::apply_item_overlay(Some(map_note(row)), Some(&override_row))?
                .ok_or_else(|| AppError::internal("NOTE_NOT_FOUND", "Note not found"))?
        } else {
            map_note(row)
        }
    } else {
        map_note(row)
    };

    let tags = tag_associations::get_tags_for_entity(
        connection,
        &EntityTagsInput {
            project_id: note.project_id,
            entity_type: "note".to_string(),
            entity_id: note.id,
        },
    )?;

    Ok(Note { tags, ..note })
}

pub fn create_note(connection: &Connection, input: &CreateNoteInput) -> Result<Note> {
    if let Some(branch_id) = input.branch_id {
        branch_scope::assert_branch_belongs_to_project(connection, branch_id, input.project_id)?;
    }

    let created_branch_id =
        branch_scope::resolve_created_branch_id(connection, input.project_id, input.branch_id)?;

    connection.execute(
        r#"
        INSERT INTO notes (
            project_id,
            folder_id,
            title,
            content,
            format,
            note_type,
            is_pinned,
            created_branch_id
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
        "#,
        params![
            input.project_id,
            input.folder_id,
            input.title,
            input.content.clone().unwrap_or_default(),
            input.format.clone().unwrap_or_else(|| "md".to_string()),
            input
                .note_type
                .clone()
                .unwrap_or_else(|| "note".to_string()),
            if input.is_pinned.unwrap_or(false) {
                1
            } else {
                0
            },
            created_branch_id
        ],
    )?;

    let id = i32::try_from(connection.last_insert_rowid()).map_err(|_| {
        AppError::internal("NOTE_ID_RANGE_ERROR", "Created note id is out of range")
    })?;
    let view_branch_id = if input.branch_id.is_some() {
        input.branch_id
    } else {
        branch_scope::effective_branch_id_for_read(connection, input.project_id, None)?
    };

    get_note_by_id(
        connection,
        &GetNoteInput {
            id,
            branch_id: view_branch_id,
        },
    )
}

pub fn update_note(connection: &Connection, input: &UpdateNoteInput) -> Result<Note> {
    let _ = get_note_by_id(
        connection,
        &GetNoteInput {
            id: input.id,
            branch_id: input.branch_id,
        },
    )?;

    if let Some(branch_id) = input.branch_id {
        let patch_json = build_note_patch_json(input);
        if patch_json != Value::Object(Map::new()) {
            save_upsert_override(connection, branch_id, "note", input.id, &patch_json)?;
        }
        return get_note_by_id(
            connection,
            &GetNoteInput {
                id: input.id,
                branch_id: Some(branch_id),
            },
        );
    }

    let mut fields: Vec<String> = Vec::new();
    let mut values: Vec<SqlValue> = Vec::new();

    if let Some(title) = input.title.as_deref() {
        fields.push("title = ?".to_string());
        values.push(SqlValue::Text(title.to_string()));
    }
    if let Some(content) = input.content.as_deref() {
        fields.push("content = ?".to_string());
        values.push(SqlValue::Text(content.to_string()));
    }
    if let Some(format) = input.format.as_deref() {
        fields.push("format = ?".to_string());
        values.push(SqlValue::Text(format.to_string()));
    }
    if let Some(note_type) = input.note_type.as_deref() {
        fields.push("note_type = ?".to_string());
        values.push(SqlValue::Text(note_type.to_string()));
    }
    if let Some(folder_update) = input.folder_id {
        match folder_update {
            Some(folder_id) => {
                fields.push("folder_id = ?".to_string());
                values.push(SqlValue::Integer(i64::from(folder_id)));
            }
            None => fields.push("folder_id = NULL".to_string()),
        }
    }
    if let Some(is_pinned) = input.is_pinned {
        fields.push("is_pinned = ?".to_string());
        values.push(SqlValue::Integer(if is_pinned { 1 } else { 0 }));
    }

    if !fields.is_empty() {
        fields.push("updated_at = datetime('now')".to_string());
        values.push(SqlValue::Integer(i64::from(input.id)));
        let query = format!("UPDATE notes SET {} WHERE id = ?", fields.join(", "));
        connection.execute(&query, params_from_iter(values.iter()))?;
    }

    get_note_by_id(
        connection,
        &GetNoteInput {
            id: input.id,
            branch_id: None,
        },
    )
}

pub fn delete_note(connection: &Connection, input: &DeleteNoteInput) -> Result<()> {
    let _ = get_note_by_id(
        connection,
        &GetNoteInput {
            id: input.id,
            branch_id: input.branch_id,
        },
    )?;

    if let Some(branch_id) = input.branch_id {
        save_delete_override(connection, branch_id, "note", input.id)?;
        return Ok(());
    }

    connection.execute("DELETE FROM notes WHERE id = ?1", params![input.id])?;
    Ok(())
}

pub fn set_note_tags(connection: &Connection, input: &SetNoteTagsInput) -> Result<Vec<Tag>> {
    let note = get_note_by_id(
        connection,
        &GetNoteInput {
            id: input.id,
            branch_id: input.branch_id,
        },
    )?;

    tag_associations::set_tags_for_entity(
        connection,
        &SetEntityTagsInput {
            project_id: note.project_id,
            entity_type: "note".to_string(),
            entity_id: note.id,
            tag_ids: input.tag_ids.clone(),
        },
    )
}

fn attach_tags_for_notes(connection: &Connection, notes: &mut [Note]) -> Result<()> {
    for note in notes.iter_mut() {
        note.tags = tag_associations::get_tags_for_entity(
            connection,
            &EntityTagsInput {
                project_id: note.project_id,
                entity_type: "note".to_string(),
                entity_id: note.id,
            },
        )?;
    }

    Ok(())
}

fn apply_note_overrides(
    notes: Vec<Note>,
    overrides: HashMap<i32, BranchOverride>,
) -> Result<Vec<Note>> {
    let mut result = Vec::new();
    for note in notes {
        let override_row = overrides.get(&note.id);
        if let Some(projected) = branch_overlay::apply_item_overlay(Some(note), override_row)? {
            result.push(projected);
        }
    }
    Ok(result)
}

fn list_branch_overrides_for_entity_type(
    connection: &Connection,
    branch_id: i32,
    entity_type: &str,
) -> Result<HashMap<i32, BranchOverride>> {
    let mut statement = connection.prepare(
        r#"
        SELECT
            id,
            branch_id,
            entity_type,
            entity_id,
            op,
            patch_json,
            created_at,
            updated_at
        FROM branch_overrides
        WHERE branch_id = ?1 AND entity_type = ?2
        "#,
    )?;

    let rows = statement.query_map(params![branch_id, entity_type], map_branch_override_row)?;
    let overrides = rows
        .collect::<std::result::Result<Vec<_>, _>>()?
        .into_iter()
        .map(|row| (row.entity_id, row))
        .collect::<HashMap<_, _>>();

    Ok(overrides)
}

fn get_branch_override(
    connection: &Connection,
    branch_id: i32,
    entity_type: &str,
    entity_id: i32,
) -> Result<Option<BranchOverride>> {
    connection
        .query_row(
            r#"
            SELECT
                id,
                branch_id,
                entity_type,
                entity_id,
                op,
                patch_json,
                created_at,
                updated_at
            FROM branch_overrides
            WHERE branch_id = ?1 AND entity_type = ?2 AND entity_id = ?3
            LIMIT 1
            "#,
            params![branch_id, entity_type, entity_id],
            map_branch_override_row,
        )
        .optional()
        .map_err(Into::into)
}

fn save_upsert_override(
    connection: &Connection,
    branch_id: i32,
    entity_type: &str,
    entity_id: i32,
    patch_json: &Value,
) -> Result<()> {
    let existing = connection
        .query_row(
            r#"
            SELECT op, patch_json
            FROM branch_overrides
            WHERE branch_id = ?1 AND entity_type = ?2 AND entity_id = ?3
            "#,
            params![branch_id, entity_type, entity_id],
            |row| {
                Ok((
                    row.get::<_, String>("op")?,
                    row.get::<_, String>("patch_json")?,
                ))
            },
        )
        .optional()?;

    let mut merged_patch = patch_json.clone();
    if let Some((existing_op, existing_patch_json)) = existing {
        if existing_op == "upsert" {
            let mut base = match serde_json::from_str::<Value>(&existing_patch_json) {
                Ok(Value::Object(map)) => Value::Object(map),
                _ => Value::Object(Map::new()),
            };
            if let (Value::Object(base_map), Value::Object(patch_map)) =
                (&mut base, patch_json.clone())
            {
                for (key, value) in patch_map {
                    base_map.insert(key, value);
                }
            }
            merged_patch = base;
        }
    }

    connection.execute(
        r#"
        INSERT INTO branch_overrides (branch_id, entity_type, entity_id, op, patch_json, updated_at)
        VALUES (?1, ?2, ?3, 'upsert', ?4, datetime('now'))
        ON CONFLICT(branch_id, entity_type, entity_id)
        DO UPDATE SET op = 'upsert', patch_json = excluded.patch_json, updated_at = datetime('now')
        "#,
        params![branch_id, entity_type, entity_id, merged_patch.to_string()],
    )?;

    Ok(())
}

fn save_delete_override(
    connection: &Connection,
    branch_id: i32,
    entity_type: &str,
    entity_id: i32,
) -> Result<()> {
    connection.execute(
        r#"
        INSERT INTO branch_overrides (branch_id, entity_type, entity_id, op, patch_json, updated_at)
        VALUES (?1, ?2, ?3, 'delete', '{}', datetime('now'))
        ON CONFLICT(branch_id, entity_type, entity_id)
        DO UPDATE SET op = 'delete', patch_json = '{}', updated_at = datetime('now')
        "#,
        params![branch_id, entity_type, entity_id],
    )?;
    Ok(())
}

fn build_note_patch_json(input: &UpdateNoteInput) -> Value {
    let mut patch = Map::new();

    if let Some(title) = input.title.as_ref() {
        patch.insert("title".to_string(), Value::String(title.clone()));
    }
    if let Some(content) = input.content.as_ref() {
        patch.insert("content".to_string(), Value::String(content.clone()));
    }
    if let Some(format) = input.format.as_ref() {
        patch.insert("format".to_string(), Value::String(format.clone()));
    }
    if let Some(note_type) = input.note_type.as_ref() {
        patch.insert("noteType".to_string(), Value::String(note_type.clone()));
    }
    if let Some(folder_id) = input.folder_id {
        let value = match folder_id {
            Some(id) => Value::Number(id.into()),
            None => Value::Null,
        };
        patch.insert("folderId".to_string(), value);
    }
    if let Some(is_pinned) = input.is_pinned {
        patch.insert("isPinned".to_string(), Value::Bool(is_pinned));
    }

    Value::Object(patch)
}

fn map_note_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<NoteRow> {
    Ok(NoteRow {
        id: row.get("id")?,
        project_id: row.get("project_id")?,
        folder_id: row.get("folder_id")?,
        title: row.get("title")?,
        content: row.get("content")?,
        format: row.get("format")?,
        note_type: row.get("note_type")?,
        is_pinned: row.get("is_pinned")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        created_branch_id: row.get("created_branch_id")?,
    })
}

fn map_note(row: NoteRow) -> Note {
    Note {
        id: row.id,
        project_id: row.project_id,
        folder_id: row.folder_id,
        title: row.title,
        content: row.content,
        format: row.format,
        note_type: row.note_type,
        is_pinned: row.is_pinned != 0,
        created_at: row.created_at,
        updated_at: row.updated_at,
        tags: Vec::new(),
    }
}

fn map_branch_override_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<BranchOverride> {
    let op = match row.get::<_, String>("op")?.as_str() {
        "upsert" => OverlayOperation::Upsert,
        "delete" => OverlayOperation::Delete,
        "create" => OverlayOperation::Create,
        other => {
            return Err(rusqlite::Error::FromSqlConversionFailure(
                0,
                rusqlite::types::Type::Text,
                Box::new(std::io::Error::new(
                    std::io::ErrorKind::InvalidData,
                    format!("Unsupported overlay op: {other}"),
                )),
            ));
        }
    };

    Ok(BranchOverride {
        id: row.get("id")?,
        branch_id: row.get("branch_id")?,
        entity_type: row.get("entity_type")?,
        entity_id: row.get("entity_id")?,
        op,
        patch_json: row.get("patch_json")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::params;

    fn setup_connection() -> Connection {
        let connection = Connection::open_in_memory().expect("in-memory db");
        connection
            .execute_batch(
                r#"
                CREATE TABLE projects (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
                CREATE TABLE scenario_branches (
                  id INTEGER PRIMARY KEY,
                  project_id INTEGER NOT NULL,
                  name TEXT NOT NULL,
                  parent_branch_id INTEGER,
                  base_revision INTEGER DEFAULT 0,
                  is_main INTEGER DEFAULT 0,
                  created_at TEXT NOT NULL,
                  updated_at TEXT NOT NULL
                );
                CREATE TABLE tags (
                  id INTEGER PRIMARY KEY,
                  project_id INTEGER NOT NULL,
                  name TEXT NOT NULL,
                  color TEXT NOT NULL
                );
                CREATE TABLE tag_associations (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  tag_id INTEGER NOT NULL,
                  entity_type TEXT NOT NULL,
                  entity_id INTEGER NOT NULL,
                  UNIQUE(tag_id, entity_type, entity_id)
                );
                CREATE TABLE branch_overrides (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  branch_id INTEGER NOT NULL,
                  entity_type TEXT NOT NULL,
                  entity_id INTEGER NOT NULL,
                  op TEXT NOT NULL,
                  patch_json TEXT NOT NULL,
                  created_at TEXT DEFAULT (datetime('now')),
                  updated_at TEXT DEFAULT (datetime('now')),
                  UNIQUE(branch_id, entity_type, entity_id)
                );
                CREATE TABLE notes (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  project_id INTEGER NOT NULL,
                  folder_id INTEGER,
                  title TEXT NOT NULL,
                  content TEXT DEFAULT '',
                  format TEXT DEFAULT 'md',
                  note_type TEXT DEFAULT 'note',
                  is_pinned INTEGER DEFAULT 0,
                  created_branch_id INTEGER,
                  created_at TEXT DEFAULT (datetime('now')),
                  updated_at TEXT DEFAULT (datetime('now'))
                );
                "#,
            )
            .expect("schema created");

        connection
            .execute(
                "INSERT INTO projects (id, name) VALUES (?1, ?2)",
                params![1, "Project A"],
            )
            .expect("project");

        connection
            .execute(
                "INSERT INTO scenario_branches (id, project_id, name, parent_branch_id, base_revision, is_main, created_at, updated_at) VALUES (?1, ?2, ?3, NULL, 0, 1, ?4, ?4)",
                params![10, 1, "main", "2025-01-01 00:00:00"],
            )
            .expect("main branch");
        connection
            .execute(
                "INSERT INTO scenario_branches (id, project_id, name, parent_branch_id, base_revision, is_main, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, 0, 0, ?5, ?5)",
                params![11, 1, "child", 10, "2099-02-01 00:00:00"],
            )
            .expect("child branch");

        connection
            .execute(
                "INSERT INTO tags (id, project_id, name, color) VALUES (?1, ?2, ?3, ?4)",
                params![1, 1, "alpha", "#111111"],
            )
            .expect("tag 1");
        connection
            .execute(
                "INSERT INTO tags (id, project_id, name, color) VALUES (?1, ?2, ?3, ?4)",
                params![2, 1, "beta", "#222222"],
            )
            .expect("tag 2");

        connection
    }

    #[test]
    fn crud_without_branch_works() {
        let connection = setup_connection();
        let created = create_note(
            &connection,
            &CreateNoteInput {
                project_id: 1,
                folder_id: None,
                title: "First".to_string(),
                content: Some("Body".to_string()),
                format: Some("md".to_string()),
                note_type: Some("note".to_string()),
                is_pinned: Some(false),
                branch_id: None,
            },
        )
        .unwrap();

        let updated = update_note(
            &connection,
            &UpdateNoteInput {
                id: created.id,
                title: Some("Updated".to_string()),
                content: None,
                format: None,
                note_type: None,
                folder_id: None,
                is_pinned: Some(true),
                branch_id: None,
            },
        )
        .unwrap();

        assert_eq!(updated.title, "Updated");
        assert!(updated.is_pinned);

        delete_note(
            &connection,
            &DeleteNoteInput {
                id: created.id,
                branch_id: None,
            },
        )
        .unwrap();

        let missing = get_note_by_id(
            &connection,
            &GetNoteInput {
                id: created.id,
                branch_id: None,
            },
        );
        assert!(missing.is_err());
    }

    #[test]
    fn branch_update_uses_override_without_touching_base_row() {
        let connection = setup_connection();
        let created = create_note(
            &connection,
            &CreateNoteInput {
                project_id: 1,
                folder_id: None,
                title: "Base".to_string(),
                content: Some("Base body".to_string()),
                format: Some("md".to_string()),
                note_type: Some("note".to_string()),
                is_pinned: Some(false),
                branch_id: Some(10),
            },
        )
        .unwrap();

        let branch_version = update_note(
            &connection,
            &UpdateNoteInput {
                id: created.id,
                title: Some("Child edit".to_string()),
                content: None,
                format: None,
                note_type: None,
                folder_id: None,
                is_pinned: None,
                branch_id: Some(11),
            },
        )
        .unwrap();
        let main_version = get_note_by_id(
            &connection,
            &GetNoteInput {
                id: created.id,
                branch_id: Some(10),
            },
        )
        .unwrap();

        assert_eq!(branch_version.title, "Child edit");
        assert_eq!(main_version.title, "Base");
    }

    #[test]
    fn set_note_tags_replaces_existing_associations() {
        let connection = setup_connection();
        let created = create_note(
            &connection,
            &CreateNoteInput {
                project_id: 1,
                folder_id: None,
                title: "Tagged".to_string(),
                content: Some("Body".to_string()),
                format: Some("md".to_string()),
                note_type: Some("note".to_string()),
                is_pinned: Some(false),
                branch_id: None,
            },
        )
        .unwrap();

        let first = set_note_tags(
            &connection,
            &SetNoteTagsInput {
                id: created.id,
                tag_ids: vec![1, 2],
                branch_id: None,
            },
        )
        .unwrap();
        let second = set_note_tags(
            &connection,
            &SetNoteTagsInput {
                id: created.id,
                tag_ids: vec![2],
                branch_id: None,
            },
        )
        .unwrap();

        assert_eq!(first.len(), 2);
        assert_eq!(second.len(), 1);
        assert_eq!(second[0].id, 2);
    }
}
