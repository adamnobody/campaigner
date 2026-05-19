use std::collections::HashMap;

use rusqlite::{params, params_from_iter, types::Value as SqlValue, Connection, OptionalExtension};
use serde_json::{Map, Value};

use crate::error::{AppError, Result};
use crate::models::branch::{BranchOverride, OverlayOperation};
use crate::models::tag::Tag;
use crate::models::tag_association::{EntityTagsInput, SetEntityTagsInput};
use crate::models::timeline::{
    CreateTimelineEventInput, DeleteTimelineEventInput, GetTimelineEventInput,
    ReorderTimelineInput, SetTimelineTagsInput, TimelineEvent, TimelineListInput,
    UpdateTimelineEventInput,
};
use crate::services::branch_overlay;
use crate::services::branch_scope;
use crate::services::tag_associations;

#[derive(Debug, Clone)]
struct TimelineEventRow {
    id: i32,
    project_id: i32,
    title: String,
    description: String,
    event_date: String,
    sort_order: i32,
    era: String,
    era_color: String,
    linked_note_id: Option<i32>,
    created_at: String,
    updated_at: String,
    created_branch_id: Option<i32>,
}

pub fn list_timeline_events(
    connection: &Connection,
    input: &TimelineListInput,
) -> Result<Vec<TimelineEvent>> {
    let mut query = String::from(
        r#"
        SELECT
            id,
            project_id,
            title,
            description,
            event_date,
            sort_order,
            era,
            COALESCE(era_color, '') AS era_color,
            linked_note_id,
            created_at,
            updated_at,
            created_branch_id
        FROM timeline_events
        WHERE project_id = ?
        "#,
    );

    let mut params = vec![SqlValue::Integer(i64::from(input.project_id))];

    if let Some(era) = input.era.as_deref().filter(|value| !value.is_empty()) {
        query.push_str(" AND era = ?");
        params.push(SqlValue::Text(era.to_string()));
    }

    query.push_str(" ORDER BY sort_order ASC, created_at ASC");

    let mut statement = connection.prepare(&query)?;
    let rows = statement.query_map(params_from_iter(params.iter()), map_timeline_row)?;
    let base_rows = rows.collect::<std::result::Result<Vec<_>, _>>()?;

    let view_branch_id =
        branch_scope::effective_branch_id_for_read(connection, input.project_id, input.branch_id)?;

    let mut visible = Vec::new();
    for row in base_rows {
        if branch_scope::is_entity_visible_in_branch(
            connection,
            row.project_id,
            view_branch_id,
            row.created_branch_id,
            Some(row.created_at.as_str()),
        )? {
            visible.push(map_timeline_event(row));
        }
    }

    let mut projected = if let Some(branch_id) = input.branch_id {
        let overrides = list_branch_overrides(connection, branch_id, "timeline_event")?;
        apply_overrides(visible, overrides)?
    } else {
        visible
    };

    attach_tags(connection, &mut projected)?;
    Ok(projected)
}

pub fn get_timeline_event_by_id(
    connection: &Connection,
    input: &GetTimelineEventInput,
) -> Result<TimelineEvent> {
    let row = connection
        .query_row(
            r#"
            SELECT
                id,
                project_id,
                title,
                description,
                event_date,
                sort_order,
                era,
                COALESCE(era_color, '') AS era_color,
                linked_note_id,
                created_at,
                updated_at,
                created_branch_id
            FROM timeline_events
            WHERE id = ?1
            "#,
            params![input.id],
            map_timeline_row,
        )
        .optional()?
        .ok_or_else(|| {
            AppError::internal("TIMELINE_EVENT_NOT_FOUND", "Timeline event not found")
        })?;

    let view_branch_id =
        branch_scope::effective_branch_id_for_read(connection, row.project_id, input.branch_id)?;

    if !branch_scope::is_entity_visible_in_branch(
        connection,
        row.project_id,
        view_branch_id,
        row.created_branch_id,
        Some(row.created_at.as_str()),
    )? {
        return Err(AppError::internal(
            "TIMELINE_EVENT_NOT_FOUND",
            "Timeline event not found",
        ));
    }

    let mut event = map_timeline_event(row);
    if let Some(branch_id) = view_branch_id {
        if let Some(override_row) =
            get_branch_override(connection, branch_id, "timeline_event", event.id)?
        {
            event = branch_overlay::apply_item_overlay(Some(event), Some(&override_row))?
                .ok_or_else(|| {
                    AppError::internal("TIMELINE_EVENT_NOT_FOUND", "Timeline event not found")
                })?;
        }
    }

    event.tags = tag_associations::get_tags_for_entity(
        connection,
        &EntityTagsInput {
            project_id: event.project_id,
            entity_type: "timeline_event".to_string(),
            entity_id: event.id,
        },
    )?;

    Ok(event)
}

pub fn create_timeline_event(
    connection: &Connection,
    input: &CreateTimelineEventInput,
) -> Result<TimelineEvent> {
    if let Some(branch_id) = input.branch_id {
        branch_scope::assert_branch_belongs_to_project(connection, branch_id, input.project_id)?;
    }

    let created_branch_id =
        branch_scope::resolve_created_branch_id(connection, input.project_id, input.branch_id)?;

    let sort_order = if let Some(order) = input.sort_order {
        if order != 0 {
            order
        } else {
            next_sort_order(connection, input.project_id)?
        }
    } else {
        next_sort_order(connection, input.project_id)?
    };

    connection.execute(
        r#"
        INSERT INTO timeline_events (
            project_id,
            title,
            description,
            event_date,
            sort_order,
            era,
            era_color,
            linked_note_id,
            created_branch_id
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
        "#,
        params![
            input.project_id,
            input.title,
            input.description.clone().unwrap_or_default(),
            input.event_date,
            sort_order,
            input.era.clone().unwrap_or_default(),
            input.era_color.clone().unwrap_or_default(),
            input.linked_note_id,
            created_branch_id
        ],
    )?;

    let id = i32::try_from(connection.last_insert_rowid()).map_err(|_| {
        AppError::internal(
            "TIMELINE_EVENT_ID_RANGE_ERROR",
            "Created timeline event id is out of range",
        )
    })?;

    let view_branch_id = if input.branch_id.is_some() {
        input.branch_id
    } else {
        branch_scope::effective_branch_id_for_read(connection, input.project_id, None)?
    };

    get_timeline_event_by_id(
        connection,
        &GetTimelineEventInput {
            id,
            branch_id: view_branch_id,
        },
    )
}

pub fn update_timeline_event(
    connection: &Connection,
    input: &UpdateTimelineEventInput,
) -> Result<TimelineEvent> {
    let _ = get_timeline_event_by_id(
        connection,
        &GetTimelineEventInput {
            id: input.id,
            branch_id: input.branch_id,
        },
    )?;

    if let Some(branch_id) = input.branch_id {
        let patch = build_patch(input);
        if patch != Value::Object(Map::new()) {
            save_upsert_override(connection, branch_id, "timeline_event", input.id, &patch)?;
        }
        return get_timeline_event_by_id(
            connection,
            &GetTimelineEventInput {
                id: input.id,
                branch_id: Some(branch_id),
            },
        );
    }

    let mut fields: Vec<String> = Vec::new();
    let mut values: Vec<SqlValue> = Vec::new();

    if let Some(value) = input.title.as_deref() {
        fields.push("title = ?".to_string());
        values.push(SqlValue::Text(value.to_string()));
    }
    if let Some(value) = input.description.as_deref() {
        fields.push("description = ?".to_string());
        values.push(SqlValue::Text(value.to_string()));
    }
    if let Some(value) = input.event_date.as_deref() {
        fields.push("event_date = ?".to_string());
        values.push(SqlValue::Text(value.to_string()));
    }
    if let Some(value) = input.sort_order {
        fields.push("sort_order = ?".to_string());
        values.push(SqlValue::Integer(i64::from(value)));
    }
    if let Some(value) = input.era.as_deref() {
        fields.push("era = ?".to_string());
        values.push(SqlValue::Text(value.to_string()));
    }
    if let Some(value) = input.era_color.as_deref() {
        fields.push("era_color = ?".to_string());
        values.push(SqlValue::Text(value.to_string()));
    }
    if let Some(linked_note) = input.linked_note_id {
        match linked_note {
            Some(note_id) => {
                fields.push("linked_note_id = ?".to_string());
                values.push(SqlValue::Integer(i64::from(note_id)));
            }
            None => fields.push("linked_note_id = NULL".to_string()),
        }
    }

    if !fields.is_empty() {
        fields.push("updated_at = datetime('now')".to_string());
        values.push(SqlValue::Integer(i64::from(input.id)));
        let query = format!(
            "UPDATE timeline_events SET {} WHERE id = ?",
            fields.join(", ")
        );
        connection.execute(&query, params_from_iter(values.iter()))?;
    }

    get_timeline_event_by_id(
        connection,
        &GetTimelineEventInput {
            id: input.id,
            branch_id: None,
        },
    )
}

pub fn delete_timeline_event(
    connection: &Connection,
    input: &DeleteTimelineEventInput,
) -> Result<()> {
    let _ = get_timeline_event_by_id(
        connection,
        &GetTimelineEventInput {
            id: input.id,
            branch_id: input.branch_id,
        },
    )?;

    if let Some(branch_id) = input.branch_id {
        save_delete_override(connection, branch_id, "timeline_event", input.id)?;
        return Ok(());
    }

    connection.execute(
        "DELETE FROM timeline_events WHERE id = ?1",
        params![input.id],
    )?;
    Ok(())
}

pub fn reorder_timeline_events(
    connection: &Connection,
    input: &ReorderTimelineInput,
) -> Result<Vec<TimelineEvent>> {
    if let Some(branch_id) = input.branch_id {
        let transaction = connection.unchecked_transaction()?;
        for (index, id) in input.ordered_ids.iter().enumerate() {
            let exists = transaction
                .query_row(
                    "SELECT id FROM timeline_events WHERE id = ?1 AND project_id = ?2",
                    params![id, input.project_id],
                    |row| row.get::<_, i32>(0),
                )
                .optional()?;
            if exists.is_some() {
                let patch = Value::Object(
                    [(
                        "sortOrder".to_string(),
                        Value::Number(((index + 1) as i64).into()),
                    )]
                    .into_iter()
                    .collect(),
                );
                save_upsert_override(&transaction, branch_id, "timeline_event", *id, &patch)?;
            }
        }
        transaction.commit()?;

        return list_timeline_events(
            connection,
            &TimelineListInput {
                project_id: input.project_id,
                era: None,
                branch_id: Some(branch_id),
            },
        );
    }

    let transaction = connection.unchecked_transaction()?;
    for (index, id) in input.ordered_ids.iter().enumerate() {
        transaction.execute(
            "UPDATE timeline_events SET sort_order = ?1 WHERE id = ?2 AND project_id = ?3",
            params![
                i32::try_from(index + 1).unwrap_or(i32::MAX),
                id,
                input.project_id
            ],
        )?;
    }
    transaction.commit()?;

    list_timeline_events(
        connection,
        &TimelineListInput {
            project_id: input.project_id,
            era: None,
            branch_id: None,
        },
    )
}

pub fn set_timeline_event_tags(
    connection: &Connection,
    input: &SetTimelineTagsInput,
) -> Result<Vec<Tag>> {
    let event = get_timeline_event_by_id(
        connection,
        &GetTimelineEventInput {
            id: input.id,
            branch_id: input.branch_id,
        },
    )?;

    tag_associations::set_tags_for_entity(
        connection,
        &SetEntityTagsInput {
            project_id: event.project_id,
            entity_type: "timeline_event".to_string(),
            entity_id: input.id,
            tag_ids: input.tag_ids.clone(),
        },
    )
}

fn attach_tags(connection: &Connection, events: &mut [TimelineEvent]) -> Result<()> {
    for event in events.iter_mut() {
        event.tags = tag_associations::get_tags_for_entity(
            connection,
            &EntityTagsInput {
                project_id: event.project_id,
                entity_type: "timeline_event".to_string(),
                entity_id: event.id,
            },
        )?;
    }
    Ok(())
}

fn next_sort_order(connection: &Connection, project_id: i32) -> Result<i32> {
    let max_order = connection
        .query_row(
            "SELECT MAX(sort_order) FROM timeline_events WHERE project_id = ?1",
            params![project_id],
            |row| row.get::<_, Option<i32>>(0),
        )
        .optional()?
        .flatten()
        .unwrap_or(0);
    Ok(max_order + 1)
}

fn build_patch(input: &UpdateTimelineEventInput) -> Value {
    let mut patch = Map::new();
    if let Some(value) = input.title.as_ref() {
        patch.insert("title".to_string(), Value::String(value.clone()));
    }
    if let Some(value) = input.description.as_ref() {
        patch.insert("description".to_string(), Value::String(value.clone()));
    }
    if let Some(value) = input.event_date.as_ref() {
        patch.insert("eventDate".to_string(), Value::String(value.clone()));
    }
    if let Some(value) = input.sort_order {
        patch.insert("sortOrder".to_string(), Value::Number(value.into()));
    }
    if let Some(value) = input.era.as_ref() {
        patch.insert("era".to_string(), Value::String(value.clone()));
    }
    if let Some(value) = input.era_color.as_ref() {
        patch.insert("eraColor".to_string(), Value::String(value.clone()));
    }
    if let Some(value) = input.linked_note_id {
        patch.insert(
            "linkedNoteId".to_string(),
            match value {
                Some(id) => Value::Number(id.into()),
                None => Value::Null,
            },
        );
    }
    Value::Object(patch)
}

fn apply_overrides(
    events: Vec<TimelineEvent>,
    overrides: HashMap<i32, BranchOverride>,
) -> Result<Vec<TimelineEvent>> {
    let mut result = Vec::new();
    for event in events {
        let override_row = overrides.get(&event.id);
        if let Some(projected) = branch_overlay::apply_item_overlay(Some(event), override_row)? {
            result.push(projected);
        }
    }
    Ok(result)
}

fn list_branch_overrides(
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
    Ok(rows
        .collect::<std::result::Result<Vec<_>, _>>()?
        .into_iter()
        .map(|row| (row.entity_id, row))
        .collect())
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

    let mut merged = patch_json.clone();
    if let Some((op, patch)) = existing {
        if op == "upsert" {
            let mut base = match serde_json::from_str::<Value>(&patch) {
                Ok(Value::Object(map)) => Value::Object(map),
                _ => Value::Object(Map::new()),
            };
            if let (Value::Object(base_map), Value::Object(new_map)) =
                (&mut base, patch_json.clone())
            {
                for (key, value) in new_map {
                    base_map.insert(key, value);
                }
            }
            merged = base;
        }
    }

    connection.execute(
        r#"
        INSERT INTO branch_overrides (branch_id, entity_type, entity_id, op, patch_json, updated_at)
        VALUES (?1, ?2, ?3, 'upsert', ?4, datetime('now'))
        ON CONFLICT(branch_id, entity_type, entity_id)
        DO UPDATE SET op = 'upsert', patch_json = excluded.patch_json, updated_at = datetime('now')
        "#,
        params![branch_id, entity_type, entity_id, merged.to_string()],
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

fn map_timeline_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<TimelineEventRow> {
    Ok(TimelineEventRow {
        id: row.get("id")?,
        project_id: row.get("project_id")?,
        title: row.get("title")?,
        description: row.get("description")?,
        event_date: row.get("event_date")?,
        sort_order: row.get("sort_order")?,
        era: row.get("era")?,
        era_color: row.get("era_color")?,
        linked_note_id: row.get("linked_note_id")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        created_branch_id: row.get("created_branch_id")?,
    })
}

fn map_timeline_event(row: TimelineEventRow) -> TimelineEvent {
    TimelineEvent {
        id: row.id,
        project_id: row.project_id,
        title: row.title,
        description: row.description,
        event_date: row.event_date,
        sort_order: row.sort_order,
        era: row.era,
        era_color: row.era_color,
        linked_note_id: row.linked_note_id,
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

    fn setup_connection() -> Connection {
        let connection = Connection::open_in_memory().expect("in-memory db");
        connection
            .execute_batch(
                r#"
                CREATE TABLE projects (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
                CREATE TABLE notes (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  project_id INTEGER NOT NULL,
                  title TEXT NOT NULL
                );
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
                CREATE TABLE timeline_events (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  project_id INTEGER NOT NULL,
                  title TEXT NOT NULL,
                  description TEXT DEFAULT '',
                  event_date TEXT NOT NULL,
                  sort_order INTEGER DEFAULT 0,
                  era TEXT DEFAULT '',
                  era_color TEXT DEFAULT '',
                  linked_note_id INTEGER,
                  created_branch_id INTEGER,
                  created_at TEXT DEFAULT (datetime('now')),
                  updated_at TEXT DEFAULT (datetime('now'))
                );
                "#,
            )
            .expect("schema");

        connection
            .execute("INSERT INTO projects (id, name) VALUES (1, 'P1')", [])
            .expect("project");
        connection
            .execute(
                "INSERT INTO notes (id, project_id, title) VALUES (1, 1, 'N1')",
                [],
            )
            .expect("note");
        connection
            .execute("INSERT INTO scenario_branches (id, project_id, name, parent_branch_id, base_revision, is_main, created_at, updated_at) VALUES (10,1,'main',NULL,0,1,'2025-01-01 00:00:00','2025-01-01 00:00:00')", [])
            .expect("main");
        connection
            .execute("INSERT INTO scenario_branches (id, project_id, name, parent_branch_id, base_revision, is_main, created_at, updated_at) VALUES (11,1,'child',10,0,0,'2099-02-01 00:00:00','2099-02-01 00:00:00')", [])
            .expect("child");
        connection
            .execute(
                "INSERT INTO tags (id, project_id, name, color) VALUES (1,1,'alpha','#111111')",
                [],
            )
            .expect("tag");
        connection
    }

    #[test]
    fn crud_and_reorder_non_branch() {
        let connection = setup_connection();
        let a = create_timeline_event(
            &connection,
            &CreateTimelineEventInput {
                project_id: 1,
                title: "A".to_string(),
                description: Some("".to_string()),
                event_date: "100".to_string(),
                sort_order: Some(0),
                era: Some("era".to_string()),
                era_color: Some("#fff".to_string()),
                linked_note_id: Some(1),
                branch_id: None,
            },
        )
        .unwrap();
        let b = create_timeline_event(
            &connection,
            &CreateTimelineEventInput {
                project_id: 1,
                title: "B".to_string(),
                description: Some("".to_string()),
                event_date: "101".to_string(),
                sort_order: Some(0),
                era: Some("era".to_string()),
                era_color: Some("#fff".to_string()),
                linked_note_id: None,
                branch_id: None,
            },
        )
        .unwrap();

        let reordered = reorder_timeline_events(
            &connection,
            &ReorderTimelineInput {
                project_id: 1,
                ordered_ids: vec![b.id, a.id],
                branch_id: None,
            },
        )
        .unwrap();

        assert_eq!(reordered[0].id, b.id);

        delete_timeline_event(
            &connection,
            &DeleteTimelineEventInput {
                id: a.id,
                branch_id: None,
            },
        )
        .unwrap();
        assert!(get_timeline_event_by_id(
            &connection,
            &GetTimelineEventInput {
                id: a.id,
                branch_id: None
            }
        )
        .is_err());
    }

    #[test]
    fn branch_update_and_tags() {
        let connection = setup_connection();
        let created = create_timeline_event(
            &connection,
            &CreateTimelineEventInput {
                project_id: 1,
                title: "Base".to_string(),
                description: Some("D".to_string()),
                event_date: "100".to_string(),
                sort_order: Some(1),
                era: Some("e".to_string()),
                era_color: Some("#aaa".to_string()),
                linked_note_id: None,
                branch_id: Some(10),
            },
        )
        .unwrap();

        let child = update_timeline_event(
            &connection,
            &UpdateTimelineEventInput {
                id: created.id,
                title: Some("Child".to_string()),
                description: None,
                event_date: None,
                sort_order: None,
                era: None,
                era_color: None,
                linked_note_id: None,
                branch_id: Some(11),
            },
        )
        .unwrap();
        let main = get_timeline_event_by_id(
            &connection,
            &GetTimelineEventInput {
                id: created.id,
                branch_id: Some(10),
            },
        )
        .unwrap();
        assert_eq!(child.title, "Child");
        assert_eq!(main.title, "Base");

        let tags = set_timeline_event_tags(
            &connection,
            &SetTimelineTagsInput {
                id: created.id,
                tag_ids: vec![1, 1],
                branch_id: Some(11),
            },
        )
        .unwrap();
        assert_eq!(tags.len(), 1);
    }
}
