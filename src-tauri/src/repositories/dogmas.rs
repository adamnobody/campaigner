use std::collections::HashMap;

use rusqlite::{params, params_from_iter, types::Value as SqlValue, Connection, OptionalExtension};
use serde_json::{Map, Value};

use crate::error::{AppError, Result};
use crate::models::branch::{BranchOverride, OverlayOperation};
use crate::models::dogma::{
    CreateDogmaInput, DeleteDogmaInput, Dogma, DogmasListInput, DogmasListResult, GetDogmaInput,
    ReorderDogmasInput, SetDogmaTagsInput, UpdateDogmaInput,
};
use crate::models::tag::Tag;
use crate::models::tag_association::{EntityTagsInput, SetEntityTagsInput};
use crate::services::branch_overlay;
use crate::services::branch_scope;
use crate::services::tag_associations;

#[derive(Debug, Clone)]
struct DogmaRow {
    id: i32,
    project_id: i32,
    title: String,
    category: String,
    description: String,
    impact: String,
    exceptions: String,
    is_public: bool,
    importance: String,
    status: String,
    sort_order: i32,
    icon: String,
    color: String,
    created_at: String,
    updated_at: String,
    created_branch_id: Option<i32>,
}

pub fn list_dogmas(connection: &Connection, input: &DogmasListInput) -> Result<DogmasListResult> {
    let mut query = String::from(
        r#"
        SELECT
            id,
            project_id,
            title,
            category,
            description,
            impact,
            exceptions,
            is_public,
            importance,
            status,
            sort_order,
            icon,
            color,
            created_at,
            updated_at,
            created_branch_id
        FROM dogmas
        WHERE project_id = ?
        "#,
    );

    let mut params = vec![SqlValue::Integer(i64::from(input.project_id))];

    if let Some(category) = input.category.as_deref().filter(|value| !value.is_empty()) {
        query.push_str(" AND category = ?");
        params.push(SqlValue::Text(category.to_string()));
    }
    if let Some(importance) = input
        .importance
        .as_deref()
        .filter(|value| !value.is_empty())
    {
        query.push_str(" AND importance = ?");
        params.push(SqlValue::Text(importance.to_string()));
    }
    if let Some(status) = input.status.as_deref().filter(|value| !value.is_empty()) {
        query.push_str(" AND status = ?");
        params.push(SqlValue::Text(status.to_string()));
    }
    if let Some(search) = input.search.as_deref().filter(|value| !value.is_empty()) {
        let search_term = format!("%{search}%");
        query.push_str(" AND (title LIKE ? OR description LIKE ?)");
        params.push(SqlValue::Text(search_term.clone()));
        params.push(SqlValue::Text(search_term));
    }

    query.push_str(" ORDER BY sort_order ASC, created_at DESC");

    let mut statement = connection.prepare(&query)?;
    let rows = statement.query_map(params_from_iter(params.iter()), map_dogma_row)?;
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
            visible.push(map_dogma(row));
        }
    }

    let projected = if let Some(branch_id) = input.branch_id {
        let overrides = list_branch_overrides(connection, branch_id, "dogma")?;
        apply_overrides(visible, overrides)?
    } else {
        visible
    };

    let total = projected.len() as i32;
    let items = apply_offset_limit(projected, input.offset, input.limit);
    let mut items_with_tags = items;
    attach_tags(connection, &mut items_with_tags)?;

    Ok(DogmasListResult {
        items: items_with_tags,
        total,
    })
}

pub fn get_dogma_by_id(connection: &Connection, input: &GetDogmaInput) -> Result<Dogma> {
    let row = connection
        .query_row(
            r#"
            SELECT
                id,
                project_id,
                title,
                category,
                description,
                impact,
                exceptions,
                is_public,
                importance,
                status,
                sort_order,
                icon,
                color,
                created_at,
                updated_at,
                created_branch_id
            FROM dogmas
            WHERE id = ?1
            "#,
            params![input.id],
            map_dogma_row,
        )
        .optional()?
        .ok_or_else(|| AppError::internal("DOGMA_NOT_FOUND", "Dogma not found"))?;

    let view_branch_id =
        branch_scope::effective_branch_id_for_read(connection, row.project_id, input.branch_id)?;

    if !branch_scope::is_entity_visible_in_branch(
        connection,
        row.project_id,
        view_branch_id,
        row.created_branch_id,
        Some(row.created_at.as_str()),
    )? {
        return Err(AppError::internal("DOGMA_NOT_FOUND", "Dogma not found"));
    }

    let mut dogma = map_dogma(row);
    if let Some(branch_id) = view_branch_id {
        if let Some(override_row) = get_branch_override(connection, branch_id, "dogma", dogma.id)? {
            dogma = branch_overlay::apply_item_overlay(Some(dogma), Some(&override_row))?
                .ok_or_else(|| AppError::internal("DOGMA_NOT_FOUND", "Dogma not found"))?;
        }
    }

    dogma.tags = tag_associations::get_tags_for_entity(
        connection,
        &EntityTagsInput {
            project_id: dogma.project_id,
            entity_type: "dogma".to_string(),
            entity_id: dogma.id,
        },
    )?;

    Ok(dogma)
}

pub fn create_dogma(connection: &Connection, input: &CreateDogmaInput) -> Result<Dogma> {
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
        INSERT INTO dogmas (
            project_id,
            title,
            category,
            description,
            impact,
            exceptions,
            is_public,
            importance,
            status,
            sort_order,
            icon,
            color,
            created_branch_id
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
        "#,
        params![
            input.project_id,
            input.title,
            input.category,
            input.description.clone().unwrap_or_default(),
            input.impact.clone().unwrap_or_default(),
            input.exceptions.clone().unwrap_or_default(),
            if input.is_public.unwrap_or(true) {
                1
            } else {
                0
            },
            input
                .importance
                .clone()
                .unwrap_or_else(|| "major".to_string()),
            input.status.clone().unwrap_or_else(|| "active".to_string()),
            sort_order,
            input.icon.clone().unwrap_or_default(),
            input.color.clone().unwrap_or_default(),
            created_branch_id
        ],
    )?;

    let id = i32::try_from(connection.last_insert_rowid()).map_err(|_| {
        AppError::internal("DOGMA_ID_RANGE_ERROR", "Created dogma id is out of range")
    })?;

    let view_branch_id = if input.branch_id.is_some() {
        input.branch_id
    } else {
        branch_scope::effective_branch_id_for_read(connection, input.project_id, None)?
    };

    get_dogma_by_id(
        connection,
        &GetDogmaInput {
            id,
            branch_id: view_branch_id,
        },
    )
}

pub fn update_dogma(connection: &Connection, input: &UpdateDogmaInput) -> Result<Dogma> {
    let _ = get_dogma_by_id(
        connection,
        &GetDogmaInput {
            id: input.id,
            branch_id: input.branch_id,
        },
    )?;

    if let Some(branch_id) = input.branch_id {
        let patch = build_patch(input);
        if patch != Value::Object(Map::new()) {
            save_upsert_override(connection, branch_id, "dogma", input.id, &patch)?;
        }
        return get_dogma_by_id(
            connection,
            &GetDogmaInput {
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
    if let Some(value) = input.category.as_deref() {
        fields.push("category = ?".to_string());
        values.push(SqlValue::Text(value.to_string()));
    }
    if let Some(value) = input.description.as_deref() {
        fields.push("description = ?".to_string());
        values.push(SqlValue::Text(value.to_string()));
    }
    if let Some(value) = input.impact.as_deref() {
        fields.push("impact = ?".to_string());
        values.push(SqlValue::Text(value.to_string()));
    }
    if let Some(value) = input.exceptions.as_deref() {
        fields.push("exceptions = ?".to_string());
        values.push(SqlValue::Text(value.to_string()));
    }
    if let Some(value) = input.is_public {
        fields.push("is_public = ?".to_string());
        values.push(SqlValue::Integer(if value { 1 } else { 0 }));
    }
    if let Some(value) = input.importance.as_deref() {
        fields.push("importance = ?".to_string());
        values.push(SqlValue::Text(value.to_string()));
    }
    if let Some(value) = input.status.as_deref() {
        fields.push("status = ?".to_string());
        values.push(SqlValue::Text(value.to_string()));
    }
    if let Some(value) = input.sort_order {
        fields.push("sort_order = ?".to_string());
        values.push(SqlValue::Integer(i64::from(value)));
    }
    if let Some(value) = input.icon.as_deref() {
        fields.push("icon = ?".to_string());
        values.push(SqlValue::Text(value.to_string()));
    }
    if let Some(value) = input.color.as_deref() {
        fields.push("color = ?".to_string());
        values.push(SqlValue::Text(value.to_string()));
    }

    if !fields.is_empty() {
        fields.push("updated_at = datetime('now')".to_string());
        values.push(SqlValue::Integer(i64::from(input.id)));
        let query = format!("UPDATE dogmas SET {} WHERE id = ?", fields.join(", "));
        connection.execute(&query, params_from_iter(values.iter()))?;
    }

    get_dogma_by_id(
        connection,
        &GetDogmaInput {
            id: input.id,
            branch_id: None,
        },
    )
}

pub fn delete_dogma(connection: &Connection, input: &DeleteDogmaInput) -> Result<()> {
    let _ = get_dogma_by_id(
        connection,
        &GetDogmaInput {
            id: input.id,
            branch_id: input.branch_id,
        },
    )?;

    if let Some(branch_id) = input.branch_id {
        save_delete_override(connection, branch_id, "dogma", input.id)?;
        return Ok(());
    }

    connection.execute("DELETE FROM dogmas WHERE id = ?1", params![input.id])?;
    Ok(())
}

pub fn reorder_dogmas(
    connection: &Connection,
    input: &ReorderDogmasInput,
) -> Result<DogmasListResult> {
    if let Some(branch_id) = input.branch_id {
        let transaction = connection.unchecked_transaction()?;
        for (index, id) in input.ordered_ids.iter().enumerate() {
            let exists = transaction
                .query_row(
                    "SELECT id FROM dogmas WHERE id = ?1 AND project_id = ?2",
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
                save_upsert_override(&transaction, branch_id, "dogma", *id, &patch)?;
            }
        }
        transaction.commit()?;

        return list_dogmas(
            connection,
            &DogmasListInput {
                project_id: input.project_id,
                category: None,
                importance: None,
                status: None,
                search: None,
                limit: None,
                offset: None,
                branch_id: Some(branch_id),
            },
        );
    }

    let transaction = connection.unchecked_transaction()?;
    for (index, id) in input.ordered_ids.iter().enumerate() {
        transaction.execute(
            "UPDATE dogmas SET sort_order = ?1 WHERE id = ?2 AND project_id = ?3",
            params![
                i32::try_from(index + 1).unwrap_or(i32::MAX),
                id,
                input.project_id
            ],
        )?;
    }
    transaction.commit()?;

    list_dogmas(
        connection,
        &DogmasListInput {
            project_id: input.project_id,
            category: None,
            importance: None,
            status: None,
            search: None,
            limit: None,
            offset: None,
            branch_id: None,
        },
    )
}

pub fn set_dogma_tags(connection: &Connection, input: &SetDogmaTagsInput) -> Result<Vec<Tag>> {
    let dogma = get_dogma_by_id(
        connection,
        &GetDogmaInput {
            id: input.id,
            branch_id: input.branch_id,
        },
    )?;

    tag_associations::set_tags_for_entity(
        connection,
        &SetEntityTagsInput {
            project_id: dogma.project_id,
            entity_type: "dogma".to_string(),
            entity_id: input.id,
            tag_ids: input.tag_ids.clone(),
        },
    )
}

fn apply_offset_limit(items: Vec<Dogma>, offset: Option<i32>, limit: Option<i32>) -> Vec<Dogma> {
    let offset_value = offset.unwrap_or(0).max(0) as usize;
    if offset_value >= items.len() {
        return Vec::new();
    }
    let sliced = items.into_iter().skip(offset_value);
    if let Some(limit_value) = limit {
        sliced.take(limit_value.max(0) as usize).collect()
    } else {
        sliced.collect()
    }
}

fn attach_tags(connection: &Connection, dogmas: &mut [Dogma]) -> Result<()> {
    for dogma in dogmas.iter_mut() {
        dogma.tags = tag_associations::get_tags_for_entity(
            connection,
            &EntityTagsInput {
                project_id: dogma.project_id,
                entity_type: "dogma".to_string(),
                entity_id: dogma.id,
            },
        )?;
    }
    Ok(())
}

fn next_sort_order(connection: &Connection, project_id: i32) -> Result<i32> {
    let max_order = connection
        .query_row(
            "SELECT MAX(sort_order) FROM dogmas WHERE project_id = ?1",
            params![project_id],
            |row| row.get::<_, Option<i32>>(0),
        )
        .optional()?
        .flatten()
        .unwrap_or(0);
    Ok(max_order + 1)
}

fn build_patch(input: &UpdateDogmaInput) -> Value {
    let mut patch = Map::new();
    if let Some(value) = input.title.as_ref() {
        patch.insert("title".to_string(), Value::String(value.clone()));
    }
    if let Some(value) = input.category.as_ref() {
        patch.insert("category".to_string(), Value::String(value.clone()));
    }
    if let Some(value) = input.description.as_ref() {
        patch.insert("description".to_string(), Value::String(value.clone()));
    }
    if let Some(value) = input.impact.as_ref() {
        patch.insert("impact".to_string(), Value::String(value.clone()));
    }
    if let Some(value) = input.exceptions.as_ref() {
        patch.insert("exceptions".to_string(), Value::String(value.clone()));
    }
    if let Some(value) = input.is_public {
        patch.insert("isPublic".to_string(), Value::Bool(value));
    }
    if let Some(value) = input.importance.as_ref() {
        patch.insert("importance".to_string(), Value::String(value.clone()));
    }
    if let Some(value) = input.status.as_ref() {
        patch.insert("status".to_string(), Value::String(value.clone()));
    }
    if let Some(value) = input.sort_order {
        patch.insert("sortOrder".to_string(), Value::Number(value.into()));
    }
    if let Some(value) = input.icon.as_ref() {
        patch.insert("icon".to_string(), Value::String(value.clone()));
    }
    if let Some(value) = input.color.as_ref() {
        patch.insert("color".to_string(), Value::String(value.clone()));
    }
    Value::Object(patch)
}

fn apply_overrides(
    dogmas: Vec<Dogma>,
    overrides: HashMap<i32, BranchOverride>,
) -> Result<Vec<Dogma>> {
    let mut result = Vec::new();
    for dogma in dogmas {
        let override_row = overrides.get(&dogma.id);
        if let Some(projected) = branch_overlay::apply_item_overlay(Some(dogma), override_row)? {
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

fn map_dogma_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<DogmaRow> {
    Ok(DogmaRow {
        id: row.get("id")?,
        project_id: row.get("project_id")?,
        title: row.get("title")?,
        category: row.get("category")?,
        description: row.get("description")?,
        impact: row.get("impact")?,
        exceptions: row.get("exceptions")?,
        is_public: row.get::<_, i32>("is_public")? != 0,
        importance: row.get("importance")?,
        status: row.get("status")?,
        sort_order: row.get("sort_order")?,
        icon: row.get("icon")?,
        color: row.get("color")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        created_branch_id: row.get("created_branch_id")?,
    })
}

fn map_dogma(row: DogmaRow) -> Dogma {
    Dogma {
        id: row.id,
        project_id: row.project_id,
        title: row.title,
        category: row.category,
        description: row.description,
        impact: row.impact,
        exceptions: row.exceptions,
        is_public: row.is_public,
        importance: row.importance,
        status: row.status,
        sort_order: row.sort_order,
        icon: row.icon,
        color: row.color,
        tags: Vec::new(),
        created_at: row.created_at,
        updated_at: row.updated_at,
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
                CREATE TABLE dogmas (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  project_id INTEGER NOT NULL,
                  title TEXT NOT NULL,
                  category TEXT NOT NULL,
                  description TEXT DEFAULT '',
                  impact TEXT DEFAULT '',
                  exceptions TEXT DEFAULT '',
                  is_public INTEGER DEFAULT 1,
                  importance TEXT DEFAULT 'major',
                  status TEXT DEFAULT 'active',
                  sort_order INTEGER DEFAULT 0,
                  icon TEXT DEFAULT '',
                  color TEXT DEFAULT '',
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
                "INSERT INTO scenario_branches (id, project_id, name, parent_branch_id, base_revision, is_main, created_at, updated_at) VALUES (10,1,'main',NULL,0,1,'2025-01-01 00:00:00','2025-01-01 00:00:00')",
                [],
            )
            .expect("main");
        connection
            .execute(
                "INSERT INTO scenario_branches (id, project_id, name, parent_branch_id, base_revision, is_main, created_at, updated_at) VALUES (11,1,'child',10,0,0,'2099-02-01 00:00:00','2099-02-01 00:00:00')",
                [],
            )
            .expect("child");
        connection
    }

    #[test]
    fn branch_overlay_update_and_delete_do_not_mutate_main() {
        let connection = setup_connection();
        let created = create_dogma(
            &connection,
            &CreateDogmaInput {
                project_id: 1,
                title: "Base Dogma".to_string(),
                category: "magic".to_string(),
                description: Some("desc".to_string()),
                impact: Some("impact".to_string()),
                exceptions: Some("except".to_string()),
                is_public: Some(true),
                importance: Some("major".to_string()),
                status: Some("active".to_string()),
                sort_order: Some(0),
                icon: Some("✨".to_string()),
                color: Some("#111111".to_string()),
                branch_id: Some(10),
            },
        )
        .unwrap();

        let updated_branch = update_dogma(
            &connection,
            &UpdateDogmaInput {
                id: created.id,
                title: Some("Child Dogma".to_string()),
                category: None,
                description: None,
                impact: None,
                exceptions: None,
                is_public: None,
                importance: None,
                status: None,
                sort_order: None,
                icon: None,
                color: None,
                branch_id: Some(11),
            },
        )
        .unwrap();
        let main_after_update = get_dogma_by_id(
            &connection,
            &GetDogmaInput {
                id: created.id,
                branch_id: Some(10),
            },
        )
        .unwrap();

        assert_eq!(updated_branch.title, "Child Dogma");
        assert_eq!(main_after_update.title, "Base Dogma");

        delete_dogma(
            &connection,
            &DeleteDogmaInput {
                id: created.id,
                branch_id: Some(11),
            },
        )
        .unwrap();

        assert!(get_dogma_by_id(
            &connection,
            &GetDogmaInput {
                id: created.id,
                branch_id: Some(11),
            }
        )
        .is_err());
        assert!(get_dogma_by_id(
            &connection,
            &GetDogmaInput {
                id: created.id,
                branch_id: Some(10),
            }
        )
        .is_ok());
    }

    #[test]
    fn reorder_in_branch_only_changes_branch_projection() {
        let connection = setup_connection();
        let first = create_dogma(
            &connection,
            &CreateDogmaInput {
                project_id: 1,
                title: "First".to_string(),
                category: "magic".to_string(),
                description: None,
                impact: None,
                exceptions: None,
                is_public: None,
                importance: None,
                status: None,
                sort_order: Some(1),
                icon: None,
                color: None,
                branch_id: Some(10),
            },
        )
        .unwrap();
        let second = create_dogma(
            &connection,
            &CreateDogmaInput {
                project_id: 1,
                title: "Second".to_string(),
                category: "history".to_string(),
                description: None,
                impact: None,
                exceptions: None,
                is_public: None,
                importance: None,
                status: None,
                sort_order: Some(2),
                icon: None,
                color: None,
                branch_id: Some(10),
            },
        )
        .unwrap();

        let main_before = list_dogmas(
            &connection,
            &DogmasListInput {
                project_id: 1,
                category: None,
                importance: None,
                status: None,
                search: None,
                limit: None,
                offset: None,
                branch_id: None,
            },
        )
        .unwrap();

        let branch_reordered = reorder_dogmas(
            &connection,
            &ReorderDogmasInput {
                project_id: 1,
                ordered_ids: vec![second.id, first.id],
                branch_id: Some(11),
            },
        )
        .unwrap();
        let main_after = list_dogmas(
            &connection,
            &DogmasListInput {
                project_id: 1,
                category: None,
                importance: None,
                status: None,
                search: None,
                limit: None,
                offset: None,
                branch_id: None,
            },
        )
        .unwrap();

        let branch_first_sort = branch_reordered
            .items
            .iter()
            .find(|item| item.id == second.id)
            .map(|item| item.sort_order)
            .unwrap();
        let branch_second_sort = branch_reordered
            .items
            .iter()
            .find(|item| item.id == first.id)
            .map(|item| item.sort_order)
            .unwrap();

        let main_first_before = main_before
            .items
            .iter()
            .find(|item| item.id == first.id)
            .map(|item| item.sort_order)
            .unwrap();
        let main_second_before = main_before
            .items
            .iter()
            .find(|item| item.id == second.id)
            .map(|item| item.sort_order)
            .unwrap();
        let main_first_after = main_after
            .items
            .iter()
            .find(|item| item.id == first.id)
            .map(|item| item.sort_order)
            .unwrap();
        let main_second_after = main_after
            .items
            .iter()
            .find(|item| item.id == second.id)
            .map(|item| item.sort_order)
            .unwrap();

        assert_eq!(branch_first_sort, 1);
        assert_eq!(branch_second_sort, 2);
        assert_eq!(main_first_before, main_first_after);
        assert_eq!(main_second_before, main_second_after);
    }
}
