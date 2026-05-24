use std::collections::HashMap;

use rusqlite::{
    params, params_from_iter, types::Value as SqlValue, Connection, OptionalExtension, Row,
};
use serde_json::{Map, Value};

use crate::error::{AppError, Result};
use crate::models::branch::BranchOverride;
use crate::models::canvas::{
    BulkDeleteCanvasObjectsInput, BulkUpsertCanvasObjectsInput, CANVAS_OBJECT_KINDS, CanvasLayer,
    CanvasObject, CanvasReconcileResult, CanvasScene, CanvasTerritorySummary, CreateCanvasLayerInput,
    CreateCanvasObjectInput, CreateCanvasSceneInput, DeleteCanvasLayerInput,
    DeleteCanvasObjectInput, DeleteCanvasSceneInput, GetCanvasObjectInput, GetCanvasSceneInput,
    GetCanvasSceneTreeInput, GetRootCanvasSceneInput, ListCanvasLayersInput,
    ListCanvasObjectsInput, ListCanvasTerritorySummariesInput, ReconcileCanvasSceneInput,
    ReorderCanvasLayersInput, ReorderCanvasObjectsInput, UpdateCanvasLayerInput,
    UpdateCanvasObjectInput, UpdateCanvasSceneInput, UpsertCanvasObjectInput,
};
use crate::services::branch_overlay;
use crate::services::branch_scope;

const CANVAS_LAYER_KINDS: &[&str] = &["background", "content", "overlay", "annotation", "ui_helper"];

#[derive(Debug, Clone)]
struct SceneRow {
    id: i32,
    project_id: i32,
    parent_scene_id: Option<i32>,
    parent_object_id: Option<i32>,
    name: String,
    background_path: Option<String>,
    viewport_json: String,
    metadata_json: String,
    created_at: String,
    updated_at: String,
    created_branch_id: Option<i32>,
}

#[derive(Debug, Clone)]
struct LayerRow {
    id: i32,
    scene_id: i32,
    name: String,
    kind: String,
    z_index: i32,
    is_hidden: i32,
    is_locked: i32,
    opacity: f64,
    blend_mode: String,
    metadata_json: String,
    created_at: String,
    updated_at: String,
    created_branch_id: Option<i32>,
}

#[derive(Debug, Clone)]
struct ObjectRow {
    id: i32,
    scene_id: i32,
    layer_id: i32,
    kind: String,
    name: Option<String>,
    z_index: i32,
    transform_json: String,
    geometry_json: String,
    style_json: String,
    content_json: String,
    resource_path: Option<String>,
    linked_note_id: Option<i32>,
    linked_scene_id: Option<i32>,
    is_hidden: i32,
    is_locked: i32,
    created_at: String,
    updated_at: String,
    created_branch_id: Option<i32>,
}

pub fn get_root_scene(connection: &Connection, input: &GetRootCanvasSceneInput) -> Result<Option<CanvasScene>> {
    let mut scenes = get_scene_tree(
        connection,
        &GetCanvasSceneTreeInput {
            project_id: input.project_id,
            branch_id: input.branch_id,
        },
    )?;
    Ok(scenes
        .drain(..)
        .find(|scene| scene.parent_scene_id.is_none()))
}

pub fn get_scene_tree(connection: &Connection, input: &GetCanvasSceneTreeInput) -> Result<Vec<CanvasScene>> {
    let mut statement = connection.prepare(
        r#"
        SELECT
          id, project_id, parent_scene_id, parent_object_id, name, background_path,
          viewport_json, metadata_json, created_at, updated_at, created_branch_id
        FROM canvas_scene
        WHERE project_id = ?1
        ORDER BY parent_scene_id, name
        "#,
    )?;
    let rows = statement.query_map(params![input.project_id], map_scene_row)?;
    let all_rows = rows.collect::<std::result::Result<Vec<_>, _>>()?;
    let view_branch =
        branch_scope::effective_branch_id_for_read(connection, input.project_id, input.branch_id)?;
    let mut visible = Vec::new();
    for row in all_rows {
        if branch_scope::is_entity_visible_in_branch(
            connection,
            input.project_id,
            view_branch,
            row.created_branch_id,
            Some(row.created_at.as_str()),
        )? {
            visible.push(scene_row_to_model(row));
        }
    }
    if let Some(branch_id) = input.branch_id {
        let overrides = list_branch_overrides(connection, branch_id, "canvas_scene")?;
        return apply_overrides(visible, overrides);
    }
    Ok(visible)
}

pub fn get_scene(connection: &Connection, input: &GetCanvasSceneInput) -> Result<CanvasScene> {
    let row = get_scene_row(connection, input.id)?;
    let view_branch =
        branch_scope::effective_branch_id_for_read(connection, row.project_id, input.branch_id)?;
    if !branch_scope::is_entity_visible_in_branch(
        connection,
        row.project_id,
        view_branch,
        row.created_branch_id,
        Some(row.created_at.as_str()),
    )? {
        return Err(AppError::internal("CANVAS_SCENE_NOT_FOUND", "Canvas scene not found"));
    }
    let mut scene = scene_row_to_model(row);
    if let Some(branch_id) = input.branch_id {
        let override_row = get_branch_override(connection, branch_id, "canvas_scene", input.id)?;
        scene = branch_overlay::apply_item_overlay(Some(scene), override_row.as_ref())?
            .ok_or_else(|| AppError::internal("CANVAS_SCENE_NOT_FOUND", "Canvas scene not found"))?;
    }
    Ok(scene)
}

pub fn create_scene(connection: &Connection, input: &CreateCanvasSceneInput) -> Result<CanvasScene> {
    if let Some(branch_id) = input.branch_id {
        branch_scope::assert_branch_belongs_to_project(connection, branch_id, input.project_id)?;
    }
    let created_branch_id =
        branch_scope::resolve_created_branch_id(connection, input.project_id, input.branch_id)?;
    connection.execute(
        r#"
        INSERT INTO canvas_scene (
          project_id, parent_scene_id, parent_object_id, name, background_path,
          viewport_json, metadata_json, created_branch_id
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
        "#,
        params![
            input.project_id,
            input.parent_scene_id,
            input.parent_object_id,
            input.name,
            input.background_path,
            value_or_empty_object(input.viewport_json.as_ref()).to_string(),
            value_or_empty_object(input.metadata_json.as_ref()).to_string(),
            created_branch_id
        ],
    )?;
    let id = i32::try_from(connection.last_insert_rowid()).map_err(|_| {
        AppError::internal(
            "CANVAS_SCENE_ID_RANGE_ERROR",
            "Created canvas scene id is out of range",
        )
    })?;
    get_scene(
        connection,
        &GetCanvasSceneInput {
            id,
            branch_id: input.branch_id,
        },
    )
}

pub fn update_scene(connection: &Connection, input: &UpdateCanvasSceneInput) -> Result<CanvasScene> {
    let current = get_scene_row(connection, input.id)?;
    if let Some(branch_id) = input.branch_id {
        let patch = build_scene_patch(input);
        if patch != Value::Object(Map::new()) {
            save_upsert_override(connection, branch_id, "canvas_scene", input.id, &patch)?;
        }
        return get_scene(
            connection,
            &GetCanvasSceneInput {
                id: input.id,
                branch_id: Some(branch_id),
            },
        );
    }
    let mut fields = Vec::<String>::new();
    let mut values = Vec::<SqlValue>::new();
    if let Some(value) = input.name.as_deref() {
        fields.push("name = ?".to_string());
        values.push(SqlValue::Text(value.to_string()));
    }
    if let Some(value) = input.background_path.as_ref() {
        fields.push("background_path = ?".to_string());
        values.push(SqlValue::Text(value.clone()));
    }
    if let Some(value) = input.viewport_json.as_ref() {
        fields.push("viewport_json = ?".to_string());
        values.push(SqlValue::Text(value_or_empty_object(Some(value)).to_string()));
    }
    if let Some(value) = input.metadata_json.as_ref() {
        fields.push("metadata_json = ?".to_string());
        values.push(SqlValue::Text(value_or_empty_object(Some(value)).to_string()));
    }
    if !fields.is_empty() {
        fields.push("updated_at = datetime('now')".to_string());
        values.push(SqlValue::Integer(i64::from(input.id)));
        let query = format!("UPDATE canvas_scene SET {} WHERE id = ?", fields.join(", "));
        connection.execute(&query, params_from_iter(values.iter()))?;
    }
    get_scene(
        connection,
        &GetCanvasSceneInput {
            id: input.id,
            branch_id: current.created_branch_id,
        },
    )
}

pub fn delete_scene(connection: &Connection, input: &DeleteCanvasSceneInput) -> Result<()> {
    let _ = get_scene(
        connection,
        &GetCanvasSceneInput {
            id: input.id,
            branch_id: input.branch_id,
        },
    )?;
    if let Some(branch_id) = input.branch_id {
        save_delete_override(connection, branch_id, "canvas_scene", input.id)?;
        return Ok(());
    }
    connection.execute("DELETE FROM canvas_scene WHERE id = ?1", params![input.id])?;
    Ok(())
}

pub fn list_layers(connection: &Connection, input: &ListCanvasLayersInput) -> Result<Vec<CanvasLayer>> {
    let scene = get_scene_row_by_id(connection, input.scene_id)?;
    let mut statement = connection.prepare(
        r#"
        SELECT
          id, scene_id, name, kind, z_index, is_hidden, is_locked, opacity, blend_mode,
          metadata_json, created_at, updated_at, created_branch_id
        FROM canvas_layer
        WHERE scene_id = ?1
        ORDER BY z_index ASC, id ASC
        "#,
    )?;
    let rows = statement.query_map(params![input.scene_id], map_layer_row)?;
    let all_rows = rows.collect::<std::result::Result<Vec<_>, _>>()?;
    let view_branch =
        branch_scope::effective_branch_id_for_read(connection, scene.project_id, input.branch_id)?;
    let mut visible = Vec::new();
    for row in all_rows {
        if branch_scope::is_entity_visible_in_branch(
            connection,
            scene.project_id,
            view_branch,
            row.created_branch_id,
            Some(row.created_at.as_str()),
        )? {
            visible.push(layer_row_to_model(row));
        }
    }
    if let Some(branch_id) = input.branch_id {
        let overrides = list_branch_overrides(connection, branch_id, "canvas_layer")?;
        return apply_overrides(visible, overrides);
    }
    Ok(visible)
}

pub fn create_layer(connection: &Connection, input: &CreateCanvasLayerInput) -> Result<CanvasLayer> {
    validate_layer_kind(&input.kind)?;
    let scene = get_scene_row_by_id(connection, input.scene_id)?;
    if let Some(branch_id) = input.branch_id {
        branch_scope::assert_branch_belongs_to_project(connection, branch_id, scene.project_id)?;
    }
    let created_branch_id =
        branch_scope::resolve_created_branch_id(connection, scene.project_id, input.branch_id)?;
    let z_index = input.z_index.unwrap_or_else(|| next_layer_z_index(connection, input.scene_id));
    connection.execute(
        r#"
        INSERT INTO canvas_layer (
          scene_id, name, kind, z_index, is_hidden, is_locked, opacity, blend_mode,
          metadata_json, created_branch_id
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
        "#,
        params![
            input.scene_id,
            input.name,
            input.kind,
            z_index,
            bool_to_sql(input.is_hidden.unwrap_or(false)),
            bool_to_sql(input.is_locked.unwrap_or(false)),
            input.opacity.unwrap_or(1.0),
            input
                .blend_mode
                .clone()
                .unwrap_or_else(|| "normal".to_string()),
            value_or_empty_object(input.metadata_json.as_ref()).to_string(),
            created_branch_id
        ],
    )?;
    let id = i32::try_from(connection.last_insert_rowid()).map_err(|_| {
        AppError::internal(
            "CANVAS_LAYER_ID_RANGE_ERROR",
            "Created canvas layer id is out of range",
        )
    })?;
    get_layer_by_id(connection, id, input.branch_id)
}

pub fn update_layer(connection: &Connection, input: &UpdateCanvasLayerInput) -> Result<CanvasLayer> {
    let _ = get_layer_by_id(connection, input.id, input.branch_id)?;
    if let Some(kind) = input.kind.as_deref() {
        validate_layer_kind(kind)?;
    }
    if let Some(branch_id) = input.branch_id {
        let patch = build_layer_patch(input);
        if patch != Value::Object(Map::new()) {
            save_upsert_override(connection, branch_id, "canvas_layer", input.id, &patch)?;
        }
        return get_layer_by_id(connection, input.id, Some(branch_id));
    }
    let mut fields = Vec::<String>::new();
    let mut values = Vec::<SqlValue>::new();
    if let Some(value) = input.name.as_deref() {
        fields.push("name = ?".to_string());
        values.push(SqlValue::Text(value.to_string()));
    }
    if let Some(value) = input.kind.as_deref() {
        fields.push("kind = ?".to_string());
        values.push(SqlValue::Text(value.to_string()));
    }
    if let Some(value) = input.z_index {
        fields.push("z_index = ?".to_string());
        values.push(SqlValue::Integer(i64::from(value)));
    }
    if let Some(value) = input.is_hidden {
        fields.push("is_hidden = ?".to_string());
        values.push(SqlValue::Integer(i64::from(bool_to_sql(value))));
    }
    if let Some(value) = input.is_locked {
        fields.push("is_locked = ?".to_string());
        values.push(SqlValue::Integer(i64::from(bool_to_sql(value))));
    }
    if let Some(value) = input.opacity {
        fields.push("opacity = ?".to_string());
        values.push(SqlValue::Real(value));
    }
    if let Some(value) = input.blend_mode.as_deref() {
        fields.push("blend_mode = ?".to_string());
        values.push(SqlValue::Text(value.to_string()));
    }
    if let Some(value) = input.metadata_json.as_ref() {
        fields.push("metadata_json = ?".to_string());
        values.push(SqlValue::Text(value_or_empty_object(Some(value)).to_string()));
    }
    if !fields.is_empty() {
        fields.push("updated_at = datetime('now')".to_string());
        values.push(SqlValue::Integer(i64::from(input.id)));
        let query = format!("UPDATE canvas_layer SET {} WHERE id = ?", fields.join(", "));
        connection.execute(&query, params_from_iter(values.iter()))?;
    }
    get_layer_by_id(connection, input.id, None)
}

pub fn delete_layer(connection: &Connection, input: &DeleteCanvasLayerInput) -> Result<()> {
    let _ = get_layer_by_id(connection, input.id, input.branch_id)?;
    if let Some(branch_id) = input.branch_id {
        save_delete_override(connection, branch_id, "canvas_layer", input.id)?;
        return Ok(());
    }
    connection.execute("DELETE FROM canvas_layer WHERE id = ?1", params![input.id])?;
    Ok(())
}

pub fn reorder_layers(connection: &Connection, input: &ReorderCanvasLayersInput) -> Result<Vec<CanvasLayer>> {
    let _ = get_scene_row_by_id(connection, input.scene_id)?;
    for (z, id) in input.ordered_ids.iter().enumerate() {
        if let Some(branch_id) = input.branch_id {
            save_upsert_override(
                connection,
                branch_id,
                "canvas_layer",
                *id,
                &serde_json::json!({ "zIndex": z }),
            )?;
        } else {
            connection.execute(
                "UPDATE canvas_layer SET z_index = ?1, updated_at = datetime('now') WHERE id = ?2 AND scene_id = ?3",
                params![i32::try_from(z).unwrap_or(0), id, input.scene_id],
            )?;
        }
    }
    list_layers(
        connection,
        &ListCanvasLayersInput {
            scene_id: input.scene_id,
            branch_id: input.branch_id,
        },
    )
}

pub fn list_objects(connection: &Connection, input: &ListCanvasObjectsInput) -> Result<Vec<CanvasObject>> {
    let scene = get_scene_row_by_id(connection, input.scene_id)?;
    let mut statement = connection.prepare(
        r#"
        SELECT
          id, scene_id, layer_id, kind, name, z_index, transform_json, geometry_json,
          style_json, content_json, resource_path, linked_note_id, linked_scene_id,
          is_hidden, is_locked, created_at, updated_at, created_branch_id
        FROM canvas_object
        WHERE scene_id = ?1
        ORDER BY layer_id ASC, z_index ASC, id ASC
        "#,
    )?;
    let rows = statement.query_map(params![input.scene_id], map_object_row)?;
    let all_rows = rows.collect::<std::result::Result<Vec<_>, _>>()?;
    let view_branch =
        branch_scope::effective_branch_id_for_read(connection, scene.project_id, input.branch_id)?;
    let mut visible = Vec::new();
    for row in all_rows {
        if branch_scope::is_entity_visible_in_branch(
            connection,
            scene.project_id,
            view_branch,
            row.created_branch_id,
            Some(row.created_at.as_str()),
        )? {
            visible.push(object_row_to_model(row));
        }
    }
    if let Some(branch_id) = input.branch_id {
        let overrides = list_branch_overrides(connection, branch_id, "canvas_object")?;
        return apply_overrides(visible, overrides);
    }
    Ok(visible)
}

pub fn get_object(connection: &Connection, input: &GetCanvasObjectInput) -> Result<CanvasObject> {
    let row = get_object_row(connection, input.id)?;
    let scene = get_scene_row_by_id(connection, row.scene_id)?;
    let view_branch =
        branch_scope::effective_branch_id_for_read(connection, scene.project_id, input.branch_id)?;
    if !branch_scope::is_entity_visible_in_branch(
        connection,
        scene.project_id,
        view_branch,
        row.created_branch_id,
        Some(row.created_at.as_str()),
    )? {
        return Err(AppError::internal("CANVAS_OBJECT_NOT_FOUND", "Canvas object not found"));
    }
    let mut object = object_row_to_model(row);
    if let Some(branch_id) = input.branch_id {
        let override_row = get_branch_override(connection, branch_id, "canvas_object", input.id)?;
        object = branch_overlay::apply_item_overlay(Some(object), override_row.as_ref())?
            .ok_or_else(|| AppError::internal("CANVAS_OBJECT_NOT_FOUND", "Canvas object not found"))?;
    }
    Ok(object)
}

pub fn create_object(connection: &Connection, input: &CreateCanvasObjectInput) -> Result<CanvasObject> {
    validate_object_kind(&input.kind)?;
    let scene = get_scene_row_by_id(connection, input.scene_id)?;
    if let Some(branch_id) = input.branch_id {
        branch_scope::assert_branch_belongs_to_project(connection, branch_id, scene.project_id)?;
    }
    let created_branch_id =
        branch_scope::resolve_created_branch_id(connection, scene.project_id, input.branch_id)?;
    let z_index = input.z_index.unwrap_or_else(|| next_object_z_index(connection, input.layer_id));
    connection.execute(
        r#"
        INSERT INTO canvas_object (
          scene_id, layer_id, kind, name, z_index, transform_json, geometry_json, style_json,
          content_json, resource_path, linked_note_id, linked_scene_id, is_hidden, is_locked,
          created_branch_id
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)
        "#,
        params![
            input.scene_id,
            input.layer_id,
            input.kind,
            input.name,
            z_index,
            value_or_empty_object(Some(&input.transform_json)).to_string(),
            value_or_empty_object(input.geometry_json.as_ref()).to_string(),
            value_or_empty_object(input.style_json.as_ref()).to_string(),
            value_or_empty_object(input.content_json.as_ref()).to_string(),
            input.resource_path,
            input.linked_note_id,
            input.linked_scene_id,
            bool_to_sql(input.is_hidden.unwrap_or(false)),
            bool_to_sql(input.is_locked.unwrap_or(false)),
            created_branch_id
        ],
    )?;
    let id = i32::try_from(connection.last_insert_rowid()).map_err(|_| {
        AppError::internal(
            "CANVAS_OBJECT_ID_RANGE_ERROR",
            "Created canvas object id is out of range",
        )
    })?;
    get_object(
        connection,
        &GetCanvasObjectInput {
            id,
            branch_id: input.branch_id,
        },
    )
}

pub fn update_object(connection: &Connection, input: &UpdateCanvasObjectInput) -> Result<CanvasObject> {
    let _ = get_object(
        connection,
        &GetCanvasObjectInput {
            id: input.id,
            branch_id: input.branch_id,
        },
    )?;
    if let Some(kind) = input.kind.as_deref() {
        validate_object_kind(kind)?;
    }
    if let Some(branch_id) = input.branch_id {
        let patch = build_object_patch(input);
        if patch != Value::Object(Map::new()) {
            save_upsert_override(connection, branch_id, "canvas_object", input.id, &patch)?;
        }
        return get_object(
            connection,
            &GetCanvasObjectInput {
                id: input.id,
                branch_id: Some(branch_id),
            },
        );
    }
    let mut fields = Vec::<String>::new();
    let mut values = Vec::<SqlValue>::new();
    if let Some(value) = input.layer_id {
        fields.push("layer_id = ?".to_string());
        values.push(SqlValue::Integer(i64::from(value)));
    }
    if let Some(value) = input.kind.as_deref() {
        fields.push("kind = ?".to_string());
        values.push(SqlValue::Text(value.to_string()));
    }
    if let Some(value) = input.name.as_ref() {
        fields.push("name = ?".to_string());
        values.push(SqlValue::Text(value.clone()));
    }
    if let Some(value) = input.z_index {
        fields.push("z_index = ?".to_string());
        values.push(SqlValue::Integer(i64::from(value)));
    }
    if let Some(value) = input.transform_json.as_ref() {
        fields.push("transform_json = ?".to_string());
        values.push(SqlValue::Text(value_or_empty_object(Some(value)).to_string()));
    }
    if let Some(value) = input.geometry_json.as_ref() {
        fields.push("geometry_json = ?".to_string());
        values.push(SqlValue::Text(value_or_empty_object(Some(value)).to_string()));
    }
    if let Some(value) = input.style_json.as_ref() {
        fields.push("style_json = ?".to_string());
        values.push(SqlValue::Text(value_or_empty_object(Some(value)).to_string()));
    }
    if let Some(value) = input.content_json.as_ref() {
        fields.push("content_json = ?".to_string());
        values.push(SqlValue::Text(value_or_empty_object(Some(value)).to_string()));
    }
    if let Some(value) = input.resource_path.as_ref() {
        fields.push("resource_path = ?".to_string());
        values.push(SqlValue::Text(value.clone()));
    }
    if let Some(value) = input.linked_note_id {
        fields.push("linked_note_id = ?".to_string());
        values.push(SqlValue::Integer(i64::from(value)));
    }
    if let Some(value) = input.linked_scene_id {
        fields.push("linked_scene_id = ?".to_string());
        values.push(SqlValue::Integer(i64::from(value)));
    }
    if let Some(value) = input.is_hidden {
        fields.push("is_hidden = ?".to_string());
        values.push(SqlValue::Integer(i64::from(bool_to_sql(value))));
    }
    if let Some(value) = input.is_locked {
        fields.push("is_locked = ?".to_string());
        values.push(SqlValue::Integer(i64::from(bool_to_sql(value))));
    }
    if !fields.is_empty() {
        fields.push("updated_at = datetime('now')".to_string());
        values.push(SqlValue::Integer(i64::from(input.id)));
        let query = format!("UPDATE canvas_object SET {} WHERE id = ?", fields.join(", "));
        connection.execute(&query, params_from_iter(values.iter()))?;
    }
    get_object(
        connection,
        &GetCanvasObjectInput {
            id: input.id,
            branch_id: None,
        },
    )
}

pub fn delete_object(connection: &Connection, input: &DeleteCanvasObjectInput) -> Result<()> {
    let _ = get_object(
        connection,
        &GetCanvasObjectInput {
            id: input.id,
            branch_id: input.branch_id,
        },
    )?;
    if let Some(branch_id) = input.branch_id {
        save_delete_override(connection, branch_id, "canvas_object", input.id)?;
        return Ok(());
    }
    connection.execute("DELETE FROM canvas_object WHERE id = ?1", params![input.id])?;
    Ok(())
}

pub fn reorder_objects(connection: &Connection, input: &ReorderCanvasObjectsInput) -> Result<Vec<CanvasObject>> {
    for (z, id) in input.ordered_ids.iter().enumerate() {
        if let Some(branch_id) = input.branch_id {
            save_upsert_override(
                connection,
                branch_id,
                "canvas_object",
                *id,
                &serde_json::json!({ "zIndex": z }),
            )?;
        } else {
            let z_index = i32::try_from(z).unwrap_or(0);
            if let Some(layer_id) = input.layer_id {
                connection.execute(
                    "UPDATE canvas_object SET z_index = ?1, updated_at = datetime('now') WHERE id = ?2 AND scene_id = ?3 AND layer_id = ?4",
                    params![z_index, id, input.scene_id, layer_id],
                )?;
            } else {
                connection.execute(
                    "UPDATE canvas_object SET z_index = ?1, updated_at = datetime('now') WHERE id = ?2 AND scene_id = ?3",
                    params![z_index, id, input.scene_id],
                )?;
            }
        }
    }
    list_objects(
        connection,
        &ListCanvasObjectsInput {
            scene_id: input.scene_id,
            branch_id: input.branch_id,
        },
    )
}

pub fn bulk_upsert_objects(connection: &Connection, input: &BulkUpsertCanvasObjectsInput) -> Result<Vec<CanvasObject>> {
    let mut result = Vec::new();
    for item in &input.objects {
        if let Some(id) = item.id {
            let updated = update_object(
                connection,
                &UpdateCanvasObjectInput {
                    id,
                    layer_id: Some(item.layer_id),
                    kind: Some(item.kind.clone()),
                    name: item.name.clone(),
                    z_index: Some(item.z_index),
                    transform_json: Some(item.transform_json.clone()),
                    geometry_json: item.geometry_json.clone(),
                    style_json: item.style_json.clone(),
                    content_json: item.content_json.clone(),
                    resource_path: item.resource_path.clone(),
                    linked_note_id: item.linked_note_id,
                    linked_scene_id: item.linked_scene_id,
                    is_hidden: item.is_hidden,
                    is_locked: item.is_locked,
                    branch_id: input.branch_id,
                },
            )?;
            result.push(updated);
        } else {
            let created = create_object(
                connection,
                &CreateCanvasObjectInput {
                    scene_id: input.scene_id,
                    layer_id: item.layer_id,
                    kind: item.kind.clone(),
                    name: item.name.clone(),
                    z_index: Some(item.z_index),
                    transform_json: item.transform_json.clone(),
                    geometry_json: item.geometry_json.clone(),
                    style_json: item.style_json.clone(),
                    content_json: item.content_json.clone(),
                    resource_path: item.resource_path.clone(),
                    linked_note_id: item.linked_note_id,
                    linked_scene_id: item.linked_scene_id,
                    is_hidden: item.is_hidden,
                    is_locked: item.is_locked,
                    branch_id: input.branch_id,
                },
            )?;
            result.push(created);
        }
    }
    Ok(result)
}

pub fn bulk_delete_objects(connection: &Connection, input: &BulkDeleteCanvasObjectsInput) -> Result<()> {
    for object_id in &input.object_ids {
        delete_object(
            connection,
            &DeleteCanvasObjectInput {
                id: *object_id,
                branch_id: input.branch_id,
            },
        )?;
    }
    Ok(())
}

pub fn reconcile_scene(connection: &Connection, input: &ReconcileCanvasSceneInput) -> Result<CanvasReconcileResult> {
    let upserted = bulk_upsert_objects(
        connection,
        &BulkUpsertCanvasObjectsInput {
            scene_id: input.scene_id,
            objects: input.upsert.clone(),
            branch_id: input.branch_id,
        },
    )?;
    bulk_delete_objects(
        connection,
        &BulkDeleteCanvasObjectsInput {
            scene_id: input.scene_id,
            object_ids: input.delete_ids.clone(),
            branch_id: input.branch_id,
        },
    )?;
    Ok(CanvasReconcileResult {
        upserted,
        deleted_ids: input.delete_ids.clone(),
    })
}

pub fn list_territory_summaries(
    connection: &Connection,
    input: &ListCanvasTerritorySummariesInput,
) -> Result<Vec<CanvasTerritorySummary>> {
    let mut statement = connection.prepare(
        r#"
        SELECT
          co.id,
          COALESCE(co.name, '') AS name,
          cs.id AS scene_id,
          cs.name AS scene_name,
          CAST(json_extract(co.content_json, '$.factionId') AS INTEGER) AS faction_id,
          f.name AS occupant_name,
          f.kind AS occupant_kind,
          co.created_at AS object_created_at,
          co.created_branch_id AS object_created_branch_id,
          cs.created_at AS scene_created_at,
          cs.created_branch_id AS scene_created_branch_id
        FROM canvas_object co
        JOIN canvas_scene cs ON cs.id = co.scene_id
        LEFT JOIN factions f ON f.id = CAST(json_extract(co.content_json, '$.factionId') AS INTEGER)
        WHERE cs.project_id = ?1 AND co.kind = 'territory'
        ORDER BY cs.name COLLATE NOCASE ASC, co.name COLLATE NOCASE ASC
        "#,
    )?;
    let rows = statement.query_map(params![input.project_id], |row| {
        Ok((
            row.get::<_, i32>("id")?,
            row.get::<_, String>("name")?,
            row.get::<_, i32>("scene_id")?,
            row.get::<_, String>("scene_name")?,
            row.get::<_, Option<i32>>("faction_id")?,
            row.get::<_, Option<String>>("occupant_name")?,
            row.get::<_, Option<String>>("occupant_kind")?,
            row.get::<_, String>("object_created_at")?,
            row.get::<_, Option<i32>>("object_created_branch_id")?,
            row.get::<_, String>("scene_created_at")?,
            row.get::<_, Option<i32>>("scene_created_branch_id")?,
        ))
    })?;
    let rows = rows.collect::<std::result::Result<Vec<_>, _>>()?;
    let mut result = Vec::new();
    for (
        id,
        name,
        scene_id,
        scene_name,
        faction_id,
        occupant_name,
        occupant_kind,
        object_created_at,
        object_created_branch_id,
        scene_created_at,
        scene_created_branch_id,
    ) in rows
    {
        let object_visible = branch_scope::is_entity_visible_in_branch(
            connection,
            input.project_id,
            input.branch_id,
            object_created_branch_id,
            Some(object_created_at.as_str()),
        )?;
        let scene_visible = branch_scope::is_entity_visible_in_branch(
            connection,
            input.project_id,
            input.branch_id,
            scene_created_branch_id,
            Some(scene_created_at.as_str()),
        )?;
        if object_visible && scene_visible {
            result.push(CanvasTerritorySummary {
                id,
                name,
                scene_id,
                scene_name,
                faction_id,
                occupant_name,
                occupant_kind,
            });
        }
    }
    Ok(result)
}

fn get_scene_row_by_id(connection: &Connection, id: i32) -> Result<SceneRow> {
    get_scene_row(connection, id)
}

fn get_scene_row(connection: &Connection, id: i32) -> Result<SceneRow> {
    connection
        .query_row(
            r#"
            SELECT
              id, project_id, parent_scene_id, parent_object_id, name, background_path,
              viewport_json, metadata_json, created_at, updated_at, created_branch_id
            FROM canvas_scene
            WHERE id = ?1
            "#,
            params![id],
            map_scene_row,
        )
        .optional()?
        .ok_or_else(|| AppError::internal("CANVAS_SCENE_NOT_FOUND", "Canvas scene not found"))
}

fn get_layer_by_id(connection: &Connection, id: i32, branch_id: Option<i32>) -> Result<CanvasLayer> {
    let row = connection
        .query_row(
            r#"
            SELECT
              id, scene_id, name, kind, z_index, is_hidden, is_locked, opacity, blend_mode,
              metadata_json, created_at, updated_at, created_branch_id
            FROM canvas_layer
            WHERE id = ?1
            "#,
            params![id],
            map_layer_row,
        )
        .optional()?
        .ok_or_else(|| AppError::internal("CANVAS_LAYER_NOT_FOUND", "Canvas layer not found"))?;
    let scene = get_scene_row_by_id(connection, row.scene_id)?;
    let view_branch =
        branch_scope::effective_branch_id_for_read(connection, scene.project_id, branch_id)?;
    if !branch_scope::is_entity_visible_in_branch(
        connection,
        scene.project_id,
        view_branch,
        row.created_branch_id,
        Some(row.created_at.as_str()),
    )? {
        return Err(AppError::internal("CANVAS_LAYER_NOT_FOUND", "Canvas layer not found"));
    }
    let mut layer = layer_row_to_model(row);
    if let Some(branch_id) = branch_id {
        let override_row = get_branch_override(connection, branch_id, "canvas_layer", id)?;
        layer = branch_overlay::apply_item_overlay(Some(layer), override_row.as_ref())?
            .ok_or_else(|| AppError::internal("CANVAS_LAYER_NOT_FOUND", "Canvas layer not found"))?;
    }
    Ok(layer)
}

fn get_object_row(connection: &Connection, id: i32) -> Result<ObjectRow> {
    connection
        .query_row(
            r#"
            SELECT
              id, scene_id, layer_id, kind, name, z_index, transform_json, geometry_json,
              style_json, content_json, resource_path, linked_note_id, linked_scene_id,
              is_hidden, is_locked, created_at, updated_at, created_branch_id
            FROM canvas_object
            WHERE id = ?1
            "#,
            params![id],
            map_object_row,
        )
        .optional()?
        .ok_or_else(|| AppError::internal("CANVAS_OBJECT_NOT_FOUND", "Canvas object not found"))
}

fn map_scene_row(row: &Row<'_>) -> rusqlite::Result<SceneRow> {
    Ok(SceneRow {
        id: row.get("id")?,
        project_id: row.get("project_id")?,
        parent_scene_id: row.get("parent_scene_id")?,
        parent_object_id: row.get("parent_object_id")?,
        name: row.get("name")?,
        background_path: row.get("background_path")?,
        viewport_json: row.get("viewport_json")?,
        metadata_json: row.get("metadata_json")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        created_branch_id: row.get("created_branch_id")?,
    })
}

fn map_layer_row(row: &Row<'_>) -> rusqlite::Result<LayerRow> {
    Ok(LayerRow {
        id: row.get("id")?,
        scene_id: row.get("scene_id")?,
        name: row.get("name")?,
        kind: row.get("kind")?,
        z_index: row.get("z_index")?,
        is_hidden: row.get("is_hidden")?,
        is_locked: row.get("is_locked")?,
        opacity: row.get("opacity")?,
        blend_mode: row.get("blend_mode")?,
        metadata_json: row.get("metadata_json")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        created_branch_id: row.get("created_branch_id")?,
    })
}

fn map_object_row(row: &Row<'_>) -> rusqlite::Result<ObjectRow> {
    Ok(ObjectRow {
        id: row.get("id")?,
        scene_id: row.get("scene_id")?,
        layer_id: row.get("layer_id")?,
        kind: row.get("kind")?,
        name: row.get("name")?,
        z_index: row.get("z_index")?,
        transform_json: row.get("transform_json")?,
        geometry_json: row.get("geometry_json")?,
        style_json: row.get("style_json")?,
        content_json: row.get("content_json")?,
        resource_path: row.get("resource_path")?,
        linked_note_id: row.get("linked_note_id")?,
        linked_scene_id: row.get("linked_scene_id")?,
        is_hidden: row.get("is_hidden")?,
        is_locked: row.get("is_locked")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        created_branch_id: row.get("created_branch_id")?,
    })
}

fn scene_row_to_model(row: SceneRow) -> CanvasScene {
    CanvasScene {
        id: row.id,
        project_id: row.project_id,
        parent_scene_id: row.parent_scene_id,
        parent_object_id: row.parent_object_id,
        name: row.name,
        background_path: row.background_path,
        viewport_json: parse_json_or_default(&row.viewport_json),
        metadata_json: parse_json_or_default(&row.metadata_json),
        created_at: row.created_at,
        updated_at: row.updated_at,
    }
}

fn layer_row_to_model(row: LayerRow) -> CanvasLayer {
    CanvasLayer {
        id: row.id,
        scene_id: row.scene_id,
        name: row.name,
        kind: row.kind,
        z_index: row.z_index,
        is_hidden: row.is_hidden != 0,
        is_locked: row.is_locked != 0,
        opacity: row.opacity,
        blend_mode: row.blend_mode,
        metadata_json: parse_json_or_default(&row.metadata_json),
        created_at: row.created_at,
        updated_at: row.updated_at,
    }
}

fn object_row_to_model(row: ObjectRow) -> CanvasObject {
    CanvasObject {
        id: row.id,
        scene_id: row.scene_id,
        layer_id: row.layer_id,
        kind: row.kind,
        name: row.name,
        z_index: row.z_index,
        transform_json: parse_json_or_default(&row.transform_json),
        geometry_json: parse_json_or_default(&row.geometry_json),
        style_json: parse_json_or_default(&row.style_json),
        content_json: parse_json_or_default(&row.content_json),
        resource_path: row.resource_path,
        linked_note_id: row.linked_note_id,
        linked_scene_id: row.linked_scene_id,
        is_hidden: row.is_hidden != 0,
        is_locked: row.is_locked != 0,
        created_at: row.created_at,
        updated_at: row.updated_at,
    }
}

fn parse_json_or_default(raw: &str) -> Value {
    serde_json::from_str::<Value>(raw).unwrap_or_else(|_| Value::Object(Map::new()))
}

fn value_or_empty_object(value: Option<&Value>) -> Value {
    value
        .cloned()
        .unwrap_or_else(|| Value::Object(Map::new()))
}

fn bool_to_sql(value: bool) -> i32 {
    if value { 1 } else { 0 }
}

fn validate_layer_kind(kind: &str) -> Result<()> {
    if CANVAS_LAYER_KINDS.contains(&kind) {
        Ok(())
    } else {
        Err(AppError::internal(
            "INVALID_CANVAS_LAYER_KIND",
            format!("Invalid canvas layer kind: {kind}"),
        ))
    }
}

fn validate_object_kind(kind: &str) -> Result<()> {
    if CANVAS_OBJECT_KINDS.contains(&kind) {
        Ok(())
    } else {
        Err(AppError::internal(
            "INVALID_CANVAS_OBJECT_KIND",
            format!("Invalid canvas object kind: {kind}"),
        ))
    }
}

fn next_layer_z_index(connection: &Connection, scene_id: i32) -> i32 {
    connection
        .query_row(
            "SELECT COALESCE(MAX(z_index), -1) + 1 FROM canvas_layer WHERE scene_id = ?1",
            params![scene_id],
            |row| row.get::<_, i32>(0),
        )
        .unwrap_or(0)
}

fn next_object_z_index(connection: &Connection, layer_id: i32) -> i32 {
    connection
        .query_row(
            "SELECT COALESCE(MAX(z_index), -1) + 1 FROM canvas_object WHERE layer_id = ?1",
            params![layer_id],
            |row| row.get::<_, i32>(0),
        )
        .unwrap_or(0)
}

fn build_scene_patch(input: &UpdateCanvasSceneInput) -> Value {
    let mut patch = Map::new();
    if let Some(value) = input.name.as_ref() {
        patch.insert("name".to_string(), Value::String(value.clone()));
    }
    if let Some(value) = input.background_path.as_ref() {
        patch.insert("backgroundPath".to_string(), Value::String(value.clone()));
    }
    if let Some(value) = input.viewport_json.as_ref() {
        patch.insert("viewportJson".to_string(), value.clone());
    }
    if let Some(value) = input.metadata_json.as_ref() {
        patch.insert("metadataJson".to_string(), value.clone());
    }
    Value::Object(patch)
}

fn build_layer_patch(input: &UpdateCanvasLayerInput) -> Value {
    let mut patch = Map::new();
    if let Some(value) = input.name.as_ref() {
        patch.insert("name".to_string(), Value::String(value.clone()));
    }
    if let Some(value) = input.kind.as_ref() {
        patch.insert("kind".to_string(), Value::String(value.clone()));
    }
    if let Some(value) = input.z_index {
        patch.insert("zIndex".to_string(), Value::from(value));
    }
    if let Some(value) = input.is_hidden {
        patch.insert("isHidden".to_string(), Value::Bool(value));
    }
    if let Some(value) = input.is_locked {
        patch.insert("isLocked".to_string(), Value::Bool(value));
    }
    if let Some(value) = input.opacity {
        patch.insert("opacity".to_string(), Value::from(value));
    }
    if let Some(value) = input.blend_mode.as_ref() {
        patch.insert("blendMode".to_string(), Value::String(value.clone()));
    }
    if let Some(value) = input.metadata_json.as_ref() {
        patch.insert("metadataJson".to_string(), value.clone());
    }
    Value::Object(patch)
}

fn build_object_patch(input: &UpdateCanvasObjectInput) -> Value {
    let mut patch = Map::new();
    if let Some(value) = input.layer_id {
        patch.insert("layerId".to_string(), Value::from(value));
    }
    if let Some(value) = input.kind.as_ref() {
        patch.insert("kind".to_string(), Value::String(value.clone()));
    }
    if let Some(value) = input.name.as_ref() {
        patch.insert("name".to_string(), Value::String(value.clone()));
    }
    if let Some(value) = input.z_index {
        patch.insert("zIndex".to_string(), Value::from(value));
    }
    if let Some(value) = input.transform_json.as_ref() {
        patch.insert("transformJson".to_string(), value.clone());
    }
    if let Some(value) = input.geometry_json.as_ref() {
        patch.insert("geometryJson".to_string(), value.clone());
    }
    if let Some(value) = input.style_json.as_ref() {
        patch.insert("styleJson".to_string(), value.clone());
    }
    if let Some(value) = input.content_json.as_ref() {
        patch.insert("contentJson".to_string(), value.clone());
    }
    if let Some(value) = input.resource_path.as_ref() {
        patch.insert("resourcePath".to_string(), Value::String(value.clone()));
    }
    if let Some(value) = input.linked_note_id {
        patch.insert("linkedNoteId".to_string(), Value::from(value));
    }
    if let Some(value) = input.linked_scene_id {
        patch.insert("linkedSceneId".to_string(), Value::from(value));
    }
    if let Some(value) = input.is_hidden {
        patch.insert("isHidden".to_string(), Value::Bool(value));
    }
    if let Some(value) = input.is_locked {
        patch.insert("isLocked".to_string(), Value::Bool(value));
    }
    Value::Object(patch)
}

fn apply_overrides<T>(
    rows: Vec<T>,
    overrides: HashMap<i32, BranchOverride>,
) -> Result<Vec<T>>
where
    T: serde::Serialize + for<'de> serde::Deserialize<'de> + Clone,
{
    let mut result = Vec::new();
    for row in rows {
        let entity_id = serde_json::to_value(&row)
            .ok()
            .and_then(|value| value.get("id").and_then(Value::as_i64))
            .and_then(|id| i32::try_from(id).ok());
        let override_row = entity_id.and_then(|id| overrides.get(&id));
        if let Some(projected) = branch_overlay::apply_item_overlay(Some(row), override_row)? {
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
          id, branch_id, entity_type, entity_id, op, patch_json, created_at, updated_at
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
              id, branch_id, entity_type, entity_id, op, patch_json, created_at, updated_at
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
            |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)),
        )
        .optional()?;
    let mut merged = patch_json.clone();
    if let Some((op, patch)) = existing {
        if op == "upsert" {
            let mut base = match serde_json::from_str::<Value>(&patch) {
                Ok(Value::Object(map)) => Value::Object(map),
                _ => Value::Object(Map::new()),
            };
            if let (Value::Object(base_map), Value::Object(new_map)) = (&mut base, patch_json.clone())
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

fn map_branch_override_row(row: &Row<'_>) -> rusqlite::Result<BranchOverride> {
    let op = row.get::<_, String>("op")?;
    let operation = match op.as_str() {
        "delete" => crate::models::branch::OverlayOperation::Delete,
        "create" => crate::models::branch::OverlayOperation::Create,
        _ => crate::models::branch::OverlayOperation::Upsert,
    };
    Ok(BranchOverride {
        id: row.get("id")?,
        branch_id: row.get("branch_id")?,
        entity_type: row.get("entity_type")?,
        entity_id: row.get("entity_id")?,
        op: operation,
        patch_json: row.get("patch_json")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}
