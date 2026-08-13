use std::collections::HashMap;

use rusqlite::{
    params, params_from_iter, types::Value as SqlValue, Connection, OptionalExtension, Row,
};
use serde_json::{Map, Value};

use crate::error::{AppError, Result};
use crate::models::branch::BranchOverride;
use crate::models::canvas::{
    AttachChildSceneToMarkerInput, AttachChildSceneToMarkerResult, BulkDeleteCanvasObjectsInput,
    BulkUpsertCanvasObjectsInput, CanvasLayer, CanvasObject, CanvasReconcileResult, CanvasScene,
    CanvasTerritorySummary, CreateCanvasLayerInput, CreateCanvasObjectInput,
    CreateCanvasSceneInput, CreateMapSceneContainerInput, CreateMapSceneContainerResult,
    DeleteCanvasLayerInput, DeleteCanvasObjectInput, DeleteCanvasSceneInput, GetCanvasObjectInput,
    GetCanvasSceneInput, GetCanvasSceneTreeInput, GetRootCanvasSceneInput, ListCanvasLayersInput,
    ListCanvasObjectsInput, ListCanvasTerritorySummariesInput, ReconcileCanvasSceneInput,
    ReorderCanvasLayersInput, ReorderCanvasObjectsInput, UpdateCanvasLayerInput,
    UpdateCanvasObjectInput, UpdateCanvasSceneInput, CANVAS_OBJECT_KINDS,
};
use crate::services::branch_overlay;
use crate::services::branch_scope;

const CANVAS_LAYER_KINDS: &[&str] = &[
    "background",
    "content",
    "overlay",
    "annotation",
    "ui_helper",
];

#[derive(Debug, Clone)]
struct SceneRow {
    id: i32,
    project_id: i32,
    parent_scene_id: Option<i32>,
    parent_object_id: Option<i32>,
    name: String,
    background_path: Option<String>,
    scene_type: Option<String>,
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

pub fn get_root_scene(
    connection: &Connection,
    input: &GetRootCanvasSceneInput,
) -> Result<Option<CanvasScene>> {
    let mut scenes = get_scene_tree(
        connection,
        &GetCanvasSceneTreeInput {
            project_id: input.project_id,
            branch_id: input.branch_id,
        },
    )?;
    let root = scenes
        .drain(..)
        .find(|scene| scene.parent_scene_id.is_none());
    Ok(root)
}

pub fn get_scene_tree(
    connection: &Connection,
    input: &GetCanvasSceneTreeInput,
) -> Result<Vec<CanvasScene>> {
    let mut statement = connection.prepare(
        r#"
        SELECT
          id, project_id, parent_scene_id, parent_object_id, name, background_path, scene_type,
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
        return Err(AppError::internal(
            "CANVAS_SCENE_NOT_FOUND",
            "Canvas scene not found",
        ));
    }
    let mut scene = scene_row_to_model(row);
    if let Some(branch_id) = input.branch_id {
        let override_row = get_branch_override(connection, branch_id, "canvas_scene", input.id)?;
        scene = branch_overlay::apply_item_overlay(Some(scene), override_row.as_ref())?
            .ok_or_else(|| {
                AppError::internal("CANVAS_SCENE_NOT_FOUND", "Canvas scene not found")
            })?;
    }
    Ok(scene)
}

pub fn create_scene(
    connection: &Connection,
    input: &CreateCanvasSceneInput,
) -> Result<CanvasScene> {
    if let Some(branch_id) = input.branch_id {
        branch_scope::assert_branch_belongs_to_project(connection, branch_id, input.project_id)?;
    }
    if input.scene_type.as_deref() == Some("root_canvas") {
        validate_root_canvas_invariant(connection, input.project_id, None)?;
    }
    let created_branch_id =
        branch_scope::resolve_created_branch_id(connection, input.project_id, input.branch_id)?;
    connection.execute(
        r#"
        INSERT INTO canvas_scene (
          project_id, parent_scene_id, parent_object_id, name, background_path, scene_type,
          viewport_json, metadata_json, created_branch_id
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
        "#,
        params![
            input.project_id,
            input.parent_scene_id,
            input.parent_object_id,
            input.name,
            input.background_path,
            input.scene_type,
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

fn create_default_layers_for_scene(
    connection: &Connection,
    scene_id: i32,
    branch_id: Option<i32>,
) -> Result<()> {
    create_layer(
        connection,
        &CreateCanvasLayerInput {
            scene_id,
            name: "Background".to_string(),
            kind: "background".to_string(),
            z_index: Some(0),
            is_hidden: Some(false),
            is_locked: Some(false),
            opacity: Some(1.0),
            blend_mode: Some("normal".to_string()),
            metadata_json: None,
            branch_id,
        },
    )?;
    create_layer(
        connection,
        &CreateCanvasLayerInput {
            scene_id,
            name: "Content".to_string(),
            kind: "content".to_string(),
            z_index: Some(1),
            is_hidden: Some(false),
            is_locked: Some(false),
            opacity: Some(1.0),
            blend_mode: Some("normal".to_string()),
            metadata_json: None,
            branch_id,
        },
    )?;
    Ok(())
}

pub fn create_root_scene_for_project(
    connection: &Connection,
    project_id: i32,
    background_path: Option<&str>,
    branch_id: Option<i32>,
) -> Result<CanvasScene> {
    let scene = create_scene(
        connection,
        &CreateCanvasSceneInput {
            project_id,
            parent_scene_id: None,
            parent_object_id: None,
            name: "World".to_string(),
            background_path: background_path.map(str::to_string),
            scene_type: Some("root_canvas".to_string()),
            viewport_json: None,
            metadata_json: None,
            branch_id,
        },
    )?;

    create_default_layers_for_scene(connection, scene.id, branch_id)?;

    Ok(scene)
}

pub fn attach_child_scene_to_marker(
    connection: &Connection,
    input: &AttachChildSceneToMarkerInput,
) -> Result<AttachChildSceneToMarkerResult> {
    let marker_row = get_object_row(connection, input.marker_id)?;
    if marker_row.kind != "marker" {
        return Err(AppError::internal(
            "MARKER_ATTACH_INVALID_KIND",
            "Only marker objects can receive a child scene",
        ));
    }
    if marker_row.linked_scene_id.is_some() {
        return Err(AppError::internal(
            "MARKER_CHILD_SCENE_ALREADY_EXISTS",
            "Marker already has a linked child scene",
        ));
    }

    let parent_scene = get_scene_row_by_id(connection, marker_row.scene_id)?;
    if let Some(branch_id) = input.branch_id {
        branch_scope::assert_branch_belongs_to_project(
            connection,
            branch_id,
            parent_scene.project_id,
        )?;
    }

    let tx = connection.unchecked_transaction()?;

    let child_scene = create_scene(
        &tx,
        &CreateCanvasSceneInput {
            project_id: parent_scene.project_id,
            parent_scene_id: Some(marker_row.scene_id),
            parent_object_id: Some(input.marker_id),
            name: input.scene_name.clone(),
            background_path: input.background_path.clone(),
            scene_type: Some("map".to_string()),
            viewport_json: None,
            metadata_json: None,
            branch_id: input.branch_id,
        },
    )?;

    create_default_layers_for_scene(&tx, child_scene.id, input.branch_id)?;

    if let Some(branch_id) = input.branch_id {
        let patch = serde_json::json!({ "linkedSceneId": child_scene.id });
        save_upsert_override(&tx, branch_id, "canvas_object", input.marker_id, &patch)?;
    } else {
        tx.execute(
            "UPDATE canvas_object SET linked_scene_id = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![child_scene.id, input.marker_id],
        )?;
    }

    tx.commit()?;

    let marker = get_object(
        connection,
        &GetCanvasObjectInput {
            id: input.marker_id,
            branch_id: input.branch_id,
        },
    )?;
    let child_scene = get_scene(
        connection,
        &GetCanvasSceneInput {
            id: child_scene.id,
            branch_id: input.branch_id,
        },
    )?;

    Ok(AttachChildSceneToMarkerResult {
        marker,
        child_scene,
    })
}

pub fn update_scene(
    connection: &Connection,
    input: &UpdateCanvasSceneInput,
) -> Result<CanvasScene> {
    let current = get_scene_row(connection, input.id)?;
    if input.scene_type.as_deref() == Some("root_canvas") {
        validate_root_canvas_invariant(connection, current.project_id, Some(input.id))?;
    }
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
    if let Some(value) = input.scene_type.as_ref() {
        fields.push("scene_type = ?".to_string());
        values.push(SqlValue::Text(value.clone()));
    }
    if let Some(value) = input.viewport_json.as_ref() {
        fields.push("viewport_json = ?".to_string());
        values.push(SqlValue::Text(
            value_or_empty_object(Some(value)).to_string(),
        ));
    }
    if let Some(value) = input.metadata_json.as_ref() {
        fields.push("metadata_json = ?".to_string());
        values.push(SqlValue::Text(
            value_or_empty_object(Some(value)).to_string(),
        ));
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

pub fn list_layers(
    connection: &Connection,
    input: &ListCanvasLayersInput,
) -> Result<Vec<CanvasLayer>> {
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

pub fn create_layer(
    connection: &Connection,
    input: &CreateCanvasLayerInput,
) -> Result<CanvasLayer> {
    validate_layer_kind(&input.kind)?;
    let scene = get_scene_row_by_id(connection, input.scene_id)?;
    if let Some(branch_id) = input.branch_id {
        branch_scope::assert_branch_belongs_to_project(connection, branch_id, scene.project_id)?;
    }
    let created_branch_id =
        branch_scope::resolve_created_branch_id(connection, scene.project_id, input.branch_id)?;
    let z_index = input
        .z_index
        .unwrap_or_else(|| next_layer_z_index(connection, input.scene_id));
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

pub fn update_layer(
    connection: &Connection,
    input: &UpdateCanvasLayerInput,
) -> Result<CanvasLayer> {
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
        values.push(SqlValue::Text(
            value_or_empty_object(Some(value)).to_string(),
        ));
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

pub fn reorder_layers(
    connection: &Connection,
    input: &ReorderCanvasLayersInput,
) -> Result<Vec<CanvasLayer>> {
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

pub fn list_objects(
    connection: &Connection,
    input: &ListCanvasObjectsInput,
) -> Result<Vec<CanvasObject>> {
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
        return Err(AppError::internal(
            "CANVAS_OBJECT_NOT_FOUND",
            "Canvas object not found",
        ));
    }
    let mut object = object_row_to_model(row);
    if let Some(branch_id) = input.branch_id {
        let override_row = get_branch_override(connection, branch_id, "canvas_object", input.id)?;
        object = branch_overlay::apply_item_overlay(Some(object), override_row.as_ref())?
            .ok_or_else(|| {
                AppError::internal("CANVAS_OBJECT_NOT_FOUND", "Canvas object not found")
            })?;
    }
    Ok(object)
}

pub fn create_object(
    connection: &Connection,
    input: &CreateCanvasObjectInput,
) -> Result<CanvasObject> {
    validate_object_kind_for_scene(connection, input.scene_id, &input.kind)?;
    validate_linked_scene(connection, input.scene_id, input.linked_scene_id)?;
    let scene = get_scene_row_by_id(connection, input.scene_id)?;
    if let Some(branch_id) = input.branch_id {
        branch_scope::assert_branch_belongs_to_project(connection, branch_id, scene.project_id)?;
    }
    let created_branch_id =
        branch_scope::resolve_created_branch_id(connection, scene.project_id, input.branch_id)?;
    let z_index = input
        .z_index
        .unwrap_or_else(|| next_object_z_index(connection, input.layer_id));
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

pub fn update_object(
    connection: &Connection,
    input: &UpdateCanvasObjectInput,
) -> Result<CanvasObject> {
    let obj_row = get_object_row(connection, input.id)?;
    if let Some(kind) = input.kind.as_deref() {
        validate_object_kind_for_scene(connection, obj_row.scene_id, kind)?;
    }
    if let Some(linked_id) = input.linked_scene_id {
        validate_linked_scene(connection, obj_row.scene_id, Some(linked_id))?;
    }
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
        values.push(SqlValue::Text(
            value_or_empty_object(Some(value)).to_string(),
        ));
    }
    if let Some(value) = input.geometry_json.as_ref() {
        fields.push("geometry_json = ?".to_string());
        values.push(SqlValue::Text(
            value_or_empty_object(Some(value)).to_string(),
        ));
    }
    if let Some(value) = input.style_json.as_ref() {
        fields.push("style_json = ?".to_string());
        values.push(SqlValue::Text(
            value_or_empty_object(Some(value)).to_string(),
        ));
    }
    if let Some(value) = input.content_json.as_ref() {
        fields.push("content_json = ?".to_string());
        values.push(SqlValue::Text(
            value_or_empty_object(Some(value)).to_string(),
        ));
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
        let query = format!(
            "UPDATE canvas_object SET {} WHERE id = ?",
            fields.join(", ")
        );
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

pub fn reorder_objects(
    connection: &Connection,
    input: &ReorderCanvasObjectsInput,
) -> Result<Vec<CanvasObject>> {
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

pub fn bulk_upsert_objects(
    connection: &Connection,
    input: &BulkUpsertCanvasObjectsInput,
) -> Result<Vec<CanvasObject>> {
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

pub fn bulk_delete_objects(
    connection: &Connection,
    input: &BulkDeleteCanvasObjectsInput,
) -> Result<()> {
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

pub fn reconcile_scene(
    connection: &Connection,
    input: &ReconcileCanvasSceneInput,
) -> Result<CanvasReconcileResult> {
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
        _name,
        scene_id,
        scene_name,
        _faction_id,
        _occupant_name,
        _occupant_kind,
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
            let object = get_object(
                connection,
                &GetCanvasObjectInput {
                    id,
                    branch_id: input.branch_id,
                },
            )?;
            let name = object.name.unwrap_or_default();
            let faction_id = object
                .content_json
                .as_object()
                .and_then(|content| content.get("factionId"))
                .and_then(|value| value.as_i64())
                .and_then(|value| i32::try_from(value).ok());
            let occupant = if let Some(faction_id) = faction_id {
                connection
                    .query_row(
                        "SELECT name, kind FROM factions WHERE id = ?1",
                        params![faction_id],
                        |row| {
                            Ok((
                                row.get::<_, Option<String>>(0)?,
                                row.get::<_, Option<String>>(1)?,
                            ))
                        },
                    )
                    .optional()?
                    .unwrap_or((None, None))
            } else {
                (None, None)
            };
            result.push(CanvasTerritorySummary {
                id,
                name,
                scene_id,
                scene_name,
                faction_id,
                occupant_name: occupant.0,
                occupant_kind: occupant.1,
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
              id, project_id, parent_scene_id, parent_object_id, name, background_path, scene_type,
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

fn get_layer_by_id(
    connection: &Connection,
    id: i32,
    branch_id: Option<i32>,
) -> Result<CanvasLayer> {
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
        return Err(AppError::internal(
            "CANVAS_LAYER_NOT_FOUND",
            "Canvas layer not found",
        ));
    }
    let mut layer = layer_row_to_model(row);
    if let Some(branch_id) = branch_id {
        let override_row = get_branch_override(connection, branch_id, "canvas_layer", id)?;
        layer = branch_overlay::apply_item_overlay(Some(layer), override_row.as_ref())?
            .ok_or_else(|| {
                AppError::internal("CANVAS_LAYER_NOT_FOUND", "Canvas layer not found")
            })?;
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
        scene_type: row.get("scene_type")?,
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
        scene_type: row.scene_type,
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
    value.cloned().unwrap_or_else(|| Value::Object(Map::new()))
}

fn bool_to_sql(value: bool) -> i32 {
    if value {
        1
    } else {
        0
    }
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

fn is_ancestor_scene(
    connection: &Connection,
    ancestor_id: i32,
    descendant_id: i32,
) -> Result<bool> {
    if ancestor_id == descendant_id {
        return Ok(true);
    }
    let mut current_id = descendant_id;
    for _ in 0..100 {
        let parent_id: Option<i32> = connection
            .query_row(
                "SELECT parent_scene_id FROM canvas_scene WHERE id = ?1",
                params![current_id],
                |row| row.get(0),
            )
            .optional()?
            .flatten();

        match parent_id {
            Some(pid) => {
                if pid == ancestor_id {
                    return Ok(true);
                }
                current_id = pid;
            }
            None => break,
        }
    }
    Ok(false)
}

fn validate_object_kind_for_scene(
    connection: &Connection,
    scene_id: i32,
    kind: &str,
) -> Result<()> {
    validate_object_kind(kind)?;

    let scene_type: Option<String> = connection
        .query_row(
            "SELECT scene_type FROM canvas_scene WHERE id = ?1",
            params![scene_id],
            |row| row.get(0),
        )
        .optional()?
        .flatten();

    if let Some(stype) = scene_type {
        match stype.as_str() {
            "root_canvas" => {
                let allowed = [
                    "text",
                    "curve_text",
                    "rectangle",
                    "ellipse",
                    "polygon",
                    "polyline",
                    "image",
                    "scene_container",
                ];
                if !allowed.contains(&kind) {
                    return Err(AppError::internal(
                        "INVALID_OBJECT_KIND_FOR_ROOT_CANVAS",
                        format!("Object kind '{kind}' is not allowed on root_canvas"),
                    ));
                }
            }
            "map" => {
                let allowed = [
                    "territory",
                    "marker",
                    "text",
                    "curve_text",
                    "rectangle",
                    "ellipse",
                    "polygon",
                    "polyline",
                    "image",
                ];
                if !allowed.contains(&kind) {
                    return Err(AppError::internal(
                        "INVALID_OBJECT_KIND_FOR_MAP",
                        format!("Object kind '{kind}' is not allowed on map scene"),
                    ));
                }
            }
            _ => {}
        }
    }
    Ok(())
}

fn validate_linked_scene(
    connection: &Connection,
    object_scene_id: i32,
    linked_scene_id: Option<i32>,
) -> Result<()> {
    if let Some(linked_id) = linked_scene_id {
        if linked_id == object_scene_id {
            return Err(AppError::internal(
                "LINKED_SCENE_SELF_REFERENCE",
                "Cannot link an object to its own scene",
            ));
        }
        if is_ancestor_scene(connection, linked_id, object_scene_id)? {
            return Err(AppError::internal(
                "LINKED_SCENE_ANCESTOR_REFERENCE",
                "Cannot link an object to an ancestor scene (cycle detected)",
            ));
        }
    }
    Ok(())
}

fn validate_root_canvas_invariant(
    connection: &Connection,
    project_id: i32,
    scene_id: Option<i32>,
) -> Result<()> {
    let existing_root_id: Option<i32> = if let Some(sid) = scene_id {
        connection.query_row(
            "SELECT id FROM canvas_scene WHERE project_id = ?1 AND scene_type = 'root_canvas' AND id != ?2 LIMIT 1",
            params![project_id, sid],
            |row| row.get(0),
        ).optional()?
    } else {
        connection.query_row(
            "SELECT id FROM canvas_scene WHERE project_id = ?1 AND scene_type = 'root_canvas' LIMIT 1",
            params![project_id],
            |row| row.get(0),
        ).optional()?
    };

    if existing_root_id.is_some() {
        return Err(AppError::internal(
            "MULTIPLE_ROOT_CANVASES",
            "A project can only have one root_canvas scene",
        ));
    }
    Ok(())
}

pub fn create_map_scene_container(
    connection: &Connection,
    input: &CreateMapSceneContainerInput,
) -> Result<CreateMapSceneContainerResult> {
    if input.background_path.trim().is_empty() {
        return Err(AppError::internal(
            "CREATE_MAP_MISSING_BACKGROUND",
            "Background path is required for creating a map",
        ));
    }

    let parent_scene = get_scene_row_by_id(connection, input.parent_scene_id)?;
    if parent_scene.project_id != input.project_id {
        return Err(AppError::internal(
            "INVALID_PROJECT_ID",
            "Parent scene does not belong to the specified project",
        ));
    }

    let layer_scene_id: i32 = connection
        .query_row(
            "SELECT scene_id FROM canvas_layer WHERE id = ?1",
            params![input.parent_layer_id],
            |row| row.get(0),
        )
        .optional()?
        .ok_or_else(|| AppError::internal("LAYER_NOT_FOUND", "Specified parent layer not found"))?;

    if layer_scene_id != input.parent_scene_id {
        return Err(AppError::internal(
            "INVALID_LAYER_SCENE",
            "Specified layer does not belong to the parent scene",
        ));
    }

    if let Some(branch_id) = input.branch_id {
        branch_scope::assert_branch_belongs_to_project(connection, branch_id, input.project_id)?;
    }

    let tx = connection.unchecked_transaction()?;

    let child_scene = create_scene(
        &tx,
        &CreateCanvasSceneInput {
            project_id: input.project_id,
            parent_scene_id: Some(input.parent_scene_id),
            parent_object_id: None,
            name: input.map_name.clone(),
            background_path: Some(input.background_path.clone()),
            scene_type: Some("map".to_string()),
            viewport_json: None,
            metadata_json: None,
            branch_id: input.branch_id,
        },
    )?;

    create_default_layers_for_scene(&tx, child_scene.id, input.branch_id)?;

    let container_object = create_object(
        &tx,
        &CreateCanvasObjectInput {
            scene_id: input.parent_scene_id,
            layer_id: input.parent_layer_id,
            kind: "scene_container".to_string(),
            name: input
                .object_name
                .clone()
                .or_else(|| Some(input.map_name.clone())),
            z_index: None,
            transform_json: input.transform_json.clone(),
            geometry_json: None,
            style_json: input.style_json.clone(),
            content_json: input.content_json.clone(),
            resource_path: None,
            linked_note_id: None,
            linked_scene_id: Some(child_scene.id),
            is_hidden: Some(false),
            is_locked: Some(false),
            branch_id: input.branch_id,
        },
    )?;

    if let Some(branch_id) = input.branch_id {
        let patch = serde_json::json!({ "parentObjectId": container_object.id });
        save_upsert_override(&tx, branch_id, "canvas_scene", child_scene.id, &patch)?;
    } else {
        tx.execute(
            "UPDATE canvas_scene SET parent_object_id = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![container_object.id, child_scene.id],
        )?;
    }

    tx.commit()?;

    let container_object = get_object(
        connection,
        &GetCanvasObjectInput {
            id: container_object.id,
            branch_id: input.branch_id,
        },
    )?;

    let map_scene = get_scene(
        connection,
        &GetCanvasSceneInput {
            id: child_scene.id,
            branch_id: input.branch_id,
        },
    )?;

    Ok(CreateMapSceneContainerResult {
        container_object,
        map_scene,
    })
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
    if let Some(value) = input.scene_type.as_ref() {
        patch.insert("sceneType".to_string(), Value::String(value.clone()));
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

fn apply_overrides<T>(rows: Vec<T>, overrides: HashMap<i32, BranchOverride>) -> Result<Vec<T>>
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::migrations::run_migrations;
    use crate::models::branch::CreateBranchInput;
    use crate::models::canvas::CreateCanvasObjectInput;
    use crate::models::faction::{CreateFactionInput, GetFactionInput, UpdateFactionInput};
    use crate::models::project::CreateProjectInput;
    use crate::repositories::branches::{create_branch, get_main_branch_id_for_project};
    use crate::repositories::factions::{create_faction, get_faction_by_id, update_faction};
    use crate::repositories::projects::create_project;
    use serde_json::json;

    fn test_connection() -> Connection {
        let connection = Connection::open_in_memory().expect("in-memory db");
        connection
            .execute("PRAGMA foreign_keys = ON", [])
            .expect("foreign keys");
        run_migrations(&connection).expect("migrations");
        connection
    }

    fn faction_update_with_territories(
        id: i32,
        territory_ids: Vec<i32>,
        branch_id: Option<i32>,
    ) -> UpdateFactionInput {
        UpdateFactionInput {
            id,
            name: None,
            kind: None,
            r#type: None,
            motto: None,
            description: None,
            history: None,
            goals: None,
            headquarters: None,
            territory: None,
            ruling_dynasty_id: None,
            ruler_character_id: None,
            territory_ids: Some(territory_ids),
            treasury: None,
            population: None,
            army_size: None,
            navy_size: None,
            territory_km2: None,
            annual_income: None,
            annual_expenses: None,
            members_count: None,
            influence: None,
            status: None,
            color: None,
            secondary_color: None,
            founded_date: None,
            disbanded_date: None,
            parent_faction_id: None,
            sort_order: None,
            branch_id,
        }
    }

    fn create_test_territory(
        connection: &Connection,
        scene_id: i32,
        layer_id: i32,
        name: &str,
        faction_id: Option<i32>,
    ) -> CanvasObject {
        create_object(
            connection,
            &CreateCanvasObjectInput {
                scene_id,
                layer_id,
                kind: "territory".to_string(),
                name: Some(name.to_string()),
                z_index: Some(0),
                transform_json: json!({}),
                geometry_json: Some(json!({
                    "rings": [[
                        { "x": 0.0, "y": 0.0 },
                        { "x": 120.0, "y": 0.0 },
                        { "x": 60.0, "y": 80.0 }
                    ]]
                })),
                style_json: Some(json!({
                    "fill": "#4ecdc4",
                    "opacity": 0.25,
                    "stroke": "#9ff3df",
                    "strokeWidth": 2
                })),
                content_json: Some(match faction_id {
                    Some(id) => json!({ "description": "Northern border", "factionId": id }),
                    None => json!({ "description": "Northern border" }),
                }),
                resource_path: None,
                linked_note_id: None,
                linked_scene_id: None,
                is_hidden: Some(false),
                is_locked: Some(false),
                branch_id: None,
            },
        )
        .expect("territory")
    }

    fn territory_faction_id(
        connection: &Connection,
        territory_id: i32,
        branch_id: Option<i32>,
    ) -> Option<i64> {
        get_object(
            connection,
            &GetCanvasObjectInput {
                id: territory_id,
                branch_id,
            },
        )
        .expect("territory reload")
        .content_json
        .as_object()
        .and_then(|content| content.get("factionId"))
        .and_then(|value| value.as_i64())
    }

    fn scene_count(connection: &Connection) -> i32 {
        connection
            .query_row("SELECT COUNT(*) FROM canvas_scene", [], |row| row.get(0))
            .expect("scene count")
    }

    fn setup_project_with_marker(connection: &Connection) -> (i32, i32) {
        let project = create_project(
            connection,
            &CreateProjectInput {
                name: "Parity Test".to_string(),
                description: None,
                status: None,
                main_branch_name: None,
                cover_image_path: None,
            },
        )
        .expect("project");

        let root = get_root_scene(
            connection,
            &GetRootCanvasSceneInput {
                project_id: project.id,
                branch_id: None,
            },
        )
        .expect("root scene")
        .expect("root scene exists");

        connection
            .execute(
                "UPDATE canvas_scene SET scene_type = 'map' WHERE id = ?1",
                params![root.id],
            )
            .expect("update scene type");

        let layers = list_layers(
            connection,
            &ListCanvasLayersInput {
                scene_id: root.id,
                branch_id: None,
            },
        )
        .expect("layers");
        let content_layer = layers
            .iter()
            .find(|layer| layer.kind == "content")
            .expect("content layer");

        let marker = create_object(
            connection,
            &CreateCanvasObjectInput {
                scene_id: root.id,
                layer_id: content_layer.id,
                kind: "marker".to_string(),
                name: Some("Gate".to_string()),
                z_index: Some(0),
                transform_json: json!({ "x": 10.0, "y": 20.0 }),
                geometry_json: Some(json!({ "radius": 12 })),
                style_json: Some(json!({ "fill": "#ff6b6b" })),
                content_json: Some(json!({ "title": "Gate", "description": "", "icon": "castle" })),
                resource_path: None,
                linked_note_id: None,
                linked_scene_id: None,
                is_hidden: Some(false),
                is_locked: Some(false),
                branch_id: None,
            },
        )
        .expect("marker");

        (project.id, marker.id)
    }

    #[test]
    fn attach_child_scene_links_marker_and_creates_layers() {
        let connection = test_connection();
        let (_project_id, marker_id) = setup_project_with_marker(&connection);
        let scenes_before = scene_count(&connection);

        let result = attach_child_scene_to_marker(
            &connection,
            &AttachChildSceneToMarkerInput {
                marker_id,
                scene_name: "Inner Map".to_string(),
                background_path: None,
                branch_id: None,
            },
        )
        .expect("attach");

        assert_eq!(scene_count(&connection), scenes_before + 1);
        assert_eq!(result.marker.linked_scene_id, Some(result.child_scene.id));
        assert_eq!(
            result.child_scene.parent_scene_id,
            Some(result.marker.scene_id)
        );
        assert_eq!(result.child_scene.parent_object_id, Some(marker_id));

        let child_layers = list_layers(
            &connection,
            &ListCanvasLayersInput {
                scene_id: result.child_scene.id,
                branch_id: None,
            },
        )
        .expect("child layers");
        assert_eq!(child_layers.len(), 2);
    }

    #[test]
    fn attach_child_scene_rejects_second_attach() {
        let connection = test_connection();
        let (_project_id, marker_id) = setup_project_with_marker(&connection);

        attach_child_scene_to_marker(
            &connection,
            &AttachChildSceneToMarkerInput {
                marker_id,
                scene_name: "Inner Map".to_string(),
                background_path: None,
                branch_id: None,
            },
        )
        .expect("first attach");

        let scenes_before = scene_count(&connection);
        let error = attach_child_scene_to_marker(
            &connection,
            &AttachChildSceneToMarkerInput {
                marker_id,
                scene_name: "Duplicate".to_string(),
                background_path: None,
                branch_id: None,
            },
        )
        .expect_err("second attach must fail");

        assert_eq!(error.to_payload().code, "MARKER_CHILD_SCENE_ALREADY_EXISTS");
        assert_eq!(scene_count(&connection), scenes_before);
    }

    #[test]
    fn attach_child_scene_rejects_non_marker_kind() {
        let connection = test_connection();
        let (_project_id, marker_id) = setup_project_with_marker(&connection);
        connection
            .execute(
                "UPDATE canvas_object SET kind = 'text' WHERE id = ?1",
                params![marker_id],
            )
            .expect("retag object");

        let scenes_before = scene_count(&connection);
        let error = attach_child_scene_to_marker(
            &connection,
            &AttachChildSceneToMarkerInput {
                marker_id,
                scene_name: "Inner Map".to_string(),
                background_path: None,
                branch_id: None,
            },
        )
        .expect_err("non-marker attach must fail");

        assert_eq!(error.to_payload().code, "MARKER_ATTACH_INVALID_KIND");
        assert_eq!(scene_count(&connection), scenes_before);
    }

    #[test]
    fn attach_child_scene_rolls_back_when_update_blocked() {
        let connection = test_connection();
        let (_project_id, marker_id) = setup_project_with_marker(&connection);
        let scenes_before = scene_count(&connection);

        connection
            .execute_batch(
                r#"
                CREATE TRIGGER canvas_attach_test_fail_update
                BEFORE UPDATE OF linked_scene_id ON canvas_object
                WHEN NEW.linked_scene_id IS NOT NULL
                BEGIN
                  SELECT RAISE(ABORT, 'forced attach failure');
                END;
                "#,
            )
            .expect("trigger");

        let error = attach_child_scene_to_marker(
            &connection,
            &AttachChildSceneToMarkerInput {
                marker_id,
                scene_name: "Rollback Map".to_string(),
                background_path: None,
                branch_id: None,
            },
        )
        .expect_err("attach must fail at marker update");

        assert_ne!(error.to_payload().code, "MARKER_CHILD_SCENE_ALREADY_EXISTS");
        assert_eq!(scene_count(&connection), scenes_before);

        let marker = get_object(
            &connection,
            &GetCanvasObjectInput {
                id: marker_id,
                branch_id: None,
            },
        )
        .expect("marker reload");
        assert!(marker.linked_scene_id.is_none());
    }

    #[test]
    fn territory_kind_is_listed_and_synced_with_faction() {
        let connection = test_connection();
        let project = create_project(
            &connection,
            &CreateProjectInput {
                name: "Territory Test".to_string(),
                description: None,
                status: None,
                main_branch_name: None,
                cover_image_path: None,
            },
        )
        .expect("project");

        let root = get_root_scene(
            &connection,
            &GetRootCanvasSceneInput {
                project_id: project.id,
                branch_id: None,
            },
        )
        .expect("root")
        .expect("root exists");

        connection
            .execute(
                "UPDATE canvas_scene SET scene_type = 'map' WHERE id = ?1",
                params![root.id],
            )
            .expect("update scene type");

        let content_layer = list_layers(
            &connection,
            &ListCanvasLayersInput {
                scene_id: root.id,
                branch_id: None,
            },
        )
        .expect("layers")
        .into_iter()
        .find(|layer| layer.kind == "content")
        .expect("content layer");

        let state = create_faction(
            &connection,
            &CreateFactionInput {
                project_id: project.id,
                name: "Test State".to_string(),
                kind: Some("state".to_string()),
                r#type: None,
                motto: None,
                description: None,
                history: None,
                goals: None,
                headquarters: None,
                territory: None,
                ruling_dynasty_id: None,
                ruler_character_id: None,
                territory_ids: None,
                treasury: None,
                population: None,
                army_size: None,
                navy_size: None,
                territory_km2: None,
                annual_income: None,
                annual_expenses: None,
                members_count: None,
                influence: None,
                status: None,
                color: Some("#336699".to_string()),
                secondary_color: Some("#224466".to_string()),
                founded_date: None,
                disbanded_date: None,
                parent_faction_id: None,
                sort_order: None,
                branch_id: None,
            },
        )
        .expect("state faction");

        let territory = create_test_territory(
            &connection,
            root.id,
            content_layer.id,
            "Borderlands",
            Some(state.id),
        );

        let summaries = list_territory_summaries(
            &connection,
            &ListCanvasTerritorySummariesInput {
                project_id: project.id,
                branch_id: None,
            },
        )
        .expect("summaries");
        assert_eq!(summaries.len(), 1);
        assert_eq!(summaries[0].id, territory.id);
        assert_eq!(summaries[0].faction_id, Some(state.id));
        assert_eq!(summaries[0].occupant_name.as_deref(), Some("Test State"));

        update_faction(
            &connection,
            &faction_update_with_territories(state.id, vec![territory.id], None),
        )
        .expect("faction sync");

        let synced = get_object(
            &connection,
            &GetCanvasObjectInput {
                id: territory.id,
                branch_id: None,
            },
        )
        .expect("territory reload");
        let content = synced.content_json.as_object().expect("content object");
        assert_eq!(
            content.get("factionId").and_then(|value| value.as_i64()),
            Some(i64::from(state.id))
        );
        let style = synced.style_json.as_object().expect("style object");
        assert_eq!(
            style.get("fill").and_then(|value| value.as_str()),
            Some("#336699")
        );
        assert_eq!(
            style.get("stroke").and_then(|value| value.as_str()),
            Some("#224466")
        );
        assert!(style.get("fillColor").is_none());
        assert!(style.get("strokeColor").is_none());

        let second_territory =
            create_test_territory(&connection, root.id, content_layer.id, "Southlands", None);
        update_faction(
            &connection,
            &faction_update_with_territories(
                state.id,
                vec![territory.id, second_territory.id],
                None,
            ),
        )
        .expect("multiple territory sync");
        let state_detail = get_faction_by_id(
            &connection,
            &GetFactionInput {
                id: state.id,
                branch_id: None,
            },
        )
        .expect("state detail");
        assert_eq!(
            state_detail
                .territories
                .iter()
                .map(|item| item.id)
                .collect::<Vec<_>>(),
            vec![territory.id, second_territory.id]
        );

        update_faction(
            &connection,
            &faction_update_with_territories(state.id, vec![second_territory.id], None),
        )
        .expect("unassign first territory");
        assert_eq!(territory_faction_id(&connection, territory.id, None), None);
        assert_eq!(
            territory_faction_id(&connection, second_territory.id, None),
            Some(i64::from(state.id))
        );

        let faction = create_faction(
            &connection,
            &CreateFactionInput {
                project_id: project.id,
                name: "Guild".to_string(),
                kind: Some("faction".to_string()),
                r#type: None,
                motto: None,
                description: None,
                history: None,
                goals: None,
                headquarters: None,
                territory: None,
                ruling_dynasty_id: None,
                ruler_character_id: None,
                territory_ids: Some(vec![territory.id]),
                treasury: None,
                population: None,
                army_size: None,
                navy_size: None,
                territory_km2: None,
                annual_income: None,
                annual_expenses: None,
                members_count: None,
                influence: None,
                status: None,
                color: Some("#663399".to_string()),
                secondary_color: Some("#442266".to_string()),
                founded_date: None,
                disbanded_date: None,
                parent_faction_id: None,
                sort_order: None,
                branch_id: None,
            },
        )
        .expect("faction with territory");
        assert_eq!(
            territory_faction_id(&connection, territory.id, None),
            Some(i64::from(faction.id))
        );
        assert_eq!(
            get_faction_by_id(
                &connection,
                &GetFactionInput {
                    id: faction.id,
                    branch_id: None,
                },
            )
            .expect("faction detail")
            .territories
            .iter()
            .map(|item| item.id)
            .collect::<Vec<_>>(),
            vec![territory.id]
        );

        let main_branch_id = get_main_branch_id_for_project(&connection, project.id)
            .expect("main branch lookup")
            .expect("main branch");
        let branch = create_branch(
            &connection,
            &CreateBranchInput {
                project_id: project.id,
                name: "Branch".to_string(),
                parent_branch_id: Some(main_branch_id),
                base_revision: None,
            },
        )
        .expect("branch");
        update_faction(
            &connection,
            &faction_update_with_territories(
                faction.id,
                vec![second_territory.id],
                Some(branch.id),
            ),
        )
        .expect("branch territory sync");
        assert_eq!(
            get_faction_by_id(
                &connection,
                &GetFactionInput {
                    id: faction.id,
                    branch_id: Some(branch.id),
                },
            )
            .expect("branch faction detail")
            .territories
            .iter()
            .map(|item| item.id)
            .collect::<Vec<_>>(),
            vec![second_territory.id]
        );
        assert_eq!(
            territory_faction_id(&connection, territory.id, None),
            Some(i64::from(faction.id))
        );
        assert_eq!(
            territory_faction_id(&connection, second_territory.id, Some(branch.id)),
            Some(i64::from(faction.id))
        );
    }

    #[test]
    fn test_scene_type_and_scene_container_invariants() {
        let connection = test_connection();
        let project = create_project(
            &connection,
            &CreateProjectInput {
                name: "Invariants Test".to_string(),
                description: None,
                status: None,
                main_branch_name: None,
                cover_image_path: None,
            },
        )
        .expect("project");

        let root = get_root_scene(
            &connection,
            &GetRootCanvasSceneInput {
                project_id: project.id,
                branch_id: None,
            },
        )
        .expect("root")
        .expect("root exists");

        // 1. Invariant: one root_canvas per project
        let second_root_res = create_scene(
            &connection,
            &CreateCanvasSceneInput {
                project_id: project.id,
                parent_scene_id: None,
                parent_object_id: None,
                name: "Second Root".to_string(),
                background_path: None,
                scene_type: Some("root_canvas".to_string()),
                viewport_json: None,
                metadata_json: None,
                branch_id: None,
            },
        );
        assert!(second_root_res.is_err());
        assert_eq!(
            second_root_res.unwrap_err().to_payload().code,
            "MULTIPLE_ROOT_CANVASES"
        );

        // 2. Validate object kind accepts scene_container on root_canvas but rejects on map
        let layers = list_layers(
            &connection,
            &ListCanvasLayersInput {
                scene_id: root.id,
                branch_id: None,
            },
        )
        .expect("layers");
        let content_layer = layers
            .iter()
            .find(|layer| layer.kind == "content")
            .expect("content layer");

        // Create scene_container on root_canvas - should succeed
        let container_obj = create_object(
            &connection,
            &CreateCanvasObjectInput {
                scene_id: root.id,
                layer_id: content_layer.id,
                kind: "scene_container".to_string(),
                name: Some("Map Container".to_string()),
                z_index: Some(0),
                transform_json: json!({ "x": 0.0, "y": 0.0 }),
                geometry_json: None,
                style_json: None,
                content_json: None,
                resource_path: None,
                linked_note_id: None,
                linked_scene_id: None,
                is_hidden: None,
                is_locked: None,
                branch_id: None,
            },
        )
        .expect("create scene_container on root_canvas");

        // Try creating a marker on root_canvas - should fail
        let marker_on_root_res = create_object(
            &connection,
            &CreateCanvasObjectInput {
                scene_id: root.id,
                layer_id: content_layer.id,
                kind: "marker".to_string(),
                name: Some("Marker".to_string()),
                z_index: Some(0),
                transform_json: json!({ "x": 0.0, "y": 0.0 }),
                geometry_json: None,
                style_json: None,
                content_json: None,
                resource_path: None,
                linked_note_id: None,
                linked_scene_id: None,
                is_hidden: None,
                is_locked: None,
                branch_id: None,
            },
        );
        assert!(marker_on_root_res.is_err());
        assert_eq!(
            marker_on_root_res.unwrap_err().to_payload().code,
            "INVALID_OBJECT_KIND_FOR_ROOT_CANVAS"
        );

        // Create a map scene
        let map_scene = create_scene(
            &connection,
            &CreateCanvasSceneInput {
                project_id: project.id,
                parent_scene_id: Some(root.id),
                parent_object_id: Some(container_obj.id),
                name: "Map Scene".to_string(),
                background_path: Some("bg.jpg".to_string()),
                scene_type: Some("map".to_string()),
                viewport_json: None,
                metadata_json: None,
                branch_id: None,
            },
        )
        .expect("create map scene");

        create_default_layers_for_scene(&connection, map_scene.id, None).expect("default layers");
        let map_layers = list_layers(
            &connection,
            &ListCanvasLayersInput {
                scene_id: map_scene.id,
                branch_id: None,
            },
        )
        .expect("map layers");
        let map_content_layer = map_layers
            .iter()
            .find(|layer| layer.kind == "content")
            .expect("map content layer");

        // Try creating a scene_container on map scene - should fail
        let container_on_map_res = create_object(
            &connection,
            &CreateCanvasObjectInput {
                scene_id: map_scene.id,
                layer_id: map_content_layer.id,
                kind: "scene_container".to_string(),
                name: Some("Submap".to_string()),
                z_index: Some(0),
                transform_json: json!({ "x": 0.0, "y": 0.0 }),
                geometry_json: None,
                style_json: None,
                content_json: None,
                resource_path: None,
                linked_note_id: None,
                linked_scene_id: None,
                is_hidden: None,
                is_locked: None,
                branch_id: None,
            },
        );
        assert!(container_on_map_res.is_err());
        assert_eq!(
            container_on_map_res.unwrap_err().to_payload().code,
            "INVALID_OBJECT_KIND_FOR_MAP"
        );

        // 3. Rejects self linked_scene_id
        let self_link_res = update_object(
            &connection,
            &UpdateCanvasObjectInput {
                id: container_obj.id,
                layer_id: None,
                kind: None,
                name: None,
                z_index: None,
                transform_json: None,
                geometry_json: None,
                style_json: None,
                content_json: None,
                resource_path: None,
                linked_note_id: None,
                linked_scene_id: Some(root.id), // root.id is the scene of container_obj
                is_hidden: None,
                is_locked: None,
                branch_id: None,
            },
        );
        assert!(self_link_res.is_err());
        assert_eq!(
            self_link_res.unwrap_err().to_payload().code,
            "LINKED_SCENE_SELF_REFERENCE"
        );

        // 4. Rejects ancestor linked_scene_id
        // Let's link the container_obj to map_scene first (valid)
        update_object(
            &connection,
            &UpdateCanvasObjectInput {
                id: container_obj.id,
                layer_id: None,
                kind: None,
                name: None,
                z_index: None,
                transform_json: None,
                geometry_json: None,
                style_json: None,
                content_json: None,
                resource_path: None,
                linked_note_id: None,
                linked_scene_id: Some(map_scene.id),
                is_hidden: None,
                is_locked: None,
                branch_id: None,
            },
        )
        .expect("link container to map_scene");

        // Create an object inside map_scene
        let map_object = create_object(
            &connection,
            &CreateCanvasObjectInput {
                scene_id: map_scene.id,
                layer_id: map_content_layer.id,
                kind: "marker".to_string(),
                name: Some("Sub Marker".to_string()),
                z_index: Some(0),
                transform_json: json!({ "x": 0.0, "y": 0.0 }),
                geometry_json: None,
                style_json: None,
                content_json: None,
                resource_path: None,
                linked_note_id: None,
                linked_scene_id: None,
                is_hidden: None,
                is_locked: None,
                branch_id: None,
            },
        )
        .expect("create map_object");

        // Try to link map_object to root.id (which is an ancestor of map_scene) - should fail!
        let ancestor_link_res = update_object(
            &connection,
            &UpdateCanvasObjectInput {
                id: map_object.id,
                layer_id: None,
                kind: None,
                name: None,
                z_index: None,
                transform_json: None,
                geometry_json: None,
                style_json: None,
                content_json: None,
                resource_path: None,
                linked_note_id: None,
                linked_scene_id: Some(root.id),
                is_hidden: None,
                is_locked: None,
                branch_id: None,
            },
        );
        assert!(ancestor_link_res.is_err());
        assert_eq!(
            ancestor_link_res.unwrap_err().to_payload().code,
            "LINKED_SCENE_ANCESTOR_REFERENCE"
        );

        let empty_bg_res = create_map_scene_container(
            &connection,
            &CreateMapSceneContainerInput {
                project_id: project.id,
                parent_scene_id: root.id,
                parent_layer_id: content_layer.id,
                map_name: "Empty BG Map".to_string(),
                background_path: "   ".to_string(),
                object_name: None,
                transform_json: json!({ "x": 10.0, "y": 10.0 }),
                style_json: None,
                content_json: None,
                branch_id: None,
            },
        );
        assert!(empty_bg_res.is_err());
        assert_eq!(
            empty_bg_res.unwrap_err().to_payload().code,
            "CREATE_MAP_MISSING_BACKGROUND"
        );

        // 5. Atomic create map + scene_container does not leave orphan scene on failure
        // Let's count scenes before
        let scenes_before: i32 = connection
            .query_row("SELECT COUNT(*) FROM canvas_scene", [], |row| row.get(0))
            .unwrap();

        // Trigger a failure by passing an invalid parent_layer_id
        let atomic_fail_res = create_map_scene_container(
            &connection,
            &CreateMapSceneContainerInput {
                project_id: project.id,
                parent_scene_id: root.id,
                parent_layer_id: 999999, // Non-existent layer
                map_name: "Atomic Fail Map".to_string(),
                background_path: "bg.jpg".to_string(),
                object_name: None,
                transform_json: json!({ "x": 10.0, "y": 10.0 }),
                style_json: None,
                content_json: None,
                branch_id: None,
            },
        );
        assert!(atomic_fail_res.is_err());

        // Verify that the scene was rolled back and not left as an orphan
        let scenes_after: i32 = connection
            .query_row("SELECT COUNT(*) FROM canvas_scene", [], |row| row.get(0))
            .unwrap();
        assert_eq!(scenes_before, scenes_after);

        // Try a successful atomic creation
        let atomic_success = create_map_scene_container(
            &connection,
            &CreateMapSceneContainerInput {
                project_id: project.id,
                parent_scene_id: root.id,
                parent_layer_id: content_layer.id,
                map_name: "Atomic Success Map".to_string(),
                background_path: "bg.jpg".to_string(),
                object_name: None,
                transform_json: json!({ "x": 10.0, "y": 10.0 }),
                style_json: None,
                content_json: None,
                branch_id: None,
            },
        )
        .expect("atomic creation success");

        assert_eq!(atomic_success.map_scene.scene_type, Some("map".to_string()));
        assert_eq!(
            atomic_success.map_scene.background_path.as_deref(),
            Some("bg.jpg")
        );
        assert_eq!(
            atomic_success.container_object.kind,
            "scene_container".to_string()
        );
        assert_eq!(
            atomic_success.container_object.linked_scene_id,
            Some(atomic_success.map_scene.id)
        );
    }
}
