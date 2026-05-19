use rusqlite::{
    params, params_from_iter, types::Value as SqlValue, Connection, OptionalExtension, Row,
};

use crate::error::{AppError, Result};
use crate::models::dynasty::{
    AddDynastyEventInput, AddDynastyFamilyLinkInput, AddDynastyMemberInput, CreateDynastyInput,
    DeleteDynastyEventInput, DeleteDynastyFamilyLinkInput, DeleteDynastyInput, DynastiesListInput,
    DynastiesListResult, Dynasty, DynastyEvent, DynastyFamilyLink, DynastyMember, GetDynastyInput,
    RemoveDynastyMemberInput, ReorderDynastyEventsInput, SaveDynastyGraphPositionsInput,
    SetDynastyTagsInput, UpdateDynastyEventInput, UpdateDynastyInput, UpdateDynastyMemberInput,
    DYNASTY_EVENT_IMPORTANCE, DYNASTY_FAMILY_RELATION_TYPES, DYNASTY_STATUSES,
};
use crate::models::tag_association::{EntityTagsInput, SetEntityTagsInput};
use crate::services::branch_scope;
use crate::services::tag_associations;

#[derive(Debug, Clone)]
struct DynastyRow {
    id: i32,
    project_id: i32,
    name: String,
    motto: String,
    description: String,
    history: String,
    status: String,
    color: String,
    secondary_color: String,
    image_path: Option<String>,
    founded_date: String,
    extinct_date: String,
    founder_id: Option<i32>,
    current_leader_id: Option<i32>,
    heir_id: Option<i32>,
    linked_faction_id: Option<i32>,
    sort_order: i32,
    created_at: String,
    updated_at: String,
    created_branch_id: Option<i32>,
    member_count: Option<i32>,
}

pub fn list_dynasties(
    connection: &Connection,
    input: &DynastiesListInput,
) -> Result<DynastiesListResult> {
    let mut query = String::from(
        r#"
        SELECT
            d.id,
            d.project_id,
            d.name,
            d.motto,
            d.description,
            d.history,
            d.status,
            d.color,
            d.secondary_color,
            d.image_path,
            d.founded_date,
            d.extinct_date,
            d.founder_id,
            d.current_leader_id,
            d.heir_id,
            d.linked_faction_id,
            d.sort_order,
            d.created_at,
            d.updated_at,
            d.created_branch_id,
            (SELECT COUNT(*) FROM dynasty_members WHERE dynasty_id = d.id) AS member_count
        FROM dynasties d
        WHERE d.project_id = ?
        "#,
    );
    let mut sql_params: Vec<SqlValue> = vec![SqlValue::Integer(i64::from(input.project_id))];

    if let Some(status) = input.status.as_deref().filter(|value| !value.is_empty()) {
        validate_dynasty_status(status)?;
        query.push_str(" AND d.status = ?");
        sql_params.push(SqlValue::Text(status.to_string()));
    }
    if let Some(search) = input.search.as_deref().filter(|value| !value.is_empty()) {
        let term = format!("%{search}%");
        query.push_str(" AND (d.name LIKE ? OR d.motto LIKE ?)");
        sql_params.push(SqlValue::Text(term.clone()));
        sql_params.push(SqlValue::Text(term));
    }

    query.push_str(" ORDER BY d.sort_order ASC, d.name ASC");

    let mut statement = connection.prepare(&query)?;
    let rows = statement.query_map(params_from_iter(sql_params.iter()), map_dynasty_row)?;
    let base_rows = rows.collect::<std::result::Result<Vec<_>, _>>()?;

    let view_branch_id =
        branch_scope::effective_branch_id_for_read(connection, input.project_id, input.branch_id)?;

    let mut visible: Vec<Dynasty> = Vec::new();
    for row in base_rows {
        if branch_scope::is_entity_visible_in_branch(
            connection,
            row.project_id,
            view_branch_id,
            row.created_branch_id,
            Some(row.created_at.as_str()),
        )? {
            visible.push(map_dynasty_list_item(row));
        }
    }

    let total = i32::try_from(visible.len()).map_err(|_| {
        AppError::internal(
            "DYNASTIES_TOTAL_RANGE_ERROR",
            "Dynasties total is out of range",
        )
    })?;

    let offset = input.offset.unwrap_or(0).max(0) as usize;
    let limit = input.limit.unwrap_or(50).max(0) as usize;
    let items = visible.into_iter().skip(offset).take(limit).collect();

    Ok(DynastiesListResult { items, total })
}

pub fn get_dynasty_by_id(connection: &Connection, input: &GetDynastyInput) -> Result<Dynasty> {
    let row = connection
        .query_row(
            r#"
            SELECT
                d.id,
                d.project_id,
                d.name,
                d.motto,
                d.description,
                d.history,
                d.status,
                d.color,
                d.secondary_color,
                d.image_path,
                d.founded_date,
                d.extinct_date,
                d.founder_id,
                d.current_leader_id,
                d.heir_id,
                d.linked_faction_id,
                d.sort_order,
                d.created_at,
                d.updated_at,
                d.created_branch_id,
                (SELECT COUNT(*) FROM dynasty_members WHERE dynasty_id = d.id) AS member_count
            FROM dynasties d
            WHERE d.id = ?1
            "#,
            params![input.id],
            map_dynasty_row,
        )
        .optional()?
        .ok_or_else(|| AppError::internal("DYNASTY_NOT_FOUND", "Dynasty not found"))?;

    let view_branch_id =
        branch_scope::effective_branch_id_for_read(connection, row.project_id, input.branch_id)?;

    if !branch_scope::is_entity_visible_in_branch(
        connection,
        row.project_id,
        view_branch_id,
        row.created_branch_id,
        Some(row.created_at.as_str()),
    )? {
        return Err(AppError::internal("DYNASTY_NOT_FOUND", "Dynasty not found"));
    }

    let mut dynasty = map_dynasty_list_item(row);
    attach_dynasty_details(connection, &mut dynasty)?;
    Ok(dynasty)
}

pub fn create_dynasty(connection: &Connection, input: &CreateDynastyInput) -> Result<Dynasty> {
    let status = input.status.clone().unwrap_or_else(|| "active".to_string());
    validate_dynasty_status(&status)?;

    let created_branch_id =
        branch_scope::resolve_created_branch_id(connection, input.project_id, input.branch_id)?;

    connection.execute(
        r#"
        INSERT INTO dynasties (
            project_id, name, motto, description, history, status, color, secondary_color,
            founded_date, extinct_date, founder_id, current_leader_id, heir_id, linked_faction_id,
            sort_order, created_branch_id
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)
        "#,
        params![
            input.project_id,
            input.name,
            input.motto.clone().unwrap_or_default(),
            input.description.clone().unwrap_or_default(),
            input.history.clone().unwrap_or_default(),
            status,
            input.color.clone().unwrap_or_default(),
            input.secondary_color.clone().unwrap_or_default(),
            input.founded_date.clone().unwrap_or_default(),
            input.extinct_date.clone().unwrap_or_default(),
            input.founder_id,
            input.current_leader_id,
            input.heir_id,
            input.linked_faction_id,
            input.sort_order.unwrap_or(0),
            created_branch_id,
        ],
    )?;

    let id = i32::try_from(connection.last_insert_rowid()).map_err(|_| {
        AppError::internal(
            "DYNASTY_ID_RANGE_ERROR",
            "Created dynasty id is out of range",
        )
    })?;

    let view_branch_id = if input.branch_id.is_some() {
        input.branch_id
    } else {
        branch_scope::effective_branch_id_for_read(connection, input.project_id, None)?
    };

    get_dynasty_by_id(
        connection,
        &GetDynastyInput {
            id,
            branch_id: view_branch_id,
        },
    )
}

pub fn update_dynasty(connection: &Connection, input: &UpdateDynastyInput) -> Result<Dynasty> {
    let _ = get_dynasty_by_id(
        connection,
        &GetDynastyInput {
            id: input.id,
            branch_id: input.branch_id,
        },
    )?;

    if let Some(status) = input.status.as_deref() {
        validate_dynasty_status(status)?;
    }

    let mut fields: Vec<String> = Vec::new();
    let mut values: Vec<SqlValue> = Vec::new();

    macro_rules! push_text {
        ($field:expr, $value:expr) => {
            if let Some(value) = $value {
                fields.push(format!("{} = ?", $field));
                values.push(SqlValue::Text(value.to_string()));
            }
        };
    }

    push_text!("name", input.name.as_deref());
    push_text!("motto", input.motto.as_deref());
    push_text!("description", input.description.as_deref());
    push_text!("history", input.history.as_deref());
    push_text!("status", input.status.as_deref());
    push_text!("color", input.color.as_deref());
    push_text!("secondary_color", input.secondary_color.as_deref());
    push_text!("founded_date", input.founded_date.as_deref());
    push_text!("extinct_date", input.extinct_date.as_deref());

    if let Some(value) = input.founder_id {
        fields.push("founder_id = ?".to_string());
        values.push(SqlValue::Integer(i64::from(value)));
    }
    if let Some(value) = input.current_leader_id {
        fields.push("current_leader_id = ?".to_string());
        values.push(SqlValue::Integer(i64::from(value)));
    }
    if let Some(value) = input.heir_id {
        fields.push("heir_id = ?".to_string());
        values.push(SqlValue::Integer(i64::from(value)));
    }
    if let Some(value) = input.linked_faction_id {
        fields.push("linked_faction_id = ?".to_string());
        values.push(SqlValue::Integer(i64::from(value)));
    }
    if let Some(value) = input.sort_order {
        fields.push("sort_order = ?".to_string());
        values.push(SqlValue::Integer(i64::from(value)));
    }

    if !fields.is_empty() {
        fields.push("updated_at = datetime('now')".to_string());
        let query = format!("UPDATE dynasties SET {} WHERE id = ?", fields.join(", "));
        values.push(SqlValue::Integer(i64::from(input.id)));
        connection.execute(&query, params_from_iter(values.iter()))?;
    }

    get_dynasty_by_id(
        connection,
        &GetDynastyInput {
            id: input.id,
            branch_id: input.branch_id,
        },
    )
}

pub fn delete_dynasty(connection: &Connection, input: &DeleteDynastyInput) -> Result<()> {
    let _ = get_dynasty_by_id(
        connection,
        &GetDynastyInput {
            id: input.id,
            branch_id: input.branch_id,
        },
    )?;
    connection.execute("DELETE FROM dynasties WHERE id = ?1", params![input.id])?;
    Ok(())
}

pub fn set_dynasty_tags(connection: &Connection, input: &SetDynastyTagsInput) -> Result<Dynasty> {
    let dynasty = get_dynasty_by_id(
        connection,
        &GetDynastyInput {
            id: input.id,
            branch_id: input.branch_id,
        },
    )?;

    tag_associations::set_tags_for_entity(
        connection,
        &SetEntityTagsInput {
            project_id: dynasty.project_id,
            entity_type: "dynasty".to_string(),
            entity_id: input.id,
            tag_ids: input.tag_ids.clone(),
        },
    )?;

    get_dynasty_by_id(
        connection,
        &GetDynastyInput {
            id: input.id,
            branch_id: input.branch_id,
        },
    )
}

pub fn add_dynasty_member(
    connection: &Connection,
    input: &AddDynastyMemberInput,
) -> Result<DynastyMember> {
    let _ = get_dynasty_by_id(
        connection,
        &GetDynastyInput {
            id: input.dynasty_id,
            branch_id: input.branch_id,
        },
    )?;

    let is_main_line = if input.is_main_line.unwrap_or(true) {
        1
    } else {
        0
    };

    connection.execute(
        r#"
        INSERT INTO dynasty_members (
            dynasty_id, character_id, generation, role, birth_date, death_date, is_main_line, notes
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
        "#,
        params![
            input.dynasty_id,
            input.character_id,
            input.generation.unwrap_or(0),
            input.role.clone().unwrap_or_default(),
            input.birth_date.clone().unwrap_or_default(),
            input.death_date.clone().unwrap_or_default(),
            is_main_line,
            input.notes.clone().unwrap_or_default(),
        ],
    )?;

    let member_id = i32::try_from(connection.last_insert_rowid()).map_err(|_| {
        AppError::internal(
            "DYNASTY_MEMBER_ID_RANGE_ERROR",
            "Created dynasty member id is out of range",
        )
    })?;

    get_dynasty_member_by_id(connection, member_id)
}

pub fn update_dynasty_member(
    connection: &Connection,
    input: &UpdateDynastyMemberInput,
) -> Result<DynastyMember> {
    ensure_dynasty_member_belongs(input.dynasty_id, input.member_id, connection)?;

    let mut fields: Vec<String> = Vec::new();
    let mut values: Vec<SqlValue> = Vec::new();

    if let Some(value) = input.generation {
        fields.push("generation = ?".to_string());
        values.push(SqlValue::Integer(i64::from(value)));
    }
    if let Some(value) = input.role.as_deref() {
        fields.push("role = ?".to_string());
        values.push(SqlValue::Text(value.to_string()));
    }
    if let Some(value) = input.birth_date.as_deref() {
        fields.push("birth_date = ?".to_string());
        values.push(SqlValue::Text(value.to_string()));
    }
    if let Some(value) = input.death_date.as_deref() {
        fields.push("death_date = ?".to_string());
        values.push(SqlValue::Text(value.to_string()));
    }
    if let Some(value) = input.is_main_line {
        fields.push("is_main_line = ?".to_string());
        values.push(SqlValue::Integer(if value { 1 } else { 0 }));
    }
    if let Some(value) = input.notes.as_deref() {
        fields.push("notes = ?".to_string());
        values.push(SqlValue::Text(value.to_string()));
    }

    if !fields.is_empty() {
        let query = format!(
            "UPDATE dynasty_members SET {} WHERE id = ? AND dynasty_id = ?",
            fields.join(", ")
        );
        values.push(SqlValue::Integer(i64::from(input.member_id)));
        values.push(SqlValue::Integer(i64::from(input.dynasty_id)));
        connection.execute(&query, params_from_iter(values.iter()))?;
    }

    get_dynasty_member_by_id(connection, input.member_id)
}

pub fn remove_dynasty_member(
    connection: &Connection,
    input: &RemoveDynastyMemberInput,
) -> Result<()> {
    ensure_dynasty_member_belongs(input.dynasty_id, input.member_id, connection)?;
    connection.execute(
        "DELETE FROM dynasty_members WHERE id = ?1 AND dynasty_id = ?2",
        params![input.member_id, input.dynasty_id],
    )?;
    Ok(())
}

pub fn save_dynasty_graph_positions(
    connection: &Connection,
    input: &SaveDynastyGraphPositionsInput,
) -> Result<()> {
    let _ = get_dynasty_by_id(
        connection,
        &GetDynastyInput {
            id: input.dynasty_id,
            branch_id: input.branch_id,
        },
    )?;

    let mut stmt = connection.prepare(
        "UPDATE dynasty_members SET graph_x = ?1, graph_y = ?2 WHERE dynasty_id = ?3 AND character_id = ?4",
    )?;

    for position in &input.positions {
        stmt.execute(params![
            position.graph_x,
            position.graph_y,
            input.dynasty_id,
            position.character_id
        ])?;
    }

    Ok(())
}

pub fn add_dynasty_family_link(
    connection: &Connection,
    input: &AddDynastyFamilyLinkInput,
) -> Result<DynastyFamilyLink> {
    validate_relation_type(&input.relation_type)?;

    let _ = get_dynasty_by_id(
        connection,
        &GetDynastyInput {
            id: input.dynasty_id,
            branch_id: input.branch_id,
        },
    )?;

    connection.execute(
        r#"
        INSERT INTO dynasty_family_links (
            dynasty_id, source_character_id, target_character_id, relation_type, custom_label
        ) VALUES (?1, ?2, ?3, ?4, ?5)
        "#,
        params![
            input.dynasty_id,
            input.source_character_id,
            input.target_character_id,
            input.relation_type,
            input.custom_label.clone().unwrap_or_default(),
        ],
    )?;

    let link_id = i32::try_from(connection.last_insert_rowid()).map_err(|_| {
        AppError::internal(
            "DYNASTY_FAMILY_LINK_ID_RANGE_ERROR",
            "Created dynasty family link id is out of range",
        )
    })?;

    get_dynasty_family_link_by_id(connection, link_id)
}

pub fn delete_dynasty_family_link(
    connection: &Connection,
    input: &DeleteDynastyFamilyLinkInput,
) -> Result<()> {
    ensure_dynasty_family_link_belongs(input.dynasty_id, input.link_id, connection)?;
    connection.execute(
        "DELETE FROM dynasty_family_links WHERE id = ?1 AND dynasty_id = ?2",
        params![input.link_id, input.dynasty_id],
    )?;
    Ok(())
}

pub fn add_dynasty_event(
    connection: &Connection,
    input: &AddDynastyEventInput,
) -> Result<DynastyEvent> {
    let importance = input
        .importance
        .clone()
        .unwrap_or_else(|| "normal".to_string());
    validate_event_importance(&importance)?;

    let _ = get_dynasty_by_id(
        connection,
        &GetDynastyInput {
            id: input.dynasty_id,
            branch_id: input.branch_id,
        },
    )?;

    connection.execute(
        r#"
        INSERT INTO dynasty_events (dynasty_id, title, description, event_date, importance, sort_order)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6)
        "#,
        params![
            input.dynasty_id,
            input.title,
            input.description.clone().unwrap_or_default(),
            input.event_date,
            importance,
            input.sort_order.unwrap_or(0),
        ],
    )?;

    let event_id = i32::try_from(connection.last_insert_rowid()).map_err(|_| {
        AppError::internal(
            "DYNASTY_EVENT_ID_RANGE_ERROR",
            "Created dynasty event id is out of range",
        )
    })?;

    get_dynasty_event_by_id(connection, event_id)
}

pub fn update_dynasty_event(
    connection: &Connection,
    input: &UpdateDynastyEventInput,
) -> Result<DynastyEvent> {
    ensure_dynasty_event_belongs(input.dynasty_id, input.event_id, connection)?;

    if let Some(importance) = input.importance.as_deref() {
        validate_event_importance(importance)?;
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
    if let Some(value) = input.importance.as_deref() {
        fields.push("importance = ?".to_string());
        values.push(SqlValue::Text(value.to_string()));
    }
    if let Some(value) = input.sort_order {
        fields.push("sort_order = ?".to_string());
        values.push(SqlValue::Integer(i64::from(value)));
    }

    if !fields.is_empty() {
        let query = format!(
            "UPDATE dynasty_events SET {} WHERE id = ? AND dynasty_id = ?",
            fields.join(", ")
        );
        values.push(SqlValue::Integer(i64::from(input.event_id)));
        values.push(SqlValue::Integer(i64::from(input.dynasty_id)));
        connection.execute(&query, params_from_iter(values.iter()))?;
    }

    get_dynasty_event_by_id(connection, input.event_id)
}

pub fn delete_dynasty_event(
    connection: &Connection,
    input: &DeleteDynastyEventInput,
) -> Result<()> {
    ensure_dynasty_event_belongs(input.dynasty_id, input.event_id, connection)?;
    connection.execute(
        "DELETE FROM dynasty_events WHERE id = ?1 AND dynasty_id = ?2",
        params![input.event_id, input.dynasty_id],
    )?;
    Ok(())
}

pub fn reorder_dynasty_events(
    connection: &Connection,
    input: &ReorderDynastyEventsInput,
) -> Result<Dynasty> {
    let _ = get_dynasty_by_id(
        connection,
        &GetDynastyInput {
            id: input.dynasty_id,
            branch_id: input.branch_id,
        },
    )?;

    if input.ordered_ids.is_empty() {
        return Err(AppError::internal(
            "DYNASTY_EVENTS_REORDER_EMPTY",
            "orderedIds must not be empty",
        ));
    }

    let placeholders = input
        .ordered_ids
        .iter()
        .map(|_| "?")
        .collect::<Vec<_>>()
        .join(",");
    let query =
        format!("SELECT id FROM dynasty_events WHERE dynasty_id = ?1 AND id IN ({placeholders})");

    let mut params: Vec<SqlValue> = vec![SqlValue::Integer(i64::from(input.dynasty_id))];
    for id in &input.ordered_ids {
        params.push(SqlValue::Integer(i64::from(*id)));
    }

    let mut statement = connection.prepare(&query)?;
    let rows = statement.query_map(params_from_iter(params.iter()), |row| row.get::<_, i32>(0))?;
    let found: Vec<i32> = rows.collect::<std::result::Result<Vec<_>, _>>()?;

    if found.len() != input.ordered_ids.len() {
        return Err(AppError::internal(
            "DYNASTY_EVENTS_REORDER_INVALID",
            "Some event IDs do not belong to this dynasty",
        ));
    }

    for (index, event_id) in input.ordered_ids.iter().enumerate() {
        connection.execute(
            "UPDATE dynasty_events SET sort_order = ?1 WHERE id = ?2 AND dynasty_id = ?3",
            params![
                i32::try_from(index).unwrap_or(0),
                event_id,
                input.dynasty_id
            ],
        )?;
    }

    get_dynasty_by_id(
        connection,
        &GetDynastyInput {
            id: input.dynasty_id,
            branch_id: input.branch_id,
        },
    )
}

fn attach_dynasty_details(connection: &Connection, dynasty: &mut Dynasty) -> Result<()> {
    let id = dynasty.id;

    dynasty.members = Some(load_members(connection, id)?);
    dynasty.family_links = Some(load_family_links(connection, id)?);
    dynasty.events = Some(load_events(connection, id)?);
    dynasty.tags = Some(tag_associations::get_tags_for_entity(
        connection,
        &EntityTagsInput {
            project_id: dynasty.project_id,
            entity_type: "dynasty".to_string(),
            entity_id: id,
        },
    )?);

    dynasty.founder_name = if let Some(character_id) = dynasty.founder_id {
        load_character_name(connection, character_id)?
    } else {
        None
    };
    dynasty.current_leader_name = if let Some(character_id) = dynasty.current_leader_id {
        load_character_name(connection, character_id)?
    } else {
        None
    };
    dynasty.heir_name = if let Some(character_id) = dynasty.heir_id {
        load_character_name(connection, character_id)?
    } else {
        None
    };
    dynasty.linked_faction_name = if let Some(faction_id) = dynasty.linked_faction_id {
        load_faction_name(connection, faction_id)?
    } else {
        None
    };

    Ok(())
}

fn load_members(connection: &Connection, dynasty_id: i32) -> Result<Vec<DynastyMember>> {
    let mut statement = connection.prepare(
        r#"
        SELECT
            dm.id,
            dm.dynasty_id,
            dm.character_id,
            dm.generation,
            dm.role,
            dm.birth_date,
            dm.death_date,
            dm.is_main_line,
            dm.notes,
            dm.graph_x,
            dm.graph_y,
            c.name AS character_name,
            c.image_path AS character_image_path,
            c.status AS character_status
        FROM dynasty_members dm
        JOIN characters c ON c.id = dm.character_id
        WHERE dm.dynasty_id = ?1
        ORDER BY dm.generation ASC, c.name ASC
        "#,
    )?;
    let rows = statement.query_map(params![dynasty_id], map_dynasty_member_row)?;
    rows.collect::<std::result::Result<Vec<_>, _>>()
        .map_err(AppError::from)
}

fn load_family_links(connection: &Connection, dynasty_id: i32) -> Result<Vec<DynastyFamilyLink>> {
    let mut statement = connection.prepare(
        r#"
        SELECT
            fl.id,
            fl.dynasty_id,
            fl.source_character_id,
            fl.target_character_id,
            fl.relation_type,
            fl.custom_label,
            cs.name AS source_character_name,
            ct.name AS target_character_name
        FROM dynasty_family_links fl
        JOIN characters cs ON cs.id = fl.source_character_id
        JOIN characters ct ON ct.id = fl.target_character_id
        WHERE fl.dynasty_id = ?1
        "#,
    )?;
    let rows = statement.query_map(params![dynasty_id], map_dynasty_family_link_row)?;
    rows.collect::<std::result::Result<Vec<_>, _>>()
        .map_err(AppError::from)
}

fn load_events(connection: &Connection, dynasty_id: i32) -> Result<Vec<DynastyEvent>> {
    let mut statement = connection.prepare(
        r#"
        SELECT id, dynasty_id, title, description, event_date, importance, sort_order, created_at
        FROM dynasty_events
        WHERE dynasty_id = ?1
        ORDER BY sort_order ASC, event_date ASC
        "#,
    )?;
    let rows = statement.query_map(params![dynasty_id], map_dynasty_event_row)?;
    rows.collect::<std::result::Result<Vec<_>, _>>()
        .map_err(AppError::from)
}

fn get_dynasty_member_by_id(connection: &Connection, member_id: i32) -> Result<DynastyMember> {
    connection
        .query_row(
            r#"
            SELECT
                dm.id,
                dm.dynasty_id,
                dm.character_id,
                dm.generation,
                dm.role,
                dm.birth_date,
                dm.death_date,
                dm.is_main_line,
                dm.notes,
                dm.graph_x,
                dm.graph_y,
                c.name AS character_name,
                c.image_path AS character_image_path,
                c.status AS character_status
            FROM dynasty_members dm
            JOIN characters c ON c.id = dm.character_id
            WHERE dm.id = ?1
            "#,
            params![member_id],
            map_dynasty_member_row,
        )
        .map_err(|error| match error {
            rusqlite::Error::QueryReturnedNoRows => {
                AppError::internal("DYNASTY_MEMBER_NOT_FOUND", "DynastyMember not found")
            }
            other => AppError::from(other),
        })
}

fn get_dynasty_family_link_by_id(
    connection: &Connection,
    link_id: i32,
) -> Result<DynastyFamilyLink> {
    connection
        .query_row(
            r#"
            SELECT
                fl.id,
                fl.dynasty_id,
                fl.source_character_id,
                fl.target_character_id,
                fl.relation_type,
                fl.custom_label,
                cs.name AS source_character_name,
                ct.name AS target_character_name
            FROM dynasty_family_links fl
            JOIN characters cs ON cs.id = fl.source_character_id
            JOIN characters ct ON ct.id = fl.target_character_id
            WHERE fl.id = ?1
            "#,
            params![link_id],
            map_dynasty_family_link_row,
        )
        .map_err(|error| match error {
            rusqlite::Error::QueryReturnedNoRows => AppError::internal(
                "DYNASTY_FAMILY_LINK_NOT_FOUND",
                "DynastyFamilyLink not found",
            ),
            other => AppError::from(other),
        })
}

fn get_dynasty_event_by_id(connection: &Connection, event_id: i32) -> Result<DynastyEvent> {
    connection
        .query_row(
            r#"
            SELECT id, dynasty_id, title, description, event_date, importance, sort_order, created_at
            FROM dynasty_events
            WHERE id = ?1
            "#,
            params![event_id],
            map_dynasty_event_row,
        )
        .map_err(|error| match error {
            rusqlite::Error::QueryReturnedNoRows => {
                AppError::internal("DYNASTY_EVENT_NOT_FOUND", "DynastyEvent not found")
            }
            other => AppError::from(other),
        })
}

fn ensure_dynasty_member_belongs(
    dynasty_id: i32,
    member_id: i32,
    connection: &Connection,
) -> Result<()> {
    let exists: Option<i32> = connection
        .query_row(
            "SELECT 1 FROM dynasty_members WHERE id = ?1 AND dynasty_id = ?2",
            params![member_id, dynasty_id],
            |row| row.get(0),
        )
        .optional()?;

    if exists.is_some() {
        Ok(())
    } else {
        Err(AppError::internal(
            "DYNASTY_MEMBER_NOT_FOUND",
            "DynastyMember not found",
        ))
    }
}

fn ensure_dynasty_family_link_belongs(
    dynasty_id: i32,
    link_id: i32,
    connection: &Connection,
) -> Result<()> {
    let exists: Option<i32> = connection
        .query_row(
            "SELECT 1 FROM dynasty_family_links WHERE id = ?1 AND dynasty_id = ?2",
            params![link_id, dynasty_id],
            |row| row.get(0),
        )
        .optional()?;

    if exists.is_some() {
        Ok(())
    } else {
        Err(AppError::internal(
            "DYNASTY_FAMILY_LINK_NOT_FOUND",
            "DynastyFamilyLink not found",
        ))
    }
}

fn ensure_dynasty_event_belongs(
    dynasty_id: i32,
    event_id: i32,
    connection: &Connection,
) -> Result<()> {
    let exists: Option<i32> = connection
        .query_row(
            "SELECT 1 FROM dynasty_events WHERE id = ?1 AND dynasty_id = ?2",
            params![event_id, dynasty_id],
            |row| row.get(0),
        )
        .optional()?;

    if exists.is_some() {
        Ok(())
    } else {
        Err(AppError::internal(
            "DYNASTY_EVENT_NOT_FOUND",
            "DynastyEvent not found",
        ))
    }
}

fn load_character_name(connection: &Connection, character_id: i32) -> Result<Option<String>> {
    connection
        .query_row(
            "SELECT name FROM characters WHERE id = ?1",
            params![character_id],
            |row| row.get(0),
        )
        .optional()
        .map_err(AppError::from)
}

fn load_faction_name(connection: &Connection, faction_id: i32) -> Result<Option<String>> {
    connection
        .query_row(
            "SELECT name FROM factions WHERE id = ?1",
            params![faction_id],
            |row| row.get(0),
        )
        .optional()
        .map_err(AppError::from)
}

fn map_dynasty_list_item(row: DynastyRow) -> Dynasty {
    Dynasty {
        id: row.id,
        project_id: row.project_id,
        name: row.name,
        motto: row.motto,
        description: row.description,
        history: row.history,
        status: row.status,
        color: row.color,
        secondary_color: row.secondary_color,
        image_path: row.image_path,
        founded_date: row.founded_date,
        extinct_date: row.extinct_date,
        founder_id: row.founder_id,
        current_leader_id: row.current_leader_id,
        heir_id: row.heir_id,
        linked_faction_id: row.linked_faction_id,
        sort_order: row.sort_order,
        created_at: row.created_at,
        updated_at: row.updated_at,
        member_count: row.member_count,
        tags: None,
        members: None,
        family_links: None,
        events: None,
        founder_name: None,
        current_leader_name: None,
        heir_name: None,
        linked_faction_name: None,
    }
}

fn map_dynasty_row(row: &Row<'_>) -> rusqlite::Result<DynastyRow> {
    Ok(DynastyRow {
        id: row.get("id")?,
        project_id: row.get("project_id")?,
        name: row.get("name")?,
        motto: row.get("motto")?,
        description: row.get("description")?,
        history: row.get("history")?,
        status: row.get("status")?,
        color: row.get("color")?,
        secondary_color: row.get("secondary_color")?,
        image_path: row.get("image_path")?,
        founded_date: row.get("founded_date")?,
        extinct_date: row.get("extinct_date")?,
        founder_id: row.get("founder_id")?,
        current_leader_id: row.get("current_leader_id")?,
        heir_id: row.get("heir_id")?,
        linked_faction_id: row.get("linked_faction_id")?,
        sort_order: row.get("sort_order")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        created_branch_id: row.get("created_branch_id")?,
        member_count: row.get("member_count")?,
    })
}

fn map_dynasty_member_row(row: &Row<'_>) -> rusqlite::Result<DynastyMember> {
    Ok(DynastyMember {
        id: row.get("id")?,
        dynasty_id: row.get("dynasty_id")?,
        character_id: row.get("character_id")?,
        generation: row.get("generation")?,
        role: row.get("role")?,
        birth_date: row.get("birth_date")?,
        death_date: row.get("death_date")?,
        is_main_line: row.get::<_, i32>("is_main_line")? != 0,
        notes: row.get("notes")?,
        graph_x: row.get("graph_x")?,
        graph_y: row.get("graph_y")?,
        character_name: row.get("character_name")?,
        character_image_path: row.get("character_image_path")?,
        character_status: row.get("character_status")?,
    })
}

fn map_dynasty_family_link_row(row: &Row<'_>) -> rusqlite::Result<DynastyFamilyLink> {
    Ok(DynastyFamilyLink {
        id: row.get("id")?,
        dynasty_id: row.get("dynasty_id")?,
        source_character_id: row.get("source_character_id")?,
        target_character_id: row.get("target_character_id")?,
        relation_type: row.get("relation_type")?,
        custom_label: row.get("custom_label")?,
        source_character_name: row.get("source_character_name")?,
        target_character_name: row.get("target_character_name")?,
    })
}

fn map_dynasty_event_row(row: &Row<'_>) -> rusqlite::Result<DynastyEvent> {
    Ok(DynastyEvent {
        id: row.get("id")?,
        dynasty_id: row.get("dynasty_id")?,
        title: row.get("title")?,
        description: row.get("description")?,
        event_date: row.get("event_date")?,
        importance: row.get("importance")?,
        sort_order: row.get("sort_order")?,
        created_at: row.get("created_at")?,
    })
}

fn validate_dynasty_status(status: &str) -> Result<()> {
    if DYNASTY_STATUSES.contains(&status) {
        Ok(())
    } else {
        Err(AppError::internal(
            "INVALID_DYNASTY_STATUS",
            format!("Invalid dynasty status: {status}"),
        ))
    }
}

fn validate_relation_type(relation_type: &str) -> Result<()> {
    if DYNASTY_FAMILY_RELATION_TYPES.contains(&relation_type) {
        Ok(())
    } else {
        Err(AppError::internal(
            "INVALID_DYNASTY_RELATION_TYPE",
            format!("Invalid dynasty relation type: {relation_type}"),
        ))
    }
}

fn validate_event_importance(importance: &str) -> Result<()> {
    if DYNASTY_EVENT_IMPORTANCE.contains(&importance) {
        Ok(())
    } else {
        Err(AppError::internal(
            "INVALID_DYNASTY_EVENT_IMPORTANCE",
            format!("Invalid dynasty event importance: {importance}"),
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::params;

    fn setup_connection() -> Connection {
        let connection = Connection::open_in_memory().expect("in-memory db");
        connection
            .execute_batch(include_str!("../../migrations/000_init.sql"))
            .expect("init");
        connection
            .execute_batch(include_str!("../../migrations/001_tags.sql"))
            .expect("tags");
        connection
            .execute_batch(include_str!("../../migrations/002_projects.sql"))
            .expect("projects");
        connection
            .execute_batch(include_str!("../../migrations/003_branch_foundation.sql"))
            .expect("branches");
        connection
            .execute_batch(include_str!("../../migrations/004_tag_associations.sql"))
            .expect("tag associations");
        connection
            .execute_batch(include_str!("../../migrations/007_characters.sql"))
            .expect("characters");
        connection
            .execute_batch(include_str!("../../migrations/008_factions.sql"))
            .expect("factions");
        connection
            .execute_batch(include_str!("../../migrations/014_dynasties.sql"))
            .expect("dynasties");

        connection
            .execute(
                "INSERT INTO projects (id, name) VALUES (?1, ?2)",
                params![1, "P1"],
            )
            .expect("project");
        connection
            .execute(
                "INSERT INTO scenario_branches (id, project_id, name, parent_branch_id, base_revision, is_main, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                params![1, 1, "main", Option::<i32>::None, 0, 1, "2025-01-01 00:00:00", "2025-01-01 00:00:00"],
            )
            .expect("main");
        connection
            .execute(
                "INSERT INTO scenario_branches (id, project_id, name, parent_branch_id, base_revision, is_main, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                params![2, 1, "child", 1, 0, 0, "2025-02-01 00:00:00", "2025-02-01 00:00:00"],
            )
            .expect("child");

        connection
    }

    #[test]
    fn child_branch_dynasty_hidden_on_main() {
        let connection = setup_connection();

        create_dynasty(
            &connection,
            &CreateDynastyInput {
                project_id: 1,
                name: "Child House".to_string(),
                motto: None,
                description: None,
                history: None,
                status: None,
                color: None,
                secondary_color: None,
                founded_date: None,
                extinct_date: None,
                founder_id: None,
                current_leader_id: None,
                heir_id: None,
                linked_faction_id: None,
                sort_order: None,
                branch_id: Some(2),
            },
        )
        .expect("create on child");

        let main_list = list_dynasties(
            &connection,
            &DynastiesListInput {
                project_id: 1,
                search: None,
                status: None,
                limit: None,
                offset: None,
                branch_id: Some(1),
            },
        )
        .expect("main list");

        assert_eq!(main_list.total, 0);

        let child_list = list_dynasties(
            &connection,
            &DynastiesListInput {
                project_id: 1,
                search: None,
                status: None,
                limit: None,
                offset: None,
                branch_id: Some(2),
            },
        )
        .expect("child list");

        assert_eq!(child_list.total, 1);
    }
}
