use rusqlite::{params, Connection, OptionalExtension};

use crate::error::{AppError, Result};
use crate::models::political_scale::{
    CreatePoliticalScaleInput, DeletePoliticalScaleAssignmentInput, DeletePoliticalScaleInput,
    ListPoliticalScaleAssignmentsInput, ListPoliticalScalesInput, PoliticalScale,
    PoliticalScaleAssignment, ReplacePoliticalScaleAssignmentsInput, ScaleZone,
    UpdatePoliticalScaleInput,
};

#[derive(Debug, Clone)]
struct PoliticalScaleRow {
    id: i32,
    code: String,
    entity_type: String,
    category: String,
    name: String,
    left_pole_label: String,
    right_pole_label: String,
    left_pole_description: String,
    right_pole_description: String,
    icon: Option<String>,
    zones_json: Option<String>,
    is_system: bool,
    project_id: Option<i32>,
    sort_order: i32,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Clone)]
struct AssignmentRow {
    id: i32,
    scale_id: i32,
    entity_type: String,
    entity_id: i32,
    value: i32,
    enabled: bool,
    note: Option<String>,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Clone)]
struct FactionKindRow {
    project_id: i32,
    kind: String,
}

pub fn list_scales(
    connection: &Connection,
    input: &ListPoliticalScalesInput,
) -> Result<Vec<PoliticalScale>> {
    super::political_scales_seed::seed_system_scales(connection)?;
    ensure_project_exists(connection, input.world_id)?;

    let mut statement = connection.prepare(
        r#"
        SELECT
            id, code, entity_type, category, name,
            left_pole_label, right_pole_label,
            left_pole_description, right_pole_description,
            icon, zones_json, is_system, project_id, sort_order,
            created_at, updated_at
        FROM political_scales
        WHERE entity_type = ?1
          AND (is_system = 1 OR project_id = ?2)
        ORDER BY sort_order ASC, id ASC
        "#,
    )?;

    let rows = statement
        .query_map(params![input.entity_type, input.world_id], map_scale_row)?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(rows.into_iter().map(map_scale).collect())
}

pub fn create_scale(
    connection: &Connection,
    input: &CreatePoliticalScaleInput,
) -> Result<PoliticalScale> {
    ensure_project_exists(connection, input.world_id)?;
    let code = normalize_custom_code(input.world_id, &input.code);

    let existing = connection
        .query_row(
            "SELECT id FROM political_scales WHERE code = ?1",
            params![code],
            |row| row.get::<_, i32>(0),
        )
        .optional()?;
    if existing.is_some() {
        return Err(AppError::internal(
            "POLITICAL_SCALE_CONFLICT",
            "Шкала с таким кодом уже существует в этом мире",
        ));
    }

    let zones_json = zones_to_json(input.zones.as_ref())?;

    connection.execute(
        r#"
        INSERT INTO political_scales (
            code, entity_type, category, name,
            left_pole_label, right_pole_label,
            left_pole_description, right_pole_description,
            icon, zones_json, is_system, project_id, sort_order
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 0, ?11, ?12)
        "#,
        params![
            code,
            input.entity_type,
            input.category.trim(),
            input.name.trim(),
            input.left_pole_label.trim(),
            input.right_pole_label.trim(),
            input.left_pole_description.as_deref().unwrap_or("").trim(),
            input.right_pole_description.as_deref().unwrap_or("").trim(),
            input.icon,
            zones_json,
            input.world_id,
            input.order.unwrap_or(0)
        ],
    )?;

    let id = i32::try_from(connection.last_insert_rowid()).map_err(|_| {
        AppError::internal(
            "POLITICAL_SCALE_ID_RANGE_ERROR",
            "Created political scale id is out of range",
        )
    })?;

    get_scale_by_id(connection, id)
}

pub fn update_scale(
    connection: &Connection,
    input: &UpdatePoliticalScaleInput,
) -> Result<PoliticalScale> {
    let row = connection
        .query_row(
            r#"
            SELECT
                id, code, entity_type, category, name,
                left_pole_label, right_pole_label,
                left_pole_description, right_pole_description,
                icon, zones_json, is_system, project_id, sort_order,
                created_at, updated_at
            FROM political_scales
            WHERE id = ?1
            "#,
            params![input.id],
            map_scale_row,
        )
        .optional()?
        .ok_or_else(|| {
            AppError::internal("POLITICAL_SCALE_NOT_FOUND", "Political scale not found")
        })?;

    if row.is_system {
        return Err(AppError::internal(
            "POLITICAL_SCALE_BAD_REQUEST",
            "Системные шкалы нельзя изменять",
        ));
    }

    let mut fields: Vec<String> = Vec::new();
    let mut values: Vec<rusqlite::types::Value> = Vec::new();

    if let Some(value) = input.category.as_deref() {
        fields.push("category = ?".to_string());
        values.push(rusqlite::types::Value::Text(value.trim().to_string()));
    }
    if let Some(value) = input.name.as_deref() {
        fields.push("name = ?".to_string());
        values.push(rusqlite::types::Value::Text(value.trim().to_string()));
    }
    if let Some(value) = input.left_pole_label.as_deref() {
        fields.push("left_pole_label = ?".to_string());
        values.push(rusqlite::types::Value::Text(value.trim().to_string()));
    }
    if let Some(value) = input.right_pole_label.as_deref() {
        fields.push("right_pole_label = ?".to_string());
        values.push(rusqlite::types::Value::Text(value.trim().to_string()));
    }
    if let Some(value) = input.left_pole_description.as_deref() {
        fields.push("left_pole_description = ?".to_string());
        values.push(rusqlite::types::Value::Text(value.trim().to_string()));
    }
    if let Some(value) = input.right_pole_description.as_deref() {
        fields.push("right_pole_description = ?".to_string());
        values.push(rusqlite::types::Value::Text(value.trim().to_string()));
    }
    if let Some(value) = input.icon.as_ref() {
        fields.push("icon = ?".to_string());
        values.push(rusqlite::types::Value::Text(value.clone()));
    }
    if let Some(zones) = input.zones.as_ref() {
        fields.push("zones_json = ?".to_string());
        values.push(rusqlite::types::Value::Text(
            zones_to_json(Some(zones))?.unwrap_or_default(),
        ));
    }
    if let Some(value) = input.order {
        fields.push("sort_order = ?".to_string());
        values.push(rusqlite::types::Value::Integer(i64::from(value)));
    }

    if !fields.is_empty() {
        fields.push("updated_at = datetime('now')".to_string());
        values.push(rusqlite::types::Value::Integer(i64::from(input.id)));
        let query = format!(
            "UPDATE political_scales SET {} WHERE id = ?",
            fields.join(", ")
        );
        connection.execute(&query, rusqlite::params_from_iter(values.iter()))?;
    }

    get_scale_by_id(connection, input.id)
}

pub fn delete_scale(connection: &Connection, input: &DeletePoliticalScaleInput) -> Result<()> {
    let row = connection
        .query_row(
            "SELECT is_system FROM political_scales WHERE id = ?1",
            params![input.id],
            |row| row.get::<_, i32>(0),
        )
        .optional()?
        .ok_or_else(|| {
            AppError::internal("POLITICAL_SCALE_NOT_FOUND", "Political scale not found")
        })?;

    if row == 1 {
        return Err(AppError::internal(
            "POLITICAL_SCALE_BAD_REQUEST",
            "Системные шкалы нельзя удалять",
        ));
    }

    connection.execute(
        "DELETE FROM political_scales WHERE id = ?1",
        params![input.id],
    )?;
    Ok(())
}

pub fn list_assignments(
    connection: &Connection,
    input: &ListPoliticalScaleAssignmentsInput,
) -> Result<Vec<PoliticalScaleAssignment>> {
    ensure_faction_exists(connection, input.entity_id)?;
    ensure_defaults(connection, &input.entity_type, input.entity_id)?;

    let mut statement = connection.prepare(
        r#"
        SELECT id, scale_id, entity_type, entity_id, value, enabled, note, created_at, updated_at
        FROM political_scale_assignments
        WHERE entity_type = ?1 AND entity_id = ?2
        ORDER BY id ASC
        "#,
    )?;

    let rows = statement
        .query_map(
            params![input.entity_type, input.entity_id],
            map_assignment_row,
        )?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(rows.into_iter().map(map_assignment).collect())
}

pub fn replace_assignments(
    connection: &Connection,
    input: &ReplacePoliticalScaleAssignmentsInput,
) -> Result<Vec<PoliticalScaleAssignment>> {
    ensure_faction_exists(connection, input.entity_id)?;
    let faction = load_faction(connection, input.entity_id)?;
    assert_entity_matches_kind(&input.entity_type, &faction)?;

    let scale_ids: Vec<i32> = input.assignments.iter().map(|row| row.scale_id).collect();
    let unique: std::collections::HashSet<i32> = scale_ids.iter().copied().collect();
    if unique.len() != scale_ids.len() {
        return Err(AppError::internal(
            "POLITICAL_SCALE_BAD_REQUEST",
            "Дублируется scaleId в списке",
        ));
    }

    for scale_id in &scale_ids {
        validate_scale_for_entity(
            connection,
            *scale_id,
            &input.entity_type,
            faction.project_id,
        )?;
    }

    let transaction = connection.unchecked_transaction()?;
    transaction.execute(
        "DELETE FROM political_scale_assignments WHERE entity_type = ?1 AND entity_id = ?2",
        params![input.entity_type, input.entity_id],
    )?;

    for row in &input.assignments {
        transaction.execute(
            r#"
            INSERT INTO political_scale_assignments (
                scale_id, entity_type, entity_id, value, enabled, note
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
            "#,
            params![
                row.scale_id,
                input.entity_type,
                input.entity_id,
                row.value,
                if row.enabled { 1 } else { 0 },
                row.note
            ],
        )?;
    }
    transaction.commit()?;

    list_assignments(
        connection,
        &ListPoliticalScaleAssignmentsInput {
            entity_type: input.entity_type.clone(),
            entity_id: input.entity_id,
        },
    )
}

pub fn delete_assignment(
    connection: &Connection,
    input: &DeletePoliticalScaleAssignmentInput,
) -> Result<()> {
    let exists = connection
        .query_row(
            "SELECT id FROM political_scale_assignments WHERE id = ?1",
            params![input.id],
            |row| row.get::<_, i32>(0),
        )
        .optional()?;

    if exists.is_none() {
        return Err(AppError::internal(
            "POLITICAL_SCALE_ASSIGNMENT_NOT_FOUND",
            "Political scale assignment not found",
        ));
    }

    connection.execute(
        "DELETE FROM political_scale_assignments WHERE id = ?1",
        params![input.id],
    )?;
    Ok(())
}

fn ensure_defaults(connection: &Connection, entity_type: &str, entity_id: i32) -> Result<()> {
    let faction = load_faction(connection, entity_id)?;
    assert_entity_matches_kind(entity_type, &faction)?;

    connection.execute(
        r#"
        INSERT INTO political_scale_assignments (scale_id, entity_type, entity_id, value, enabled, note)
        SELECT s.id, ?1, ?2, 0, 1, NULL
        FROM political_scales s
        WHERE s.entity_type = ?3
          AND (s.is_system = 1 OR s.project_id = ?4)
          AND NOT EXISTS (
            SELECT 1 FROM political_scale_assignments a
            WHERE a.scale_id = s.id AND a.entity_type = ?1 AND a.entity_id = ?2
          )
        "#,
        params![
            entity_type,
            entity_id,
            entity_type,
            faction.project_id,
        ],
    )?;

    Ok(())
}

fn validate_scale_for_entity(
    connection: &Connection,
    scale_id: i32,
    entity_type: &str,
    project_id: i32,
) -> Result<()> {
    let scale = connection
        .query_row(
            r#"
            SELECT id, entity_type, is_system, project_id
            FROM political_scales
            WHERE id = ?1
            "#,
            params![scale_id],
            |row| {
                Ok((
                    row.get::<_, i32>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, i32>(2)?,
                    row.get::<_, Option<i32>>(3)?,
                ))
            },
        )
        .optional()?;

    let Some((_, scale_entity_type, is_system, scale_project_id)) = scale else {
        return Err(AppError::internal(
            "POLITICAL_SCALE_BAD_REQUEST",
            format!("Шкала не найдена: {scale_id}"),
        ));
    };

    if scale_entity_type != entity_type {
        return Err(AppError::internal(
            "POLITICAL_SCALE_BAD_REQUEST",
            format!("Шкала {scale_id} не подходит для entityType {entity_type}"),
        ));
    }

    if is_system != 1 && scale_project_id != Some(project_id) {
        return Err(AppError::internal(
            "POLITICAL_SCALE_BAD_REQUEST",
            format!("Шкала {scale_id} не относится к этому миру"),
        ));
    }

    Ok(())
}

fn load_faction(connection: &Connection, entity_id: i32) -> Result<FactionKindRow> {
    connection
        .query_row(
            "SELECT project_id, kind FROM factions WHERE id = ?1",
            params![entity_id],
            |row| {
                Ok(FactionKindRow {
                    project_id: row.get(0)?,
                    kind: row.get(1)?,
                })
            },
        )
        .optional()?
        .ok_or_else(|| AppError::internal("FACTION_NOT_FOUND", "Faction not found"))
}

fn assert_entity_matches_kind(entity_type: &str, faction: &FactionKindRow) -> Result<()> {
    if entity_type == "state" && faction.kind != "state" {
        return Err(AppError::internal(
            "POLITICAL_SCALE_BAD_REQUEST",
            "entityType state требует фракцию с kind=state",
        ));
    }
    if entity_type == "faction" && faction.kind != "faction" {
        return Err(AppError::internal(
            "POLITICAL_SCALE_BAD_REQUEST",
            "entityType faction требует фракцию с kind=faction",
        ));
    }
    Ok(())
}

fn ensure_project_exists(connection: &Connection, project_id: i32) -> Result<()> {
    let exists = connection
        .query_row(
            "SELECT id FROM projects WHERE id = ?1",
            params![project_id],
            |row| row.get::<_, i32>(0),
        )
        .optional()?;

    if exists.is_none() {
        return Err(AppError::internal("PROJECT_NOT_FOUND", "Project not found"));
    }
    Ok(())
}

fn ensure_faction_exists(connection: &Connection, faction_id: i32) -> Result<()> {
    let exists = connection
        .query_row(
            "SELECT id FROM factions WHERE id = ?1",
            params![faction_id],
            |row| row.get::<_, i32>(0),
        )
        .optional()?;

    if exists.is_none() {
        return Err(AppError::internal("FACTION_NOT_FOUND", "Faction not found"));
    }
    Ok(())
}

fn normalize_custom_code(world_id: i32, code: &str) -> String {
    format!("p{world_id}_{}", code.trim().to_lowercase())
}

fn get_scale_by_id(connection: &Connection, id: i32) -> Result<PoliticalScale> {
    let row = connection
        .query_row(
            r#"
            SELECT
                id, code, entity_type, category, name,
                left_pole_label, right_pole_label,
                left_pole_description, right_pole_description,
                icon, zones_json, is_system, project_id, sort_order,
                created_at, updated_at
            FROM political_scales
            WHERE id = ?1
            "#,
            params![id],
            map_scale_row,
        )
        .optional()?
        .ok_or_else(|| {
            AppError::internal("POLITICAL_SCALE_NOT_FOUND", "Political scale not found")
        })?;

    Ok(map_scale(row))
}

fn zones_to_json(zones: Option<&Vec<ScaleZone>>) -> Result<Option<String>> {
    match zones {
        None => Ok(None),
        Some(items) => Ok(Some(serde_json::to_string(items).map_err(|err| {
            AppError::internal(
                "POLITICAL_SCALE_ZONES_JSON_ERROR",
                format!("Failed to encode zones: {err}"),
            )
        })?)),
    }
}

fn parse_zones(json: Option<String>) -> Option<Vec<ScaleZone>> {
    let json = json?;
    let parsed = serde_json::from_str::<Vec<ScaleZone>>(&json).ok()?;
    Some(parsed)
}

fn map_scale_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<PoliticalScaleRow> {
    Ok(PoliticalScaleRow {
        id: row.get("id")?,
        code: row.get("code")?,
        entity_type: row.get("entity_type")?,
        category: row.get("category")?,
        name: row.get("name")?,
        left_pole_label: row.get("left_pole_label")?,
        right_pole_label: row.get("right_pole_label")?,
        left_pole_description: row.get("left_pole_description")?,
        right_pole_description: row.get("right_pole_description")?,
        icon: row.get("icon")?,
        zones_json: row.get("zones_json")?,
        is_system: row.get::<_, i32>("is_system")? != 0,
        project_id: row.get("project_id")?,
        sort_order: row.get("sort_order")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

fn map_scale(row: PoliticalScaleRow) -> PoliticalScale {
    PoliticalScale {
        id: row.id,
        code: row.code,
        entity_type: row.entity_type,
        category: row.category,
        name: row.name,
        left_pole_label: row.left_pole_label,
        right_pole_label: row.right_pole_label,
        left_pole_description: row.left_pole_description,
        right_pole_description: row.right_pole_description,
        icon: row.icon,
        zones: parse_zones(row.zones_json),
        is_system: row.is_system,
        world_id: row.project_id,
        order: row.sort_order,
        created_at: row.created_at,
        updated_at: row.updated_at,
    }
}

fn map_assignment_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<AssignmentRow> {
    Ok(AssignmentRow {
        id: row.get("id")?,
        scale_id: row.get("scale_id")?,
        entity_type: row.get("entity_type")?,
        entity_id: row.get("entity_id")?,
        value: row.get("value")?,
        enabled: row.get::<_, i32>("enabled")? != 0,
        note: row.get("note")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

fn map_assignment(row: AssignmentRow) -> PoliticalScaleAssignment {
    PoliticalScaleAssignment {
        id: row.id,
        scale_id: row.scale_id,
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        value: row.value,
        enabled: row.enabled,
        note: row.note,
        created_at: row.created_at,
        updated_at: row.updated_at,
    }
}
