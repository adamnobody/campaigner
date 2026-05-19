use std::collections::HashMap;

use rusqlite::{
    params, params_from_iter, types::Value as SqlValue, Connection, OptionalExtension, Row,
};
use serde_json::{Map, Value};

use crate::error::{AppError, Result};
use crate::models::branch::BranchOverride;
use crate::models::map::{
    CreateMapInput, CreateMapMarkerInput, CreateMapTerritoryInput, DeleteMapInput,
    DeleteMapMarkerInput, DeleteMapTerritoryInput, GetMapInput, GetMapTreeInput, GetRootMapInput,
    ListMapMarkersInput, ListMapTerritoriesInput, ListTerritorySummariesInput, MapMarker,
    MapRecord, MapTerritory, MapTerritoryPoint, MapTerritorySummary, UpdateMapInput,
    UpdateMapMarkerInput, UpdateMapTerritoryInput, MARKER_ICONS,
};
use crate::services::branch_overlay;
use crate::services::branch_scope;

#[derive(Debug, Clone)]
struct MapRow {
    id: i32,
    project_id: i32,
    parent_map_id: Option<i32>,
    parent_marker_id: Option<i32>,
    name: String,
    image_path: Option<String>,
    created_at: String,
    updated_at: String,
    created_branch_id: Option<i32>,
}

#[derive(Debug, Clone)]
struct MarkerRow {
    id: i32,
    map_id: i32,
    title: String,
    description: String,
    position_x: f64,
    position_y: f64,
    color: String,
    icon: String,
    linked_note_id: Option<i32>,
    child_map_id: Option<i32>,
    created_at: String,
    updated_at: String,
    created_branch_id: Option<i32>,
}

#[derive(Debug, Clone)]
struct TerritoryRow {
    id: i32,
    map_id: i32,
    name: String,
    description: String,
    color: String,
    opacity: f64,
    border_color: String,
    border_width: f64,
    smoothing: f64,
    points: String,
    faction_id: Option<i32>,
    sort_order: i32,
    created_at: String,
    updated_at: String,
    created_branch_id: Option<i32>,
}

pub fn create_root_map_for_project(
    connection: &Connection,
    project_id: i32,
    image_path: Option<&str>,
    created_branch_id: Option<i32>,
) -> Result<MapRecord> {
    connection.execute(
        r#"
        INSERT INTO maps (project_id, parent_map_id, name, image_path, created_branch_id)
        VALUES (?1, NULL, ?2, ?3, ?4)
        "#,
        params![project_id, "World", image_path, created_branch_id],
    )?;

    let id = i32::try_from(connection.last_insert_rowid())
        .map_err(|_| AppError::internal("MAP_ID_RANGE_ERROR", "Created map id is out of range"))?;

    get_map_by_id(connection, &GetMapInput { id })
}

pub fn get_root_map(connection: &Connection, input: &GetRootMapInput) -> Result<Option<MapRecord>> {
    let mut statement = connection.prepare(
        r#"
        SELECT
            id,
            project_id,
            parent_map_id,
            parent_marker_id,
            name,
            image_path,
            created_at,
            updated_at,
            created_branch_id
        FROM maps
        WHERE project_id = ?1 AND parent_map_id IS NULL
        "#,
    )?;

    let rows = statement.query_map(params![input.project_id], map_map_row)?;
    let base_rows = rows.collect::<std::result::Result<Vec<_>, _>>()?;

    let view_branch_id =
        branch_scope::effective_branch_id_for_read(connection, input.project_id, input.branch_id)?;

    for row in base_rows {
        if branch_scope::is_entity_visible_in_branch(
            connection,
            row.project_id,
            view_branch_id,
            row.created_branch_id,
            Some(row.created_at.as_str()),
        )? {
            return Ok(Some(map_map_row_to_record(row)));
        }
    }

    Ok(None)
}

pub fn get_map_tree(connection: &Connection, input: &GetMapTreeInput) -> Result<Vec<MapRecord>> {
    let mut statement = connection.prepare(
        r#"
        SELECT
            id,
            project_id,
            parent_map_id,
            parent_marker_id,
            name,
            image_path,
            created_at,
            updated_at,
            created_branch_id
        FROM maps
        WHERE project_id = ?1
        ORDER BY parent_map_id, name
        "#,
    )?;

    let rows = statement.query_map(params![input.project_id], map_map_row)?;
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
            visible.push(map_map_row_to_record(row));
        }
    }

    Ok(visible)
}

pub fn get_map_by_id(connection: &Connection, input: &GetMapInput) -> Result<MapRecord> {
    connection
        .query_row(
            r#"
            SELECT
                id,
                project_id,
                parent_map_id,
                parent_marker_id,
                name,
                image_path,
                created_at,
                updated_at,
                created_branch_id
            FROM maps
            WHERE id = ?1
            "#,
            params![input.id],
            map_map_row,
        )
        .optional()?
        .map(map_map_row_to_record)
        .ok_or_else(|| AppError::internal("MAP_NOT_FOUND", "Map not found"))
}

fn get_map_row(connection: &Connection, map_id: i32) -> Result<MapRow> {
    connection
        .query_row(
            r#"
            SELECT
                id,
                project_id,
                parent_map_id,
                parent_marker_id,
                name,
                image_path,
                created_at,
                updated_at,
                created_branch_id
            FROM maps
            WHERE id = ?1
            "#,
            params![map_id],
            map_map_row,
        )
        .map_err(|error| match error {
            rusqlite::Error::QueryReturnedNoRows => {
                AppError::internal("MAP_NOT_FOUND", "Map not found")
            }
            other => AppError::from(other),
        })
}

pub fn create_map(connection: &Connection, input: &CreateMapInput) -> Result<MapRecord> {
    if let Some(branch_id) = input.branch_id {
        branch_scope::assert_branch_belongs_to_project(connection, branch_id, input.project_id)?;
    }

    let created_branch_id =
        branch_scope::resolve_created_branch_id(connection, input.project_id, input.branch_id)?;

    connection.execute(
        r#"
        INSERT INTO maps (
            project_id, parent_map_id, parent_marker_id, name, image_path, created_branch_id
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
        "#,
        params![
            input.project_id,
            input.parent_map_id,
            input.parent_marker_id,
            input.name,
            input.image_path,
            created_branch_id,
        ],
    )?;

    let id = i32::try_from(connection.last_insert_rowid())
        .map_err(|_| AppError::internal("MAP_ID_RANGE_ERROR", "Created map id is out of range"))?;

    get_map_by_id(connection, &GetMapInput { id })
}

pub fn update_map(connection: &Connection, input: &UpdateMapInput) -> Result<MapRecord> {
    let _ = get_map_by_id(connection, &GetMapInput { id: input.id })?;

    let mut fields: Vec<String> = Vec::new();
    let mut values: Vec<SqlValue> = Vec::new();

    if let Some(name) = input.name.as_deref() {
        fields.push("name = ?".to_string());
        values.push(SqlValue::Text(name.to_string()));
    }
    if let Some(image_path) = input.image_path.as_ref() {
        fields.push("image_path = ?".to_string());
        values.push(SqlValue::Text(image_path.clone()));
    }

    if !fields.is_empty() {
        fields.push("updated_at = datetime('now')".to_string());
        let query = format!("UPDATE maps SET {} WHERE id = ?", fields.join(", "));
        values.push(SqlValue::Integer(i64::from(input.id)));
        connection.execute(&query, params_from_iter(values.iter()))?;
    }

    get_map_by_id(connection, &GetMapInput { id: input.id })
}

pub fn delete_map(connection: &Connection, input: &DeleteMapInput) -> Result<()> {
    let _ = get_map_by_id(connection, &GetMapInput { id: input.id })?;
    connection.execute("DELETE FROM maps WHERE id = ?1", params![input.id])?;
    Ok(())
}

pub fn list_map_markers(
    connection: &Connection,
    input: &ListMapMarkersInput,
) -> Result<Vec<MapMarker>> {
    let map = get_map_row(connection, input.map_id)?;

    let mut statement = connection.prepare(
        r#"
        SELECT
            id,
            map_id,
            title,
            description,
            position_x,
            position_y,
            color,
            icon,
            linked_note_id,
            child_map_id,
            created_at,
            updated_at,
            created_branch_id
        FROM map_markers
        WHERE map_id = ?1
        ORDER BY created_at
        "#,
    )?;

    let rows = statement.query_map(params![input.map_id], map_marker_row)?;
    let base_rows = rows.collect::<std::result::Result<Vec<_>, _>>()?;

    let view_branch_id =
        branch_scope::effective_branch_id_for_read(connection, map.project_id, input.branch_id)?;

    let mut visible = Vec::new();
    for row in base_rows {
        if branch_scope::is_entity_visible_in_branch(
            connection,
            map.project_id,
            view_branch_id,
            row.created_branch_id,
            Some(row.created_at.as_str()),
        )? {
            visible.push(map_marker_row_to_marker(row));
        }
    }

    if let Some(branch_id) = input.branch_id {
        let overrides = list_branch_overrides(connection, branch_id, "map_marker")?;
        return apply_marker_overrides(visible, overrides);
    }

    Ok(visible)
}

pub fn get_map_marker_by_id(
    connection: &Connection,
    marker_id: i32,
    branch_id: Option<i32>,
) -> Result<MapMarker> {
    let row = connection
        .query_row(
            r#"
            SELECT
                id,
                map_id,
                title,
                description,
                position_x,
                position_y,
                color,
                icon,
                linked_note_id,
                child_map_id,
                created_at,
                updated_at,
                created_branch_id
            FROM map_markers
            WHERE id = ?1
            "#,
            params![marker_id],
            map_marker_row,
        )
        .optional()?
        .ok_or_else(|| AppError::internal("MAP_MARKER_NOT_FOUND", "Map marker not found"))?;

    let map = get_map_row(connection, row.map_id)?;
    let view_branch_id =
        branch_scope::effective_branch_id_for_read(connection, map.project_id, branch_id)?;

    if !branch_scope::is_entity_visible_in_branch(
        connection,
        map.project_id,
        view_branch_id,
        row.created_branch_id,
        Some(row.created_at.as_str()),
    )? {
        return Err(AppError::internal(
            "MAP_MARKER_NOT_FOUND",
            "Map marker not found",
        ));
    }

    let mut marker = map_marker_row_to_marker(row);

    if let Some(branch_id) = branch_id {
        let override_row = get_branch_override(connection, branch_id, "map_marker", marker_id)?;
        marker = branch_overlay::apply_item_overlay(Some(marker), override_row.as_ref())?
            .ok_or_else(|| AppError::internal("MAP_MARKER_NOT_FOUND", "Map marker not found"))?;
    }

    Ok(marker)
}

pub fn create_map_marker(
    connection: &Connection,
    input: &CreateMapMarkerInput,
) -> Result<MapMarker> {
    let map = get_map_row(connection, input.map_id)?;
    if let Some(branch_id) = input.branch_id {
        branch_scope::assert_branch_belongs_to_project(connection, branch_id, map.project_id)?;
    }

    let icon = input.icon.clone().unwrap_or_else(|| "custom".to_string());
    validate_marker_icon(&icon)?;
    let color = input.color.clone().unwrap_or_else(|| "#FF6B6B".to_string());
    validate_hex_color(&color)?;

    let created_branch_id =
        branch_scope::resolve_created_branch_id(connection, map.project_id, input.branch_id)?;

    connection.execute(
        r#"
        INSERT INTO map_markers (
            map_id, title, description, position_x, position_y, color, icon,
            linked_note_id, child_map_id, created_branch_id
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
        "#,
        params![
            input.map_id,
            input.title,
            input.description.clone().unwrap_or_default(),
            input.position_x,
            input.position_y,
            color,
            icon,
            input.linked_note_id,
            input.child_map_id,
            created_branch_id,
        ],
    )?;

    let id = i32::try_from(connection.last_insert_rowid()).map_err(|_| {
        AppError::internal(
            "MAP_MARKER_ID_RANGE_ERROR",
            "Created map marker id is out of range",
        )
    })?;

    let view_branch_id = if input.branch_id.is_some() {
        input.branch_id
    } else {
        branch_scope::effective_branch_id_for_read(connection, map.project_id, None)?
    };

    get_map_marker_by_id(connection, id, view_branch_id)
}

pub fn update_map_marker(
    connection: &Connection,
    input: &UpdateMapMarkerInput,
) -> Result<MapMarker> {
    let _ = get_map_marker_by_id(connection, input.id, input.branch_id)?;

    if let Some(icon) = input.icon.as_deref() {
        validate_marker_icon(icon)?;
    }
    if let Some(color) = input.color.as_deref() {
        validate_hex_color(color)?;
    }

    if let Some(branch_id) = input.branch_id {
        let patch = build_marker_patch(input);
        if patch != Value::Object(Map::new()) {
            save_upsert_override(connection, branch_id, "map_marker", input.id, &patch)?;
        }
        return get_map_marker_by_id(connection, input.id, Some(branch_id));
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
    if let Some(value) = input.position_x {
        fields.push("position_x = ?".to_string());
        values.push(SqlValue::Real(value));
    }
    if let Some(value) = input.position_y {
        fields.push("position_y = ?".to_string());
        values.push(SqlValue::Real(value));
    }
    if let Some(value) = input.color.as_deref() {
        fields.push("color = ?".to_string());
        values.push(SqlValue::Text(value.to_string()));
    }
    if let Some(value) = input.icon.as_deref() {
        fields.push("icon = ?".to_string());
        values.push(SqlValue::Text(value.to_string()));
    }
    if let Some(value) = input.linked_note_id {
        fields.push("linked_note_id = ?".to_string());
        values.push(SqlValue::Integer(i64::from(value)));
    }
    if let Some(value) = input.child_map_id {
        fields.push("child_map_id = ?".to_string());
        values.push(SqlValue::Integer(i64::from(value)));
    }

    if !fields.is_empty() {
        fields.push("updated_at = datetime('now')".to_string());
        let query = format!("UPDATE map_markers SET {} WHERE id = ?", fields.join(", "));
        values.push(SqlValue::Integer(i64::from(input.id)));
        connection.execute(&query, params_from_iter(values.iter()))?;
    }

    get_map_marker_by_id(connection, input.id, None)
}

pub fn delete_map_marker(connection: &Connection, input: &DeleteMapMarkerInput) -> Result<()> {
    let _ = get_map_marker_by_id(connection, input.id, input.branch_id)?;

    if let Some(branch_id) = input.branch_id {
        save_delete_override(connection, branch_id, "map_marker", input.id)?;
        return Ok(());
    }

    connection.execute("DELETE FROM map_markers WHERE id = ?1", params![input.id])?;
    Ok(())
}

pub fn list_map_territories(
    connection: &Connection,
    input: &ListMapTerritoriesInput,
) -> Result<Vec<MapTerritory>> {
    let map = get_map_row(connection, input.map_id)?;

    let mut statement = connection.prepare(
        r#"
        SELECT
            id,
            map_id,
            name,
            description,
            color,
            opacity,
            border_color,
            border_width,
            smoothing,
            points,
            faction_id,
            sort_order,
            created_at,
            updated_at,
            created_branch_id
        FROM map_territories
        WHERE map_id = ?1
        ORDER BY sort_order, created_at
        "#,
    )?;

    let rows = statement.query_map(params![input.map_id], map_territory_row)?;
    let base_rows = rows.collect::<std::result::Result<Vec<_>, _>>()?;

    let view_branch_id =
        branch_scope::effective_branch_id_for_read(connection, map.project_id, input.branch_id)?;

    let mut visible = Vec::new();
    for row in base_rows {
        if branch_scope::is_entity_visible_in_branch(
            connection,
            map.project_id,
            view_branch_id,
            row.created_branch_id,
            Some(row.created_at.as_str()),
        )? {
            visible.push(map_territory_row_to_territory(row));
        }
    }

    if let Some(branch_id) = input.branch_id {
        let overrides = list_branch_overrides(connection, branch_id, "map_territory")?;
        return apply_territory_overrides(visible, overrides);
    }

    Ok(visible)
}

pub fn get_map_territory_by_id(
    connection: &Connection,
    territory_id: i32,
    branch_id: Option<i32>,
) -> Result<MapTerritory> {
    let row = connection
        .query_row(
            r#"
            SELECT
                id,
                map_id,
                name,
                description,
                color,
                opacity,
                border_color,
                border_width,
                smoothing,
                points,
                faction_id,
                sort_order,
                created_at,
                updated_at,
                created_branch_id
            FROM map_territories
            WHERE id = ?1
            "#,
            params![territory_id],
            map_territory_row,
        )
        .optional()?
        .ok_or_else(|| AppError::internal("MAP_TERRITORY_NOT_FOUND", "Map territory not found"))?;

    let map = get_map_row(connection, row.map_id)?;
    let view_branch_id =
        branch_scope::effective_branch_id_for_read(connection, map.project_id, branch_id)?;

    if !branch_scope::is_entity_visible_in_branch(
        connection,
        map.project_id,
        view_branch_id,
        row.created_branch_id,
        Some(row.created_at.as_str()),
    )? {
        return Err(AppError::internal(
            "MAP_TERRITORY_NOT_FOUND",
            "Map territory not found",
        ));
    }

    let mut territory = map_territory_row_to_territory(row);

    if let Some(branch_id) = branch_id {
        let override_row =
            get_branch_override(connection, branch_id, "map_territory", territory_id)?;
        territory = branch_overlay::apply_item_overlay(Some(territory), override_row.as_ref())?
            .ok_or_else(|| {
                AppError::internal("MAP_TERRITORY_NOT_FOUND", "Map territory not found")
            })?;
    }

    Ok(territory)
}

pub fn create_map_territory(
    connection: &Connection,
    input: &CreateMapTerritoryInput,
) -> Result<MapTerritory> {
    let map = get_map_row(connection, input.map_id)?;
    if let Some(branch_id) = input.branch_id {
        branch_scope::assert_branch_belongs_to_project(connection, branch_id, map.project_id)?;
    }

    let color = input.color.clone().unwrap_or_else(|| "#4ECDC4".to_string());
    validate_hex_color(&color)?;
    let border_color = input
        .border_color
        .clone()
        .unwrap_or_else(|| "#4ECDC4".to_string());
    validate_hex_color(&border_color)?;

    let created_branch_id =
        branch_scope::resolve_created_branch_id(connection, map.project_id, input.branch_id)?;

    connection.execute(
        r#"
        INSERT INTO map_territories (
            map_id, name, description, color, opacity, border_color, border_width,
            smoothing, points, faction_id, sort_order, created_branch_id
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
        "#,
        params![
            input.map_id,
            input.name,
            input.description.clone().unwrap_or_default(),
            color,
            input.opacity.unwrap_or(0.25),
            border_color,
            input.border_width.unwrap_or(2.0),
            input.smoothing.unwrap_or(0.0),
            serialize_territory_rings(&input.rings),
            input.faction_id,
            input.sort_order.unwrap_or(0),
            created_branch_id,
        ],
    )?;

    let id = i32::try_from(connection.last_insert_rowid()).map_err(|_| {
        AppError::internal(
            "MAP_TERRITORY_ID_RANGE_ERROR",
            "Created map territory id is out of range",
        )
    })?;

    let view_branch_id = if input.branch_id.is_some() {
        input.branch_id
    } else {
        branch_scope::effective_branch_id_for_read(connection, map.project_id, None)?
    };

    get_map_territory_by_id(connection, id, view_branch_id)
}

pub fn update_map_territory(
    connection: &Connection,
    input: &UpdateMapTerritoryInput,
) -> Result<MapTerritory> {
    let _ = get_map_territory_by_id(connection, input.id, input.branch_id)?;

    if let Some(color) = input.color.as_deref() {
        validate_hex_color(color)?;
    }
    if let Some(border_color) = input.border_color.as_deref() {
        validate_hex_color(border_color)?;
    }

    if let Some(branch_id) = input.branch_id {
        let patch = build_territory_patch(input);
        if patch != Value::Object(Map::new()) {
            save_upsert_override(connection, branch_id, "map_territory", input.id, &patch)?;
        }
        return get_map_territory_by_id(connection, input.id, Some(branch_id));
    }

    let mut fields: Vec<String> = Vec::new();
    let mut values: Vec<SqlValue> = Vec::new();

    if let Some(value) = input.name.as_deref() {
        fields.push("name = ?".to_string());
        values.push(SqlValue::Text(value.to_string()));
    }
    if let Some(value) = input.description.as_deref() {
        fields.push("description = ?".to_string());
        values.push(SqlValue::Text(value.to_string()));
    }
    if let Some(value) = input.color.as_deref() {
        fields.push("color = ?".to_string());
        values.push(SqlValue::Text(value.to_string()));
    }
    if let Some(value) = input.opacity {
        fields.push("opacity = ?".to_string());
        values.push(SqlValue::Real(value));
    }
    if let Some(value) = input.border_color.as_deref() {
        fields.push("border_color = ?".to_string());
        values.push(SqlValue::Text(value.to_string()));
    }
    if let Some(value) = input.border_width {
        fields.push("border_width = ?".to_string());
        values.push(SqlValue::Real(value));
    }
    if let Some(value) = input.smoothing {
        fields.push("smoothing = ?".to_string());
        values.push(SqlValue::Real(value));
    }
    if let Some(rings) = input.rings.as_ref() {
        fields.push("points = ?".to_string());
        values.push(SqlValue::Text(serialize_territory_rings(rings)));
    }
    if let Some(value) = input.faction_id {
        fields.push("faction_id = ?".to_string());
        values.push(SqlValue::Integer(i64::from(value)));
    }
    if let Some(value) = input.sort_order {
        fields.push("sort_order = ?".to_string());
        values.push(SqlValue::Integer(i64::from(value)));
    }

    if !fields.is_empty() {
        fields.push("updated_at = datetime('now')".to_string());
        let query = format!(
            "UPDATE map_territories SET {} WHERE id = ?",
            fields.join(", ")
        );
        values.push(SqlValue::Integer(i64::from(input.id)));
        connection.execute(&query, params_from_iter(values.iter()))?;
    }

    get_map_territory_by_id(connection, input.id, None)
}

pub fn delete_map_territory(
    connection: &Connection,
    input: &DeleteMapTerritoryInput,
) -> Result<()> {
    let _ = get_map_territory_by_id(connection, input.id, input.branch_id)?;

    if let Some(branch_id) = input.branch_id {
        save_delete_override(connection, branch_id, "map_territory", input.id)?;
        return Ok(());
    }

    connection.execute(
        "DELETE FROM map_territories WHERE id = ?1",
        params![input.id],
    )?;
    Ok(())
}

pub fn list_territory_summaries(
    connection: &Connection,
    input: &ListTerritorySummariesInput,
) -> Result<Vec<MapTerritorySummary>> {
    let mut statement = connection.prepare(
        r#"
        SELECT
            mt.id,
            mt.name,
            mt.map_id,
            m.name AS map_name,
            mt.faction_id,
            f.name AS occupant_name,
            f.kind AS occupant_kind,
            mt.created_at,
            mt.created_branch_id
        FROM map_territories mt
        JOIN maps m ON mt.map_id = m.id
        LEFT JOIN factions f ON mt.faction_id = f.id
        WHERE m.project_id = ?1
        ORDER BY m.name COLLATE NOCASE, mt.name COLLATE NOCASE
        "#,
    )?;

    let rows = statement.query_map(params![input.project_id], |row| {
        Ok((
            row.get::<_, i32>("id")?,
            row.get::<_, String>("name")?,
            row.get::<_, i32>("map_id")?,
            row.get::<_, String>("map_name")?,
            row.get::<_, Option<i32>>("faction_id")?,
            row.get::<_, Option<String>>("occupant_name")?,
            row.get::<_, Option<String>>("occupant_kind")?,
            row.get::<_, String>("created_at")?,
            row.get::<_, Option<i32>>("created_branch_id")?,
        ))
    })?;

    let base_rows = rows.collect::<std::result::Result<Vec<_>, _>>()?;
    let view_branch_id =
        branch_scope::effective_branch_id_for_read(connection, input.project_id, input.branch_id)?;

    let mut summaries = Vec::new();
    for (
        id,
        name,
        map_id,
        map_name,
        faction_id,
        occupant_name,
        occupant_kind,
        created_at,
        created_branch_id,
    ) in base_rows
    {
        if branch_scope::is_entity_visible_in_branch(
            connection,
            input.project_id,
            view_branch_id,
            created_branch_id,
            Some(created_at.as_str()),
        )? {
            summaries.push(MapTerritorySummary {
                id,
                name,
                map_id,
                map_name,
                faction_id,
                occupant_name,
                occupant_kind,
            });
        }
    }

    Ok(summaries)
}

fn parse_territory_rings(value: &str) -> Vec<Vec<MapTerritoryPoint>> {
    if value.is_empty() {
        return Vec::new();
    }
    let parsed: Value = match serde_json::from_str(value) {
        Ok(value) => value,
        Err(_) => return Vec::new(),
    };

    if let Value::Array(ref items) = parsed {
        if items.is_empty() {
            return Vec::new();
        }
        if let Some(Value::Object(first)) = items.first() {
            if first.contains_key("x") && first.contains_key("y") {
                return vec![items
                    .iter()
                    .filter_map(parse_territory_point)
                    .collect()];
            }
        }
        if items.first().and_then(|item| item.as_array()).is_some() {
            return items
                .iter()
                .filter_map(|ring| {
                    let ring = ring.as_array()?;
                    Some(
                        ring.iter()
                            .filter_map(parse_territory_point)
                            .collect(),
                    )
                })
                .collect();
        }
    }

    if let Value::Object(map) = parsed {
        if let Some(Value::Array(rings)) = map.get("rings") {
            return rings
                .iter()
                .filter_map(|ring| {
                    let ring = ring.as_array()?;
                    Some(
                        ring.iter()
                            .filter_map(parse_territory_point)
                            .collect(),
                    )
                })
                .collect();
        }
    }

    Vec::new()
}

fn parse_territory_point(value: &Value) -> Option<MapTerritoryPoint> {
    let map = value.as_object()?;
    let x = map.get("x")?.as_f64()?;
    let y = map.get("y")?.as_f64()?;
    Some(MapTerritoryPoint { x, y })
}

fn serialize_territory_rings(rings: &[Vec<MapTerritoryPoint>]) -> String {
    let payload = serde_json::json!({ "rings": rings });
    payload.to_string()
}

fn validate_marker_icon(icon: &str) -> Result<()> {
    if MARKER_ICONS.contains(&icon) {
        Ok(())
    } else {
        Err(AppError::internal(
            "INVALID_MARKER_ICON",
            format!("Invalid marker icon: {icon}"),
        ))
    }
}

fn validate_hex_color(color: &str) -> Result<()> {
    let bytes = color.as_bytes();
    if bytes.len() == 7
        && bytes[0] == b'#'
        && bytes[1..].iter().all(|byte| byte.is_ascii_hexdigit())
    {
        Ok(())
    } else {
        Err(AppError::internal(
            "INVALID_HEX_COLOR",
            format!("Invalid hex color: {color}"),
        ))
    }
}

fn build_marker_patch(input: &UpdateMapMarkerInput) -> Value {
    let mut patch = Map::new();
    if let Some(value) = input.title.as_ref() {
        patch.insert("title".to_string(), Value::String(value.clone()));
    }
    if let Some(value) = input.description.as_ref() {
        patch.insert("description".to_string(), Value::String(value.clone()));
    }
    if let Some(value) = input.position_x {
        patch.insert("positionX".to_string(), Value::from(value));
    }
    if let Some(value) = input.position_y {
        patch.insert("positionY".to_string(), Value::from(value));
    }
    if let Some(value) = input.color.as_ref() {
        patch.insert("color".to_string(), Value::String(value.clone()));
    }
    if let Some(value) = input.icon.as_ref() {
        patch.insert("icon".to_string(), Value::String(value.clone()));
    }
    if let Some(value) = input.linked_note_id {
        patch.insert("linkedNoteId".to_string(), Value::from(value));
    }
    if let Some(value) = input.child_map_id {
        patch.insert("childMapId".to_string(), Value::from(value));
    }
    Value::Object(patch)
}

fn build_territory_patch(input: &UpdateMapTerritoryInput) -> Value {
    let mut patch = Map::new();
    if let Some(value) = input.name.as_ref() {
        patch.insert("name".to_string(), Value::String(value.clone()));
    }
    if let Some(value) = input.description.as_ref() {
        patch.insert("description".to_string(), Value::String(value.clone()));
    }
    if let Some(value) = input.color.as_ref() {
        patch.insert("color".to_string(), Value::String(value.clone()));
    }
    if let Some(value) = input.opacity {
        patch.insert("opacity".to_string(), Value::from(value));
    }
    if let Some(value) = input.border_color.as_ref() {
        patch.insert("borderColor".to_string(), Value::String(value.clone()));
    }
    if let Some(value) = input.border_width {
        patch.insert("borderWidth".to_string(), Value::from(value));
    }
    if let Some(value) = input.smoothing {
        patch.insert("smoothing".to_string(), Value::from(value));
    }
    if let Some(rings) = input.rings.as_ref() {
        patch.insert(
            "rings".to_string(),
            serde_json::to_value(rings).unwrap_or(Value::Null),
        );
    }
    if let Some(value) = input.faction_id {
        patch.insert("factionId".to_string(), Value::from(value));
    }
    if let Some(value) = input.sort_order {
        patch.insert("sortOrder".to_string(), Value::from(value));
    }
    Value::Object(patch)
}

fn apply_marker_overrides(
    markers: Vec<MapMarker>,
    overrides: HashMap<i32, BranchOverride>,
) -> Result<Vec<MapMarker>> {
    let mut result = Vec::new();
    for marker in markers {
        let override_row = overrides.get(&marker.id);
        if let Some(projected) = branch_overlay::apply_item_overlay(Some(marker), override_row)? {
            result.push(projected);
        }
    }
    Ok(result)
}

fn apply_territory_overrides(
    territories: Vec<MapTerritory>,
    overrides: HashMap<i32, BranchOverride>,
) -> Result<Vec<MapTerritory>> {
    let mut result = Vec::new();
    for territory in territories {
        let override_row = overrides.get(&territory.id);
        if let Some(projected) = branch_overlay::apply_item_overlay(Some(territory), override_row)?
        {
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

fn map_map_row(row: &Row<'_>) -> rusqlite::Result<MapRow> {
    Ok(MapRow {
        id: row.get("id")?,
        project_id: row.get("project_id")?,
        parent_map_id: row.get("parent_map_id")?,
        parent_marker_id: row.get("parent_marker_id")?,
        name: row.get("name")?,
        image_path: row.get("image_path")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        created_branch_id: row.get("created_branch_id")?,
    })
}

fn map_map_row_to_record(row: MapRow) -> MapRecord {
    MapRecord {
        id: row.id,
        project_id: row.project_id,
        parent_map_id: row.parent_map_id,
        parent_marker_id: row.parent_marker_id,
        name: row.name,
        image_path: row.image_path,
        created_at: row.created_at,
        updated_at: row.updated_at,
    }
}

fn map_marker_row(row: &Row<'_>) -> rusqlite::Result<MarkerRow> {
    Ok(MarkerRow {
        id: row.get("id")?,
        map_id: row.get("map_id")?,
        title: row.get("title")?,
        description: row.get("description")?,
        position_x: row.get("position_x")?,
        position_y: row.get("position_y")?,
        color: row.get("color")?,
        icon: row.get("icon")?,
        linked_note_id: row.get("linked_note_id")?,
        child_map_id: row.get("child_map_id")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        created_branch_id: row.get("created_branch_id")?,
    })
}

fn map_marker_row_to_marker(row: MarkerRow) -> MapMarker {
    MapMarker {
        id: row.id,
        map_id: row.map_id,
        title: row.title,
        description: row.description,
        position_x: row.position_x,
        position_y: row.position_y,
        color: row.color,
        icon: row.icon,
        linked_note_id: row.linked_note_id,
        child_map_id: row.child_map_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
    }
}

fn map_territory_row(row: &Row<'_>) -> rusqlite::Result<TerritoryRow> {
    Ok(TerritoryRow {
        id: row.get("id")?,
        map_id: row.get("map_id")?,
        name: row.get("name")?,
        description: row.get("description")?,
        color: row.get("color")?,
        opacity: row.get("opacity")?,
        border_color: row.get("border_color")?,
        border_width: row.get("border_width")?,
        smoothing: row.get("smoothing")?,
        points: row.get("points")?,
        faction_id: row.get("faction_id")?,
        sort_order: row.get("sort_order")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        created_branch_id: row.get("created_branch_id")?,
    })
}

fn map_territory_row_to_territory(row: TerritoryRow) -> MapTerritory {
    MapTerritory {
        id: row.id,
        map_id: row.map_id,
        name: row.name,
        description: row.description,
        color: row.color,
        opacity: row.opacity,
        border_color: row.border_color,
        border_width: row.border_width,
        smoothing: row.smoothing,
        rings: parse_territory_rings(&row.points),
        faction_id: row.faction_id,
        sort_order: row.sort_order,
        created_at: row.created_at,
        updated_at: row.updated_at,
    }
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
