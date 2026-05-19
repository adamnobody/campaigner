use std::collections::{HashMap, HashSet};

use rusqlite::{params, params_from_iter, types::Value as SqlValue, Connection, OptionalExtension};

use crate::error::{AppError, Result};
use crate::models::faction::{
    CompareFactionsInput, CreateFactionInput, CreateFactionMemberInput, CreateFactionPolicyInput,
    CreateFactionRankInput, CreateFactionRelationInput, DeleteFactionInput,
    DeleteFactionMemberInput, DeleteFactionPolicyInput, DeleteFactionRankInput,
    DeleteFactionRelationInput, Faction, FactionCompareEntity, FactionCompareMetric,
    FactionCompareMetricValue, FactionCompareResult, FactionCustomMetric, FactionGraph,
    FactionGraphNode, FactionMember, FactionPolicy, FactionRank, FactionRelation,
    FactionsListInput, FactionsListResult, FactionsRelationsListInput, GetFactionInput, IdNameRef,
    ListFactionMembersInput, ListFactionPoliciesInput, ListFactionRanksInput,
    ReplaceFactionCustomMetricsInput, SetFactionTagsInput, UpdateFactionInput,
    UpdateFactionMemberInput, UpdateFactionPolicyInput, UpdateFactionRankInput,
    UpdateFactionRelationInput,
};
use crate::models::tag::Tag;
use crate::models::tag_association::{EntityTagsInput, SetEntityTagsInput};
use crate::services::branch_scope;
use crate::services::tag_associations;

const DEFAULT_LIST_LIMIT: i32 = 50;
const DEFAULT_LIST_OFFSET: i32 = 0;
const DEFAULT_MEMBER_ROLE: &str = "Член фракции";

const METRIC_COLUMN_MAP: [(&str, &str); 9] = [
    ("treasury", "treasury"),
    ("population", "population"),
    ("army_size", "army_size"),
    ("navy_size", "navy_size"),
    ("territory_km2", "territory_km2"),
    ("annual_income", "annual_income"),
    ("annual_expenses", "annual_expenses"),
    ("members_count", "members_count"),
    ("influence", "influence"),
];

#[derive(Debug, Clone)]
struct FactionRow {
    id: i32,
    project_id: i32,
    name: String,
    kind: String,
    type_value: Option<String>,
    motto: String,
    description: String,
    history: String,
    goals: String,
    headquarters: String,
    territory: String,
    ruling_dynasty_id: Option<i32>,
    ruler_character_id: Option<i32>,
    treasury: Option<i32>,
    population: Option<i32>,
    army_size: Option<i32>,
    navy_size: Option<i32>,
    territory_km2: Option<i32>,
    annual_income: Option<i32>,
    annual_expenses: Option<i32>,
    members_count: Option<i32>,
    influence: Option<i32>,
    status: String,
    color: String,
    secondary_color: String,
    image_path: String,
    banner_path: String,
    founded_date: String,
    disbanded_date: String,
    parent_faction_id: Option<i32>,
    sort_order: i32,
    created_at: String,
    updated_at: String,
    created_branch_id: Option<i32>,
    parent_faction_name: Option<String>,
    ruling_dynasty_name: Option<String>,
    ruler_name: Option<String>,
}

#[derive(Debug, Clone)]
struct FactionMemberRow {
    id: i32,
    faction_id: i32,
    character_id: i32,
    rank_id: Option<i32>,
    role: String,
    joined_date: String,
    left_date: String,
    is_active: i32,
    notes: String,
    character_name: String,
    character_image_path: String,
    rank_name: String,
    rank_level: Option<i32>,
}

#[derive(Debug, Clone)]
struct FactionRelationRow {
    id: i32,
    project_id: i32,
    source_faction_id: i32,
    target_faction_id: i32,
    relation_type: String,
    custom_label: String,
    description: String,
    started_date: String,
    is_bidirectional: i32,
    created_at: String,
    created_branch_id: Option<i32>,
    source_faction_name: Option<String>,
    target_faction_name: Option<String>,
}

pub fn list_factions(
    connection: &Connection,
    input: &FactionsListInput,
) -> Result<FactionsListResult> {
    let mut where_clauses = vec!["f.project_id = ?".to_string()];
    let mut params_vec: Vec<SqlValue> = vec![SqlValue::Integer(i64::from(input.project_id))];

    if let Some(kind) = input.kind.as_deref().filter(|value| !value.is_empty()) {
        where_clauses.push("f.kind = ?".to_string());
        params_vec.push(SqlValue::Text(kind.to_string()));
    }
    if let Some(status) = input.status.as_deref().filter(|value| !value.is_empty()) {
        where_clauses.push("f.status = ?".to_string());
        params_vec.push(SqlValue::Text(status.to_string()));
    }
    if let Some(search) = input.search.as_deref().filter(|value| !value.is_empty()) {
        let like = format!("%{search}%");
        where_clauses.push("(f.name LIKE ? OR f.motto LIKE ? OR f.description LIKE ?)".to_string());
        params_vec.push(SqlValue::Text(like.clone()));
        params_vec.push(SqlValue::Text(like.clone()));
        params_vec.push(SqlValue::Text(like));
    }

    let query = format!(
        r#"
        SELECT
            f.id,
            f.project_id,
            f.name,
            f.kind,
            f.type,
            f.motto,
            f.description,
            f.history,
            f.goals,
            f.headquarters,
            f.territory,
            f.ruling_dynasty_id,
            f.ruler_character_id,
            f.treasury,
            f.population,
            f.army_size,
            f.navy_size,
            f.territory_km2,
            f.annual_income,
            f.annual_expenses,
            f.members_count,
            f.influence,
            f.status,
            f.color,
            f.secondary_color,
            f.image_path,
            f.banner_path,
            f.founded_date,
            f.disbanded_date,
            f.parent_faction_id,
            f.sort_order,
            f.created_at,
            f.updated_at,
            f.created_branch_id,
            pf.name AS parent_faction_name
        FROM factions f
        LEFT JOIN factions pf ON pf.id = f.parent_faction_id
        WHERE {}
        ORDER BY f.sort_order ASC, f.name ASC
        "#,
        where_clauses.join(" AND ")
    );

    let mut statement = connection.prepare(&query)?;
    let rows = statement.query_map(params_from_iter(params_vec.iter()), map_faction_row)?;
    let all_rows = rows.collect::<std::result::Result<Vec<_>, _>>()?;

    let view_branch =
        branch_scope::effective_branch_id_for_read(connection, input.project_id, input.branch_id)?;
    let mut visible_rows = Vec::new();
    for row in all_rows {
        if branch_scope::is_entity_visible_in_branch(
            connection,
            row.project_id,
            view_branch,
            row.created_branch_id,
            Some(row.created_at.as_str()),
        )? {
            visible_rows.push(row);
        }
    }

    let total = i32::try_from(visible_rows.len()).map_err(|_| {
        AppError::internal(
            "FACTIONS_TOTAL_RANGE_ERROR",
            "Factions total is out of range",
        )
    })?;
    let limit = input.limit.unwrap_or(DEFAULT_LIST_LIMIT).max(1);
    let offset = input.offset.unwrap_or(DEFAULT_LIST_OFFSET).max(0);
    let start = usize::try_from(offset).unwrap_or(0);
    let end = usize::try_from(offset + limit).unwrap_or(start);

    let mut items = visible_rows
        .into_iter()
        .skip(start)
        .take(end.saturating_sub(start))
        .map(map_faction)
        .collect::<Vec<_>>();
    attach_tags_and_member_counts(connection, &mut items)?;

    Ok(FactionsListResult { items, total })
}

pub fn get_faction_by_id(connection: &Connection, input: &GetFactionInput) -> Result<Faction> {
    let row = connection
        .query_row(
            r#"
            SELECT
                f.id,
                f.project_id,
                f.name,
                f.kind,
                f.type,
                f.motto,
                f.description,
                f.history,
                f.goals,
                f.headquarters,
                f.territory,
                f.ruling_dynasty_id,
                f.ruler_character_id,
                f.treasury,
                f.population,
                f.army_size,
                f.navy_size,
                f.territory_km2,
                f.annual_income,
                f.annual_expenses,
                f.members_count,
                f.influence,
                f.status,
                f.color,
                f.secondary_color,
                f.image_path,
                f.banner_path,
                f.founded_date,
                f.disbanded_date,
                f.parent_faction_id,
                f.sort_order,
                f.created_at,
                f.updated_at,
                f.created_branch_id,
                pf.name AS parent_faction_name,
                d.name AS ruling_dynasty_name,
                c.name AS ruler_name
            FROM factions f
            LEFT JOIN factions pf ON pf.id = f.parent_faction_id
            LEFT JOIN dynasties d ON d.id = f.ruling_dynasty_id
            LEFT JOIN characters c ON c.id = f.ruler_character_id
            WHERE f.id = ?1
            "#,
            params![input.id],
            map_faction_row,
        )
        .optional()?
        .ok_or_else(|| AppError::internal("FACTION_NOT_FOUND", "Faction not found"))?;

    let view_branch =
        branch_scope::effective_branch_id_for_read(connection, row.project_id, input.branch_id)?;
    if !branch_scope::is_entity_visible_in_branch(
        connection,
        row.project_id,
        view_branch,
        row.created_branch_id,
        Some(row.created_at.as_str()),
    )? {
        return Err(AppError::internal("FACTION_NOT_FOUND", "Faction not found"));
    }

    let mut faction = map_faction(row);
    faction.tags = tag_associations::get_tags_for_entity(
        connection,
        &EntityTagsInput {
            project_id: faction.project_id,
            entity_type: "faction".to_string(),
            entity_id: faction.id,
        },
    )?;

    faction.ranks = list_faction_ranks_internal(connection, faction.id)?;
    faction.members = list_faction_members_internal(connection, faction.id)?;
    faction.member_count = i32::try_from(
        faction.members.iter().filter(|item| item.is_active).count(),
    )
    .map_err(|_| {
        AppError::internal(
            "FACTION_MEMBER_COUNT_RANGE_ERROR",
            "Member count is out of range",
        )
    })?;
    faction.custom_metrics = list_custom_metrics_internal(connection, faction.id)?;
    faction.child_factions = list_child_factions_internal(connection, faction.id)?;
    faction.territories = list_territories_internal(connection, faction.project_id, faction.id)?;

    Ok(faction)
}

pub fn create_faction(connection: &Connection, input: &CreateFactionInput) -> Result<Faction> {
    if let Some(branch_id) = input.branch_id {
        branch_scope::assert_branch_belongs_to_project(connection, branch_id, input.project_id)?;
    }
    let created_branch_id =
        branch_scope::resolve_created_branch_id(connection, input.project_id, input.branch_id)?;
    let kind = normalize_kind(input.kind.as_deref().unwrap_or("faction"))?;
    validate_metrics_by_kind(kind.as_str(), input)?;
    validate_state_relations_input(
        connection,
        input.project_id,
        input.ruling_dynasty_id,
        input.ruler_character_id,
    )?;

    connection.execute(
        r#"
        INSERT INTO factions (
            project_id,
            name,
            kind,
            type,
            motto,
            description,
            history,
            goals,
            headquarters,
            territory,
            treasury,
            population,
            army_size,
            navy_size,
            territory_km2,
            annual_income,
            annual_expenses,
            members_count,
            influence,
            status,
            color,
            secondary_color,
            founded_date,
            disbanded_date,
            parent_faction_id,
            ruling_dynasty_id,
            ruler_character_id,
            sort_order,
            created_branch_id
        ) VALUES (
            ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10,
            ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19,
            ?20, ?21, ?22, ?23, ?24, ?25, ?26, ?27, ?28, ?29
        )
        "#,
        params![
            input.project_id,
            input.name.trim(),
            kind,
            input
                .r#type
                .as_deref()
                .map(|value| value.trim())
                .filter(|value| !value.is_empty()),
            input.motto.clone().unwrap_or_default(),
            input.description.clone().unwrap_or_default(),
            input.history.clone().unwrap_or_default(),
            input.goals.clone().unwrap_or_default(),
            input.headquarters.clone().unwrap_or_default(),
            input.territory.clone().unwrap_or_default(),
            input.treasury,
            input.population,
            input.army_size,
            input.navy_size,
            input.territory_km2,
            input.annual_income,
            input.annual_expenses,
            input.members_count,
            input.influence,
            input.status.clone().unwrap_or_else(|| "active".to_string()),
            input.color.clone().unwrap_or_default(),
            input.secondary_color.clone().unwrap_or_default(),
            input.founded_date.clone().unwrap_or_default(),
            input.disbanded_date.clone().unwrap_or_default(),
            input.parent_faction_id,
            input.ruling_dynasty_id,
            input.ruler_character_id,
            input.sort_order.unwrap_or(0),
            created_branch_id
        ],
    )?;

    let id = i32::try_from(connection.last_insert_rowid())
        .map_err(|_| AppError::internal("FACTION_ID_RANGE_ERROR", "Faction id is out of range"))?;
    if kind == "state" {
        if let Some(territory_ids) = input.territory_ids.as_ref() {
            sync_state_territories(connection, input.project_id, id, territory_ids)?;
        }
    }

    get_faction_by_id(
        connection,
        &GetFactionInput {
            id,
            branch_id: input.branch_id,
        },
    )
}

pub fn update_faction(connection: &Connection, input: &UpdateFactionInput) -> Result<Faction> {
    let current = get_faction_by_id(
        connection,
        &GetFactionInput {
            id: input.id,
            branch_id: input.branch_id,
        },
    )?;

    let kind = match input.kind.as_deref() {
        Some(value) => normalize_kind(value)?,
        None => current.kind.clone(),
    };
    validate_metrics_by_kind(kind.as_str(), input)?;

    let dynasty_for_validation = input.ruling_dynasty_id.unwrap_or(current.ruling_dynasty_id);
    let ruler_for_validation = input
        .ruler_character_id
        .unwrap_or(current.ruler_character_id);
    validate_state_relations_input(
        connection,
        current.project_id,
        dynasty_for_validation,
        ruler_for_validation,
    )?;

    if let Some(name) = input.name.as_ref() {
        connection.execute(
            "UPDATE factions SET name = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![name.trim(), input.id],
        )?;
    }
    if let Some(next_kind) = input.kind.as_ref() {
        connection.execute(
            "UPDATE factions SET kind = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![normalize_kind(next_kind.as_str())?, input.id],
        )?;
    }
    if let Some(type_value) = input.r#type.as_ref() {
        connection.execute(
            "UPDATE factions SET type = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![type_value.as_deref(), input.id],
        )?;
    }
    if let Some(motto) = input.motto.as_ref() {
        connection.execute(
            "UPDATE factions SET motto = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![motto, input.id],
        )?;
    }
    if let Some(description) = input.description.as_ref() {
        connection.execute(
            "UPDATE factions SET description = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![description, input.id],
        )?;
    }
    if let Some(history) = input.history.as_ref() {
        connection.execute(
            "UPDATE factions SET history = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![history, input.id],
        )?;
    }
    if let Some(goals) = input.goals.as_ref() {
        connection.execute(
            "UPDATE factions SET goals = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![goals, input.id],
        )?;
    }
    if let Some(headquarters) = input.headquarters.as_ref() {
        connection.execute(
            "UPDATE factions SET headquarters = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![headquarters, input.id],
        )?;
    }
    if let Some(territory) = input.territory.as_ref() {
        connection.execute(
            "UPDATE factions SET territory = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![territory, input.id],
        )?;
    }
    update_optional_i32(connection, "treasury", input.treasury, input.id)?;
    update_optional_i32(connection, "population", input.population, input.id)?;
    update_optional_i32(connection, "army_size", input.army_size, input.id)?;
    update_optional_i32(connection, "navy_size", input.navy_size, input.id)?;
    update_optional_i32(connection, "territory_km2", input.territory_km2, input.id)?;
    update_optional_i32(connection, "annual_income", input.annual_income, input.id)?;
    update_optional_i32(
        connection,
        "annual_expenses",
        input.annual_expenses,
        input.id,
    )?;
    update_optional_i32(connection, "members_count", input.members_count, input.id)?;
    update_optional_i32(connection, "influence", input.influence, input.id)?;

    if let Some(status) = input.status.as_ref() {
        connection.execute(
            "UPDATE factions SET status = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![status, input.id],
        )?;
    }
    if let Some(color) = input.color.as_ref() {
        connection.execute(
            "UPDATE factions SET color = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![color, input.id],
        )?;
    }
    if let Some(secondary_color) = input.secondary_color.as_ref() {
        connection.execute(
            "UPDATE factions SET secondary_color = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![secondary_color, input.id],
        )?;
    }
    if let Some(founded_date) = input.founded_date.as_ref() {
        connection.execute(
            "UPDATE factions SET founded_date = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![founded_date, input.id],
        )?;
    }
    if let Some(disbanded_date) = input.disbanded_date.as_ref() {
        connection.execute(
            "UPDATE factions SET disbanded_date = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![disbanded_date, input.id],
        )?;
    }
    if let Some(parent_faction_id) = input.parent_faction_id {
        connection.execute(
            "UPDATE factions SET parent_faction_id = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![parent_faction_id, input.id],
        )?;
    }
    if let Some(ruling_dynasty_id) = input.ruling_dynasty_id {
        connection.execute(
            "UPDATE factions SET ruling_dynasty_id = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![ruling_dynasty_id, input.id],
        )?;
    }
    if let Some(ruler_character_id) = input.ruler_character_id {
        connection.execute(
            "UPDATE factions SET ruler_character_id = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![ruler_character_id, input.id],
        )?;
    }
    if let Some(sort_order) = input.sort_order {
        connection.execute(
            "UPDATE factions SET sort_order = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![sort_order, input.id],
        )?;
    }

    if kind == "state" {
        if let Some(territory_ids) = input.territory_ids.as_ref() {
            sync_state_territories(connection, current.project_id, input.id, territory_ids)?;
        }
    }

    get_faction_by_id(
        connection,
        &GetFactionInput {
            id: input.id,
            branch_id: input.branch_id,
        },
    )
}

pub fn delete_faction(connection: &Connection, input: &DeleteFactionInput) -> Result<()> {
    let _ = get_faction_by_id(
        connection,
        &GetFactionInput {
            id: input.id,
            branch_id: input.branch_id,
        },
    )?;
    connection.execute("DELETE FROM factions WHERE id = ?1", params![input.id])?;
    Ok(())
}

pub fn set_faction_tags(connection: &Connection, input: &SetFactionTagsInput) -> Result<Vec<Tag>> {
    let faction = get_faction_by_id(
        connection,
        &GetFactionInput {
            id: input.id,
            branch_id: input.branch_id,
        },
    )?;
    tag_associations::set_tags_for_entity(
        connection,
        &SetEntityTagsInput {
            project_id: faction.project_id,
            entity_type: "faction".to_string(),
            entity_id: faction.id,
            tag_ids: input.tag_ids.clone(),
        },
    )
}

pub fn list_faction_ranks(
    connection: &Connection,
    input: &ListFactionRanksInput,
) -> Result<Vec<FactionRank>> {
    let _ = get_faction_by_id(
        connection,
        &GetFactionInput {
            id: input.faction_id,
            branch_id: input.branch_id,
        },
    )?;
    list_faction_ranks_internal(connection, input.faction_id)
}

pub fn create_faction_rank(
    connection: &Connection,
    input: &CreateFactionRankInput,
) -> Result<FactionRank> {
    let _ = get_faction_by_id(
        connection,
        &GetFactionInput {
            id: input.faction_id,
            branch_id: input.branch_id,
        },
    )?;

    connection.execute(
        r#"
        INSERT INTO faction_ranks (faction_id, name, level, description, permissions, icon, color)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
        "#,
        params![
            input.faction_id,
            input.name.trim(),
            input.level.unwrap_or(0),
            input.description.clone().unwrap_or_default(),
            input.permissions.clone().unwrap_or_default(),
            input.icon.clone().unwrap_or_default(),
            input.color.clone().unwrap_or_default()
        ],
    )?;

    let id = i32::try_from(connection.last_insert_rowid()).map_err(|_| {
        AppError::internal(
            "FACTION_RANK_ID_RANGE_ERROR",
            "Faction rank id is out of range",
        )
    })?;
    get_faction_rank_by_id(connection, id)
}

pub fn update_faction_rank(
    connection: &Connection,
    input: &UpdateFactionRankInput,
) -> Result<FactionRank> {
    let _ = get_faction_by_id(
        connection,
        &GetFactionInput {
            id: input.faction_id,
            branch_id: input.branch_id,
        },
    )?;
    let _ = get_faction_rank_by_id(connection, input.rank_id)?;

    if let Some(name) = input.name.as_ref() {
        connection.execute(
            "UPDATE faction_ranks SET name = ?1 WHERE id = ?2",
            params![name.trim(), input.rank_id],
        )?;
    }
    if let Some(level) = input.level {
        connection.execute(
            "UPDATE faction_ranks SET level = ?1 WHERE id = ?2",
            params![level, input.rank_id],
        )?;
    }
    if let Some(description) = input.description.as_ref() {
        connection.execute(
            "UPDATE faction_ranks SET description = ?1 WHERE id = ?2",
            params![description, input.rank_id],
        )?;
    }
    if let Some(permissions) = input.permissions.as_ref() {
        connection.execute(
            "UPDATE faction_ranks SET permissions = ?1 WHERE id = ?2",
            params![permissions, input.rank_id],
        )?;
    }
    if let Some(icon) = input.icon.as_ref() {
        connection.execute(
            "UPDATE faction_ranks SET icon = ?1 WHERE id = ?2",
            params![icon, input.rank_id],
        )?;
    }
    if let Some(color) = input.color.as_ref() {
        connection.execute(
            "UPDATE faction_ranks SET color = ?1 WHERE id = ?2",
            params![color, input.rank_id],
        )?;
    }

    get_faction_rank_by_id(connection, input.rank_id)
}

pub fn delete_faction_rank(connection: &Connection, input: &DeleteFactionRankInput) -> Result<()> {
    let _ = get_faction_by_id(
        connection,
        &GetFactionInput {
            id: input.faction_id,
            branch_id: input.branch_id,
        },
    )?;
    let _ = get_faction_rank_by_id(connection, input.rank_id)?;

    connection.execute(
        "UPDATE faction_members SET rank_id = NULL WHERE rank_id = ?1",
        params![input.rank_id],
    )?;
    connection.execute(
        "DELETE FROM faction_ranks WHERE id = ?1",
        params![input.rank_id],
    )?;
    Ok(())
}

pub fn list_faction_members(
    connection: &Connection,
    input: &ListFactionMembersInput,
) -> Result<Vec<FactionMember>> {
    let _ = get_faction_by_id(
        connection,
        &GetFactionInput {
            id: input.faction_id,
            branch_id: input.branch_id,
        },
    )?;
    list_faction_members_internal(connection, input.faction_id)
}

pub fn create_faction_member(
    connection: &Connection,
    input: &CreateFactionMemberInput,
) -> Result<FactionMember> {
    let _ = get_faction_by_id(
        connection,
        &GetFactionInput {
            id: input.faction_id,
            branch_id: input.branch_id,
        },
    )?;
    ensure_character_exists_for_project(connection, input.character_id)?;

    let existing_id = connection
        .query_row(
            "SELECT id FROM faction_members WHERE faction_id = ?1 AND character_id = ?2",
            params![input.faction_id, input.character_id],
            |row| row.get::<_, i32>(0),
        )
        .optional()?;
    if let Some(member_id) = existing_id {
        return get_faction_member_by_id(connection, member_id);
    }

    let rank_id = input.rank_id.or(get_lowest_rank_id_for_faction(
        connection,
        input.faction_id,
    )?);
    connection.execute(
        r#"
        INSERT INTO faction_members (
            faction_id,
            character_id,
            rank_id,
            role,
            joined_date,
            left_date,
            is_active,
            notes
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
        "#,
        params![
            input.faction_id,
            input.character_id,
            rank_id,
            input.role.as_deref().unwrap_or(DEFAULT_MEMBER_ROLE),
            input.joined_date.as_deref().unwrap_or(""),
            input.left_date.as_deref().unwrap_or(""),
            if input.is_active.unwrap_or(true) {
                1
            } else {
                0
            },
            input.notes.as_deref().unwrap_or("")
        ],
    )?;
    connection.execute(
        "INSERT OR IGNORE INTO character_factions (character_id, faction_id) VALUES (?1, ?2)",
        params![input.character_id, input.faction_id],
    )?;

    let member_id = i32::try_from(connection.last_insert_rowid()).map_err(|_| {
        AppError::internal(
            "FACTION_MEMBER_ID_RANGE_ERROR",
            "Faction member id is out of range",
        )
    })?;
    get_faction_member_by_id(connection, member_id)
}

pub fn update_faction_member(
    connection: &Connection,
    input: &UpdateFactionMemberInput,
) -> Result<FactionMember> {
    let _ = get_faction_member_by_id(connection, input.member_id)?;

    if let Some(rank_id) = input.rank_id {
        connection.execute(
            "UPDATE faction_members SET rank_id = ?1 WHERE id = ?2",
            params![rank_id, input.member_id],
        )?;
    }
    if let Some(role) = input.role.as_ref() {
        connection.execute(
            "UPDATE faction_members SET role = ?1 WHERE id = ?2",
            params![role, input.member_id],
        )?;
    }
    if let Some(joined_date) = input.joined_date.as_ref() {
        connection.execute(
            "UPDATE faction_members SET joined_date = ?1 WHERE id = ?2",
            params![joined_date, input.member_id],
        )?;
    }
    if let Some(left_date) = input.left_date.as_ref() {
        connection.execute(
            "UPDATE faction_members SET left_date = ?1 WHERE id = ?2",
            params![left_date, input.member_id],
        )?;
    }
    if let Some(is_active) = input.is_active {
        connection.execute(
            "UPDATE faction_members SET is_active = ?1 WHERE id = ?2",
            params![if is_active { 1 } else { 0 }, input.member_id],
        )?;
    }
    if let Some(notes) = input.notes.as_ref() {
        connection.execute(
            "UPDATE faction_members SET notes = ?1 WHERE id = ?2",
            params![notes, input.member_id],
        )?;
    }

    get_faction_member_by_id(connection, input.member_id)
}

pub fn delete_faction_member(
    connection: &Connection,
    input: &DeleteFactionMemberInput,
) -> Result<()> {
    let member = get_faction_member_by_id(connection, input.member_id)?;
    connection.execute(
        "DELETE FROM faction_members WHERE id = ?1",
        params![input.member_id],
    )?;
    connection.execute(
        "DELETE FROM character_factions WHERE character_id = ?1 AND faction_id = ?2",
        params![member.character_id, member.faction_id],
    )?;
    Ok(())
}

pub fn replace_custom_metrics(
    connection: &Connection,
    input: &ReplaceFactionCustomMetricsInput,
) -> Result<Vec<FactionCustomMetric>> {
    let _ = get_faction_by_id(
        connection,
        &GetFactionInput {
            id: input.faction_id,
            branch_id: input.branch_id,
        },
    )?;

    let mut seen = HashSet::new();
    for metric in &input.metrics {
        let name = metric.name.trim();
        if name.is_empty() {
            return Err(AppError::internal(
                "FACTION_CUSTOM_METRIC_NAME_REQUIRED",
                "Custom metric name is required",
            ));
        }
        let key = name.to_lowercase();
        if !seen.insert(key) {
            return Err(AppError::internal(
                "FACTION_CUSTOM_METRIC_DUPLICATE",
                format!("Duplicate custom metric name \"{name}\""),
            ));
        }
    }

    let tx = connection.unchecked_transaction()?;
    tx.execute(
        "DELETE FROM faction_custom_metrics WHERE faction_id = ?1",
        params![input.faction_id],
    )?;
    {
        let mut insert = tx.prepare(
            r#"
            INSERT INTO faction_custom_metrics (
                faction_id,
                name,
                value,
                unit,
                sort_order,
                created_at,
                updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'), datetime('now'))
            "#,
        )?;
        for (index, metric) in input.metrics.iter().enumerate() {
            let sort_order = metric
                .sort_order
                .unwrap_or(i32::try_from(index).unwrap_or(0));
            insert.execute(params![
                input.faction_id,
                metric.name.trim(),
                metric.value,
                metric
                    .unit
                    .as_deref()
                    .map(str::trim)
                    .filter(|value| !value.is_empty()),
                sort_order
            ])?;
        }
    }
    tx.commit()?;

    list_custom_metrics_internal(connection, input.faction_id)
}

pub fn compare_factions(
    connection: &Connection,
    input: &CompareFactionsInput,
) -> Result<FactionCompareResult> {
    let faction_ids = dedupe_positive_ids(&input.faction_ids);
    let metric_keys = dedupe_non_empty_strings(&input.metric_keys);
    if faction_ids.is_empty() || metric_keys.is_empty() {
        return Err(AppError::internal(
            "FACTION_COMPARE_INPUT_ERROR",
            "factionIds and metricKeys must not be empty",
        ));
    }

    let faction_rows = {
        let placeholders = make_placeholders(faction_ids.len());
        let query = format!("SELECT id, name, kind FROM factions WHERE id IN ({placeholders})");
        let mut statement = connection.prepare(&query)?;
        let rows = statement.query_map(params_from_iter(faction_ids.iter()), |row| {
            Ok(FactionCompareEntity {
                id: row.get("id")?,
                name: row.get("name")?,
                kind: row.get("kind")?,
            })
        })?;
        rows.collect::<std::result::Result<Vec<_>, _>>()?
    };
    if faction_rows.len() != faction_ids.len() {
        return Err(AppError::internal(
            "FACTION_COMPARE_NOT_FOUND",
            "One or more factions do not exist",
        ));
    }
    let factions_by_id = faction_rows
        .iter()
        .map(|item| (item.id, item.kind.as_str()))
        .collect::<HashMap<_, _>>();

    let mut metrics = Vec::new();
    for key in metric_keys {
        if let Some(custom_name) = key.strip_prefix("custom:") {
            let name = custom_name.trim();
            if name.is_empty() {
                return Err(AppError::internal(
                    "FACTION_COMPARE_METRIC_KEY_ERROR",
                    format!("Invalid metric key \"{key}\""),
                ));
            }
            let mut values = Vec::new();
            let mut unit: Option<String> = None;
            for faction_id in &faction_ids {
                let metric_row = connection
                    .query_row(
                        "SELECT value, unit FROM faction_custom_metrics WHERE faction_id = ?1 AND name = ?2",
                        params![faction_id, name],
                        |row| Ok((row.get::<_, f64>(0)?, row.get::<_, Option<String>>(1)?)),
                    )
                    .optional()?;
                if let Some((value, current_unit)) = metric_row {
                    if unit.is_none() {
                        unit = current_unit;
                    }
                    values.push(FactionCompareMetricValue {
                        faction_id: *faction_id,
                        value: Some(value),
                    });
                } else {
                    values.push(FactionCompareMetricValue {
                        faction_id: *faction_id,
                        value: None,
                    });
                }
            }
            metrics.push(FactionCompareMetric {
                key: key.clone(),
                label: name.to_string(),
                unit,
                values,
            });
            continue;
        }

        let column = METRIC_COLUMN_MAP
            .iter()
            .find_map(|(metric_key, column)| {
                if *metric_key == key {
                    Some(*column)
                } else {
                    None
                }
            })
            .ok_or_else(|| {
                AppError::internal(
                    "FACTION_COMPARE_METRIC_KEY_ERROR",
                    format!("Invalid metric key \"{key}\""),
                )
            })?;

        let mut values = Vec::new();
        for faction_id in &faction_ids {
            let kind = factions_by_id.get(faction_id).copied().unwrap_or("faction");
            let applicable = is_metric_applicable_for_kind(key.as_str(), kind);
            if !applicable {
                values.push(FactionCompareMetricValue {
                    faction_id: *faction_id,
                    value: None,
                });
                continue;
            }
            let query = format!("SELECT {column} FROM factions WHERE id = ?1");
            let value = connection
                .query_row(query.as_str(), params![faction_id], |row| {
                    row.get::<_, Option<f64>>(0)
                })
                .optional()?
                .flatten();
            values.push(FactionCompareMetricValue {
                faction_id: *faction_id,
                value,
            });
        }

        metrics.push(FactionCompareMetric {
            key: key.clone(),
            label: key,
            unit: metric_unit_for_key(column),
            values,
        });
    }

    Ok(FactionCompareResult {
        factions: faction_rows,
        metrics,
    })
}

pub fn list_faction_relations(
    connection: &Connection,
    input: &FactionsRelationsListInput,
) -> Result<Vec<FactionRelation>> {
    let view_branch =
        branch_scope::effective_branch_id_for_read(connection, input.project_id, input.branch_id)?;
    let mut statement = connection.prepare(
        r#"
        SELECT
            fr.id,
            fr.project_id,
            fr.source_faction_id,
            fr.target_faction_id,
            fr.relation_type,
            fr.custom_label,
            fr.description,
            fr.started_date,
            fr.is_bidirectional,
            fr.created_at,
            fr.created_branch_id,
            sf.name AS source_faction_name,
            tf.name AS target_faction_name
        FROM faction_relations fr
        JOIN factions sf ON sf.id = fr.source_faction_id
        JOIN factions tf ON tf.id = fr.target_faction_id
        WHERE fr.project_id = ?1
        ORDER BY fr.created_at DESC
        "#,
    )?;
    let rows = statement.query_map(params![input.project_id], map_relation_row)?;
    let all_rows = rows.collect::<std::result::Result<Vec<_>, _>>()?;

    let mut result = Vec::new();
    for row in all_rows {
        if !branch_scope::is_entity_visible_in_branch(
            connection,
            row.project_id,
            view_branch,
            row.created_branch_id,
            Some(row.created_at.as_str()),
        )? {
            continue;
        }
        if !is_faction_visible(connection, row.source_faction_id, view_branch)?
            || !is_faction_visible(connection, row.target_faction_id, view_branch)?
        {
            continue;
        }
        result.push(map_relation(row));
    }
    Ok(result)
}

pub fn create_faction_relation(
    connection: &Connection,
    input: &CreateFactionRelationInput,
) -> Result<FactionRelation> {
    if let Some(branch_id) = input.branch_id {
        branch_scope::assert_branch_belongs_to_project(connection, branch_id, input.project_id)?;
    }
    let _ = get_faction_by_id(
        connection,
        &GetFactionInput {
            id: input.source_faction_id,
            branch_id: input.branch_id,
        },
    )?;
    let _ = get_faction_by_id(
        connection,
        &GetFactionInput {
            id: input.target_faction_id,
            branch_id: input.branch_id,
        },
    )?;

    let created_branch_id =
        branch_scope::resolve_created_branch_id(connection, input.project_id, input.branch_id)?;
    connection.execute(
        r#"
        INSERT INTO faction_relations (
            project_id,
            source_faction_id,
            target_faction_id,
            relation_type,
            custom_label,
            description,
            started_date,
            is_bidirectional,
            created_branch_id
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
        "#,
        params![
            input.project_id,
            input.source_faction_id,
            input.target_faction_id,
            input
                .relation_type
                .as_deref()
                .filter(|value| !value.is_empty())
                .unwrap_or("neutral"),
            input.custom_label.clone().unwrap_or_default(),
            input.description.clone().unwrap_or_default(),
            input.started_date.clone().unwrap_or_default(),
            if input.is_bidirectional.unwrap_or(true) {
                1
            } else {
                0
            },
            created_branch_id
        ],
    )?;

    let id = i32::try_from(connection.last_insert_rowid()).map_err(|_| {
        AppError::internal(
            "FACTION_RELATION_ID_RANGE_ERROR",
            "Faction relation id is out of range",
        )
    })?;
    get_faction_relation_by_id(connection, id, input.branch_id)
}

pub fn update_faction_relation(
    connection: &Connection,
    input: &UpdateFactionRelationInput,
) -> Result<FactionRelation> {
    let _ = get_faction_relation_by_id(connection, input.relation_id, None)?;
    if let Some(relation_type) = input.relation_type.as_ref() {
        connection.execute(
            "UPDATE faction_relations SET relation_type = ?1 WHERE id = ?2",
            params![relation_type, input.relation_id],
        )?;
    }
    if let Some(custom_label) = input.custom_label.as_ref() {
        connection.execute(
            "UPDATE faction_relations SET custom_label = ?1 WHERE id = ?2",
            params![custom_label, input.relation_id],
        )?;
    }
    if let Some(description) = input.description.as_ref() {
        connection.execute(
            "UPDATE faction_relations SET description = ?1 WHERE id = ?2",
            params![description, input.relation_id],
        )?;
    }
    if let Some(started_date) = input.started_date.as_ref() {
        connection.execute(
            "UPDATE faction_relations SET started_date = ?1 WHERE id = ?2",
            params![started_date, input.relation_id],
        )?;
    }
    if let Some(is_bidirectional) = input.is_bidirectional {
        connection.execute(
            "UPDATE faction_relations SET is_bidirectional = ?1 WHERE id = ?2",
            params![if is_bidirectional { 1 } else { 0 }, input.relation_id],
        )?;
    }

    get_faction_relation_by_id(connection, input.relation_id, None)
}

pub fn delete_faction_relation(
    connection: &Connection,
    input: &DeleteFactionRelationInput,
) -> Result<()> {
    let _ = get_faction_relation_by_id(connection, input.relation_id, None)?;
    connection.execute(
        "DELETE FROM faction_relations WHERE id = ?1",
        params![input.relation_id],
    )?;
    Ok(())
}

pub fn get_faction_graph(
    connection: &Connection,
    input: &FactionsRelationsListInput,
) -> Result<FactionGraph> {
    let list = list_factions(
        connection,
        &FactionsListInput {
            project_id: input.project_id,
            kind: None,
            status: None,
            search: None,
            limit: Some(i32::MAX),
            offset: Some(0),
            branch_id: input.branch_id,
        },
    )?;
    let nodes = list
        .items
        .iter()
        .map(|faction| FactionGraphNode {
            id: faction.id,
            name: faction.name.clone(),
            kind: faction.kind.clone(),
            r#type: faction.r#type.clone(),
            status: faction.status.clone(),
            color: faction.color.clone(),
            image_path: faction.image_path.clone(),
            member_count: faction.member_count,
        })
        .collect::<Vec<_>>();
    let node_ids = nodes.iter().map(|item| item.id).collect::<HashSet<_>>();

    let edges = list_faction_relations(connection, input)?
        .into_iter()
        .filter(|relation| {
            node_ids.contains(&relation.source_faction_id)
                && node_ids.contains(&relation.target_faction_id)
        })
        .collect::<Vec<_>>();

    Ok(FactionGraph { nodes, edges })
}

pub fn list_faction_policies(
    connection: &Connection,
    input: &ListFactionPoliciesInput,
) -> Result<Vec<FactionPolicy>> {
    let _ = get_faction_by_id(
        connection,
        &GetFactionInput {
            id: input.faction_id,
            branch_id: input.branch_id,
        },
    )?;
    let mut statement = connection.prepare(
        r#"
        SELECT
            id,
            faction_id,
            title,
            type,
            status,
            category,
            enacted_date,
            description,
            sort_order,
            created_at,
            updated_at
        FROM faction_policies
        WHERE faction_id = ?1
        ORDER BY sort_order ASC, id ASC
        "#,
    )?;
    let rows = statement.query_map(params![input.faction_id], map_policy_row)?;
    rows.collect::<std::result::Result<Vec<_>, _>>()
        .map_err(Into::into)
}

pub fn create_faction_policy(
    connection: &Connection,
    input: &CreateFactionPolicyInput,
) -> Result<FactionPolicy> {
    let _ = get_faction_by_id(
        connection,
        &GetFactionInput {
            id: input.faction_id,
            branch_id: input.branch_id,
        },
    )?;
    connection.execute(
        r#"
        INSERT INTO faction_policies (
            faction_id,
            title,
            type,
            status,
            category,
            enacted_date,
            description,
            sort_order
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
        "#,
        params![
            input.faction_id,
            input.title.trim(),
            input.r#type,
            input.status.as_deref().unwrap_or("active"),
            input.category.as_deref().unwrap_or("other"),
            input
                .enacted_date
                .as_deref()
                .filter(|value| !value.is_empty()),
            input.description.clone().unwrap_or_default(),
            input.sort_order.unwrap_or(0)
        ],
    )?;
    let id = i32::try_from(connection.last_insert_rowid()).map_err(|_| {
        AppError::internal(
            "FACTION_POLICY_ID_RANGE_ERROR",
            "Faction policy id is out of range",
        )
    })?;
    get_faction_policy_by_id(connection, input.faction_id, id)
}

pub fn update_faction_policy(
    connection: &Connection,
    input: &UpdateFactionPolicyInput,
) -> Result<FactionPolicy> {
    let _ = get_faction_by_id(
        connection,
        &GetFactionInput {
            id: input.faction_id,
            branch_id: input.branch_id,
        },
    )?;
    let _ = get_faction_policy_by_id(connection, input.faction_id, input.policy_id)?;

    if let Some(title) = input.title.as_ref() {
        connection.execute(
            "UPDATE faction_policies SET title = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![title.trim(), input.policy_id],
        )?;
    }
    if let Some(policy_type) = input.r#type.as_ref() {
        connection.execute(
            "UPDATE faction_policies SET type = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![policy_type, input.policy_id],
        )?;
    }
    if let Some(status) = input.status.as_ref() {
        connection.execute(
            "UPDATE faction_policies SET status = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![status, input.policy_id],
        )?;
    }
    if let Some(category) = input.category.as_ref() {
        connection.execute(
            "UPDATE faction_policies SET category = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![category, input.policy_id],
        )?;
    }
    if let Some(enacted_date) = input.enacted_date.as_ref() {
        connection.execute(
            "UPDATE faction_policies SET enacted_date = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![enacted_date.as_deref(), input.policy_id],
        )?;
    }
    if let Some(description) = input.description.as_ref() {
        connection.execute(
            "UPDATE faction_policies SET description = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![description, input.policy_id],
        )?;
    }
    if let Some(sort_order) = input.sort_order {
        connection.execute(
            "UPDATE faction_policies SET sort_order = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![sort_order, input.policy_id],
        )?;
    }

    get_faction_policy_by_id(connection, input.faction_id, input.policy_id)
}

pub fn delete_faction_policy(
    connection: &Connection,
    input: &DeleteFactionPolicyInput,
) -> Result<()> {
    let _ = get_faction_by_id(
        connection,
        &GetFactionInput {
            id: input.faction_id,
            branch_id: input.branch_id,
        },
    )?;
    let _ = get_faction_policy_by_id(connection, input.faction_id, input.policy_id)?;
    connection.execute(
        "DELETE FROM faction_policies WHERE id = ?1 AND faction_id = ?2",
        params![input.policy_id, input.faction_id],
    )?;
    Ok(())
}

fn update_optional_i32(
    connection: &Connection,
    column: &str,
    value: Option<Option<i32>>,
    id: i32,
) -> Result<()> {
    if let Some(payload) = value {
        let query = format!(
            "UPDATE factions SET {column} = ?1, updated_at = datetime('now') WHERE id = ?2"
        );
        connection.execute(query.as_str(), params![payload, id])?;
    }
    Ok(())
}

fn list_faction_ranks_internal(
    connection: &Connection,
    faction_id: i32,
) -> Result<Vec<FactionRank>> {
    let mut statement = connection.prepare(
        r#"
        SELECT id, faction_id, name, level, description, permissions, icon, color
        FROM faction_ranks
        WHERE faction_id = ?1
        ORDER BY level DESC
        "#,
    )?;
    let rows = statement.query_map(params![faction_id], |row| {
        Ok(FactionRank {
            id: row.get("id")?,
            faction_id: row.get("faction_id")?,
            name: row.get("name")?,
            level: row.get("level")?,
            description: row
                .get::<_, Option<String>>("description")?
                .unwrap_or_default(),
            permissions: row
                .get::<_, Option<String>>("permissions")?
                .unwrap_or_default(),
            icon: row.get::<_, Option<String>>("icon")?.unwrap_or_default(),
            color: row.get::<_, Option<String>>("color")?.unwrap_or_default(),
        })
    })?;
    rows.collect::<std::result::Result<Vec<_>, _>>()
        .map_err(Into::into)
}

fn list_faction_members_internal(
    connection: &Connection,
    faction_id: i32,
) -> Result<Vec<FactionMember>> {
    let mut statement = connection.prepare(
        r#"
        SELECT
            fm.id,
            fm.faction_id,
            fm.character_id,
            fm.rank_id,
            fm.role,
            fm.joined_date,
            fm.left_date,
            fm.is_active,
            fm.notes,
            c.name AS character_name,
            c.image_path AS character_image_path,
            fr.name AS rank_name,
            fr.level AS rank_level
        FROM faction_members fm
        JOIN characters c ON c.id = fm.character_id
        LEFT JOIN faction_ranks fr ON fr.id = fm.rank_id
        WHERE fm.faction_id = ?1
        ORDER BY COALESCE(fr.level, -1) DESC, c.name ASC
        "#,
    )?;
    let rows = statement.query_map(params![faction_id], map_member_row)?;
    let raw = rows.collect::<std::result::Result<Vec<_>, _>>()?;
    Ok(raw.into_iter().map(map_member).collect())
}

fn list_custom_metrics_internal(
    connection: &Connection,
    faction_id: i32,
) -> Result<Vec<FactionCustomMetric>> {
    let mut statement = connection.prepare(
        r#"
        SELECT id, faction_id, name, value, unit, sort_order, created_at, updated_at
        FROM faction_custom_metrics
        WHERE faction_id = ?1
        ORDER BY sort_order ASC, id ASC
        "#,
    )?;
    let rows = statement.query_map(params![faction_id], |row| {
        Ok(FactionCustomMetric {
            id: row.get("id")?,
            faction_id: row.get("faction_id")?,
            name: row.get("name")?,
            value: row.get("value")?,
            unit: row.get("unit")?,
            sort_order: row.get::<_, Option<i32>>("sort_order")?.unwrap_or(0),
            created_at: row.get("created_at")?,
            updated_at: row.get("updated_at")?,
        })
    })?;
    rows.collect::<std::result::Result<Vec<_>, _>>()
        .map_err(Into::into)
}

fn list_child_factions_internal(connection: &Connection, parent_id: i32) -> Result<Vec<IdNameRef>> {
    let mut statement = connection
        .prepare("SELECT id, name FROM factions WHERE parent_faction_id = ?1 ORDER BY name ASC")?;
    let rows = statement.query_map(params![parent_id], |row| {
        Ok(IdNameRef {
            id: row.get("id")?,
            name: row.get("name")?,
        })
    })?;
    rows.collect::<std::result::Result<Vec<_>, _>>()
        .map_err(Into::into)
}

fn list_territories_internal(
    connection: &Connection,
    project_id: i32,
    faction_id: i32,
) -> Result<Vec<IdNameRef>> {
    let mut statement = connection.prepare(
        r#"
        SELECT mt.id, mt.name
        FROM map_territories mt
        JOIN maps m ON m.id = mt.map_id
        WHERE m.project_id = ?1 AND mt.faction_id = ?2
        ORDER BY mt.name COLLATE NOCASE ASC
        "#,
    )?;
    let rows = statement.query_map(params![project_id, faction_id], |row| {
        Ok(IdNameRef {
            id: row.get("id")?,
            name: row.get("name")?,
        })
    })?;
    rows.collect::<std::result::Result<Vec<_>, _>>()
        .map_err(Into::into)
}

fn get_faction_rank_by_id(connection: &Connection, id: i32) -> Result<FactionRank> {
    connection
        .query_row(
            r#"
            SELECT id, faction_id, name, level, description, permissions, icon, color
            FROM faction_ranks
            WHERE id = ?1
            "#,
            params![id],
            |row| {
                Ok(FactionRank {
                    id: row.get("id")?,
                    faction_id: row.get("faction_id")?,
                    name: row.get("name")?,
                    level: row.get("level")?,
                    description: row
                        .get::<_, Option<String>>("description")?
                        .unwrap_or_default(),
                    permissions: row
                        .get::<_, Option<String>>("permissions")?
                        .unwrap_or_default(),
                    icon: row.get::<_, Option<String>>("icon")?.unwrap_or_default(),
                    color: row.get::<_, Option<String>>("color")?.unwrap_or_default(),
                })
            },
        )
        .optional()?
        .ok_or_else(|| AppError::internal("FACTION_RANK_NOT_FOUND", "Faction rank not found"))
}

fn get_faction_member_by_id(connection: &Connection, id: i32) -> Result<FactionMember> {
    connection
        .query_row(
            r#"
            SELECT
                fm.id,
                fm.faction_id,
                fm.character_id,
                fm.rank_id,
                fm.role,
                fm.joined_date,
                fm.left_date,
                fm.is_active,
                fm.notes,
                c.name AS character_name,
                c.image_path AS character_image_path,
                fr.name AS rank_name,
                fr.level AS rank_level
            FROM faction_members fm
            JOIN characters c ON c.id = fm.character_id
            LEFT JOIN faction_ranks fr ON fr.id = fm.rank_id
            WHERE fm.id = ?1
            "#,
            params![id],
            map_member_row,
        )
        .optional()?
        .map(map_member)
        .ok_or_else(|| AppError::internal("FACTION_MEMBER_NOT_FOUND", "Faction member not found"))
}

fn get_faction_relation_by_id(
    connection: &Connection,
    id: i32,
    branch_id: Option<i32>,
) -> Result<FactionRelation> {
    let row = connection
        .query_row(
            r#"
            SELECT
                fr.id,
                fr.project_id,
                fr.source_faction_id,
                fr.target_faction_id,
                fr.relation_type,
                fr.custom_label,
                fr.description,
                fr.started_date,
                fr.is_bidirectional,
                fr.created_at,
                fr.created_branch_id,
                sf.name AS source_faction_name,
                tf.name AS target_faction_name
            FROM faction_relations fr
            JOIN factions sf ON sf.id = fr.source_faction_id
            JOIN factions tf ON tf.id = fr.target_faction_id
            WHERE fr.id = ?1
            "#,
            params![id],
            map_relation_row,
        )
        .optional()?
        .ok_or_else(|| {
            AppError::internal("FACTION_RELATION_NOT_FOUND", "Faction relation not found")
        })?;

    let view_branch =
        branch_scope::effective_branch_id_for_read(connection, row.project_id, branch_id)?;
    if !branch_scope::is_entity_visible_in_branch(
        connection,
        row.project_id,
        view_branch,
        row.created_branch_id,
        Some(row.created_at.as_str()),
    )? {
        return Err(AppError::internal(
            "FACTION_RELATION_NOT_FOUND",
            "Faction relation not found",
        ));
    }
    if !is_faction_visible(connection, row.source_faction_id, view_branch)?
        || !is_faction_visible(connection, row.target_faction_id, view_branch)?
    {
        return Err(AppError::internal(
            "FACTION_RELATION_NOT_FOUND",
            "Faction relation not found",
        ));
    }

    Ok(map_relation(row))
}

fn get_faction_policy_by_id(
    connection: &Connection,
    faction_id: i32,
    id: i32,
) -> Result<FactionPolicy> {
    connection
        .query_row(
            r#"
            SELECT
                id,
                faction_id,
                title,
                type,
                status,
                category,
                enacted_date,
                description,
                sort_order,
                created_at,
                updated_at
            FROM faction_policies
            WHERE id = ?1 AND faction_id = ?2
            "#,
            params![id, faction_id],
            map_policy_row,
        )
        .optional()?
        .ok_or_else(|| AppError::internal("FACTION_POLICY_NOT_FOUND", "Faction policy not found"))
}

fn map_faction_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<FactionRow> {
    Ok(FactionRow {
        id: row.get("id")?,
        project_id: row.get("project_id")?,
        name: row.get("name")?,
        kind: row.get("kind")?,
        type_value: row.get("type")?,
        motto: row.get::<_, Option<String>>("motto")?.unwrap_or_default(),
        description: row
            .get::<_, Option<String>>("description")?
            .unwrap_or_default(),
        history: row.get::<_, Option<String>>("history")?.unwrap_or_default(),
        goals: row.get::<_, Option<String>>("goals")?.unwrap_or_default(),
        headquarters: row
            .get::<_, Option<String>>("headquarters")?
            .unwrap_or_default(),
        territory: row
            .get::<_, Option<String>>("territory")?
            .unwrap_or_default(),
        ruling_dynasty_id: row.get("ruling_dynasty_id")?,
        ruler_character_id: row.get("ruler_character_id")?,
        treasury: row.get("treasury")?,
        population: row.get("population")?,
        army_size: row.get("army_size")?,
        navy_size: row.get("navy_size")?,
        territory_km2: row.get("territory_km2")?,
        annual_income: row.get("annual_income")?,
        annual_expenses: row.get("annual_expenses")?,
        members_count: row.get("members_count")?,
        influence: row.get("influence")?,
        status: row.get("status")?,
        color: row.get::<_, Option<String>>("color")?.unwrap_or_default(),
        secondary_color: row
            .get::<_, Option<String>>("secondary_color")?
            .unwrap_or_default(),
        image_path: row
            .get::<_, Option<String>>("image_path")?
            .unwrap_or_default(),
        banner_path: row
            .get::<_, Option<String>>("banner_path")?
            .unwrap_or_default(),
        founded_date: row
            .get::<_, Option<String>>("founded_date")?
            .unwrap_or_default(),
        disbanded_date: row
            .get::<_, Option<String>>("disbanded_date")?
            .unwrap_or_default(),
        parent_faction_id: row.get("parent_faction_id")?,
        sort_order: row.get::<_, Option<i32>>("sort_order")?.unwrap_or(0),
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        created_branch_id: row.get("created_branch_id")?,
        parent_faction_name: row
            .get::<_, Option<String>>("parent_faction_name")
            .unwrap_or(None),
        ruling_dynasty_name: row
            .get::<_, Option<String>>("ruling_dynasty_name")
            .unwrap_or(None),
        ruler_name: row.get::<_, Option<String>>("ruler_name").unwrap_or(None),
    })
}

fn map_faction(row: FactionRow) -> Faction {
    Faction {
        id: row.id,
        project_id: row.project_id,
        name: row.name,
        kind: row.kind,
        r#type: row.type_value,
        motto: row.motto,
        description: row.description,
        history: row.history,
        goals: row.goals,
        headquarters: row.headquarters,
        territory: row.territory,
        ruling_dynasty_id: row.ruling_dynasty_id,
        ruler_character_id: row.ruler_character_id,
        treasury: row.treasury,
        population: row.population,
        army_size: row.army_size,
        navy_size: row.navy_size,
        territory_km2: row.territory_km2,
        annual_income: row.annual_income,
        annual_expenses: row.annual_expenses,
        members_count: row.members_count,
        influence: row.influence,
        status: row.status,
        color: row.color,
        secondary_color: row.secondary_color,
        image_path: row.image_path,
        banner_path: row.banner_path,
        founded_date: row.founded_date,
        disbanded_date: row.disbanded_date,
        parent_faction_id: row.parent_faction_id,
        sort_order: row.sort_order,
        created_at: row.created_at,
        updated_at: row.updated_at,
        tags: Vec::new(),
        custom_metrics: Vec::new(),
        ranks: Vec::new(),
        members: Vec::new(),
        member_count: 0,
        parent_faction: row.parent_faction_id.map(|id| IdNameRef {
            id,
            name: row.parent_faction_name.unwrap_or_default(),
        }),
        child_factions: Vec::new(),
        ruling_dynasty: row.ruling_dynasty_id.map(|id| IdNameRef {
            id,
            name: row
                .ruling_dynasty_name
                .as_deref()
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .unwrap_or("—")
                .to_string(),
        }),
        ruler: row.ruler_character_id.map(|id| IdNameRef {
            id,
            name: row
                .ruler_name
                .as_deref()
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .unwrap_or("—")
                .to_string(),
        }),
        territories: Vec::new(),
    }
}

fn map_member_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<FactionMemberRow> {
    Ok(FactionMemberRow {
        id: row.get("id")?,
        faction_id: row.get("faction_id")?,
        character_id: row.get("character_id")?,
        rank_id: row.get("rank_id")?,
        role: row.get::<_, Option<String>>("role")?.unwrap_or_default(),
        joined_date: row
            .get::<_, Option<String>>("joined_date")?
            .unwrap_or_default(),
        left_date: row
            .get::<_, Option<String>>("left_date")?
            .unwrap_or_default(),
        is_active: row.get::<_, Option<i32>>("is_active")?.unwrap_or(0),
        notes: row.get::<_, Option<String>>("notes")?.unwrap_or_default(),
        character_name: row
            .get::<_, Option<String>>("character_name")?
            .unwrap_or_default(),
        character_image_path: row
            .get::<_, Option<String>>("character_image_path")?
            .unwrap_or_default(),
        rank_name: row
            .get::<_, Option<String>>("rank_name")?
            .unwrap_or_default(),
        rank_level: row.get("rank_level")?,
    })
}

fn map_member(row: FactionMemberRow) -> FactionMember {
    FactionMember {
        id: row.id,
        faction_id: row.faction_id,
        character_id: row.character_id,
        rank_id: row.rank_id,
        role: row.role,
        joined_date: row.joined_date,
        left_date: row.left_date,
        is_active: row.is_active != 0,
        notes: row.notes,
        character_name: row.character_name,
        character_image_path: row.character_image_path,
        rank_name: row.rank_name,
        rank_level: row.rank_level,
    }
}

fn map_relation_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<FactionRelationRow> {
    Ok(FactionRelationRow {
        id: row.get("id")?,
        project_id: row.get("project_id")?,
        source_faction_id: row.get("source_faction_id")?,
        target_faction_id: row.get("target_faction_id")?,
        relation_type: row.get("relation_type")?,
        custom_label: row
            .get::<_, Option<String>>("custom_label")?
            .unwrap_or_default(),
        description: row
            .get::<_, Option<String>>("description")?
            .unwrap_or_default(),
        started_date: row
            .get::<_, Option<String>>("started_date")?
            .unwrap_or_default(),
        is_bidirectional: row.get::<_, Option<i32>>("is_bidirectional")?.unwrap_or(0),
        created_at: row.get("created_at")?,
        created_branch_id: row.get("created_branch_id")?,
        source_faction_name: row.get("source_faction_name")?,
        target_faction_name: row.get("target_faction_name")?,
    })
}

fn map_relation(row: FactionRelationRow) -> FactionRelation {
    FactionRelation {
        id: row.id,
        project_id: row.project_id,
        source_faction_id: row.source_faction_id,
        target_faction_id: row.target_faction_id,
        relation_type: row.relation_type,
        custom_label: row.custom_label,
        description: row.description,
        started_date: row.started_date,
        is_bidirectional: row.is_bidirectional != 0,
        created_at: row.created_at,
        source_faction_name: row.source_faction_name.unwrap_or_default(),
        target_faction_name: row.target_faction_name.unwrap_or_default(),
    }
}

fn map_policy_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<FactionPolicy> {
    Ok(FactionPolicy {
        id: row.get("id")?,
        faction_id: row.get("faction_id")?,
        title: row.get("title")?,
        r#type: row.get("type")?,
        status: row.get("status")?,
        category: row
            .get::<_, Option<String>>("category")?
            .unwrap_or_else(|| "other".to_string()),
        enacted_date: row.get("enacted_date")?,
        description: row
            .get::<_, Option<String>>("description")?
            .unwrap_or_default(),
        sort_order: row.get::<_, Option<i32>>("sort_order")?.unwrap_or(0),
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

fn attach_tags_and_member_counts(connection: &Connection, factions: &mut [Faction]) -> Result<()> {
    for faction in factions.iter_mut() {
        faction.tags = tag_associations::get_tags_for_entity(
            connection,
            &EntityTagsInput {
                project_id: faction.project_id,
                entity_type: "faction".to_string(),
                entity_id: faction.id,
            },
        )?;
        faction.member_count = connection
            .query_row(
                "SELECT COUNT(*) FROM faction_members WHERE faction_id = ?1 AND is_active = 1",
                params![faction.id],
                |row| row.get::<_, i32>(0),
            )
            .unwrap_or(0);
    }
    Ok(())
}

fn validate_metrics_by_kind<T>(kind: &str, input: &T) -> Result<()>
where
    T: MetricsCarrier,
{
    let allowed = match kind {
        "state" => HashSet::from([
            "treasury",
            "population",
            "army_size",
            "navy_size",
            "territory_km2",
            "annual_income",
            "annual_expenses",
        ]),
        "faction" => HashSet::from([
            "treasury",
            "members_count",
            "influence",
            "annual_income",
            "annual_expenses",
        ]),
        _ => {
            return Err(AppError::internal(
                "FACTION_KIND_INVALID",
                format!("Unsupported faction kind \"{kind}\""),
            ));
        }
    };

    for (name, value) in input.metric_values() {
        if value.is_some() && !allowed.contains(name) {
            return Err(AppError::internal(
                "FACTION_METRIC_KIND_MISMATCH",
                format!("Metric \"{name}\" is not allowed for kind \"{kind}\""),
            ));
        }
    }
    Ok(())
}

trait MetricsCarrier {
    fn metric_values(&self) -> Vec<(&'static str, Option<i32>)>;
}

impl MetricsCarrier for CreateFactionInput {
    fn metric_values(&self) -> Vec<(&'static str, Option<i32>)> {
        vec![
            ("treasury", self.treasury),
            ("population", self.population),
            ("army_size", self.army_size),
            ("navy_size", self.navy_size),
            ("territory_km2", self.territory_km2),
            ("annual_income", self.annual_income),
            ("annual_expenses", self.annual_expenses),
            ("members_count", self.members_count),
            ("influence", self.influence),
        ]
    }
}

impl MetricsCarrier for UpdateFactionInput {
    fn metric_values(&self) -> Vec<(&'static str, Option<i32>)> {
        vec![
            ("treasury", self.treasury.flatten()),
            ("population", self.population.flatten()),
            ("army_size", self.army_size.flatten()),
            ("navy_size", self.navy_size.flatten()),
            ("territory_km2", self.territory_km2.flatten()),
            ("annual_income", self.annual_income.flatten()),
            ("annual_expenses", self.annual_expenses.flatten()),
            ("members_count", self.members_count.flatten()),
            ("influence", self.influence.flatten()),
        ]
    }
}

fn validate_state_relations_input(
    connection: &Connection,
    project_id: i32,
    ruling_dynasty_id: Option<i32>,
    ruler_character_id: Option<i32>,
) -> Result<()> {
    if let Some(dynasty_id) = ruling_dynasty_id {
        let exists = connection
            .query_row(
                "SELECT id FROM dynasties WHERE id = ?1 AND project_id = ?2",
                params![dynasty_id, project_id],
                |row| row.get::<_, i32>(0),
            )
            .optional()?
            .is_some();
        if !exists {
            return Err(AppError::internal(
                "FACTION_DYNASTY_NOT_FOUND",
                "Dynasty not found in this project",
            ));
        }
    }
    if let Some(character_id) = ruler_character_id {
        let exists = connection
            .query_row(
                "SELECT id FROM characters WHERE id = ?1 AND project_id = ?2",
                params![character_id, project_id],
                |row| row.get::<_, i32>(0),
            )
            .optional()?
            .is_some();
        if !exists {
            return Err(AppError::internal(
                "FACTION_RULER_NOT_FOUND",
                "Character not found in this project",
            ));
        }
    }
    Ok(())
}

fn sync_state_territories(
    connection: &Connection,
    project_id: i32,
    state_id: i32,
    territory_ids: &[i32],
) -> Result<()> {
    let next_ids = dedupe_positive_ids(territory_ids);
    for territory_id in &next_ids {
        let exists = connection
            .query_row(
                r#"
                SELECT mt.id
                FROM map_territories mt
                JOIN maps m ON m.id = mt.map_id
                WHERE mt.id = ?1 AND m.project_id = ?2
                "#,
                params![territory_id, project_id],
                |row| row.get::<_, i32>(0),
            )
            .optional()?
            .is_some();
        if !exists {
            return Err(AppError::internal(
                "FACTION_TERRITORY_NOT_FOUND",
                format!("Territory {territory_id} not found in this project"),
            ));
        }
    }

    let previous_ids = {
        let mut statement = connection.prepare(
            r#"
            SELECT mt.id
            FROM map_territories mt
            JOIN maps m ON m.id = mt.map_id
            WHERE m.project_id = ?1 AND mt.faction_id = ?2
            "#,
        )?;
        let rows =
            statement.query_map(params![project_id, state_id], |row| row.get::<_, i32>(0))?;
        rows.collect::<std::result::Result<Vec<_>, _>>()?
    };

    for id in previous_ids.iter().filter(|id| !next_ids.contains(id)) {
        connection.execute(
            "UPDATE map_territories SET faction_id = NULL, updated_at = datetime('now') WHERE id = ?1",
            params![id],
        )?;
    }

    let colors = connection
        .query_row(
            "SELECT color, secondary_color FROM factions WHERE id = ?1",
            params![state_id],
            |row| {
                Ok((
                    row.get::<_, Option<String>>(0)?,
                    row.get::<_, Option<String>>(1)?,
                ))
            },
        )
        .optional()?
        .unwrap_or((None, None));
    let fill_color = colors
        .0
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or("#4ECDC4")
        .to_string();
    let border_color = colors
        .1
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or(fill_color.as_str())
        .to_string();

    for id in &next_ids {
        connection.execute(
            r#"
            UPDATE map_territories
            SET
              faction_id = ?1,
              color = CASE WHEN COALESCE(faction_id, -1) != ?1 THEN ?2 ELSE color END,
              border_color = CASE WHEN COALESCE(faction_id, -1) != ?1 THEN ?3 ELSE border_color END,
              updated_at = datetime('now')
            WHERE id = ?4
            "#,
            params![state_id, fill_color, border_color, id],
        )?;
    }
    Ok(())
}

fn ensure_character_exists_for_project(connection: &Connection, character_id: i32) -> Result<()> {
    let exists = connection
        .query_row(
            "SELECT id FROM characters WHERE id = ?1",
            params![character_id],
            |row| row.get::<_, i32>(0),
        )
        .optional()?
        .is_some();
    if !exists {
        return Err(AppError::internal(
            "CHARACTER_NOT_FOUND",
            "Character not found",
        ));
    }
    Ok(())
}

fn get_lowest_rank_id_for_faction(connection: &Connection, faction_id: i32) -> Result<Option<i32>> {
    connection
        .query_row(
            r#"
            SELECT id
            FROM faction_ranks
            WHERE faction_id = ?1
            ORDER BY level ASC, id ASC
            LIMIT 1
            "#,
            params![faction_id],
            |row| row.get::<_, i32>(0),
        )
        .optional()
        .map_err(Into::into)
}

fn normalize_kind(value: &str) -> Result<String> {
    match value {
        "state" => Ok("state".to_string()),
        "faction" => Ok("faction".to_string()),
        _ => Err(AppError::internal(
            "FACTION_KIND_INVALID",
            format!("Unsupported faction kind \"{value}\""),
        )),
    }
}

fn is_faction_visible(
    connection: &Connection,
    faction_id: i32,
    branch_id: Option<i32>,
) -> Result<bool> {
    let row = connection
        .query_row(
            "SELECT project_id, created_branch_id, created_at FROM factions WHERE id = ?1",
            params![faction_id],
            |row| {
                Ok((
                    row.get::<_, i32>(0)?,
                    row.get::<_, Option<i32>>(1)?,
                    row.get::<_, String>(2)?,
                ))
            },
        )
        .optional()?;

    let Some((project_id, created_branch_id, created_at)) = row else {
        return Ok(false);
    };
    branch_scope::is_entity_visible_in_branch(
        connection,
        project_id,
        branch_id,
        created_branch_id,
        Some(created_at.as_str()),
    )
}

fn dedupe_positive_ids(ids: &[i32]) -> Vec<i32> {
    let mut result = Vec::new();
    for id in ids {
        if *id > 0 && !result.contains(id) {
            result.push(*id);
        }
    }
    result
}

fn dedupe_non_empty_strings(values: &[String]) -> Vec<String> {
    let mut result = Vec::new();
    for value in values {
        let trimmed = value.trim();
        if !trimmed.is_empty() && !result.iter().any(|existing| existing == trimmed) {
            result.push(trimmed.to_string());
        }
    }
    result
}

fn make_placeholders(count: usize) -> String {
    std::iter::repeat_n("?", count)
        .collect::<Vec<_>>()
        .join(", ")
}

fn is_metric_applicable_for_kind(metric_key: &str, kind: &str) -> bool {
    match metric_key {
        "population" | "army_size" | "navy_size" | "territory_km2" => kind == "state",
        "members_count" | "influence" => kind == "faction",
        _ => true,
    }
}

fn metric_unit_for_key(metric_key: &str) -> Option<String> {
    match metric_key {
        "population" | "army_size" | "navy_size" | "members_count" => Some("чел.".to_string()),
        "territory_km2" => Some("кв. км".to_string()),
        _ => None,
    }
}

pub fn update_faction_image_path(connection: &Connection, id: i32, image_path: &str) -> Result<()> {
    let updated = connection.execute(
        "UPDATE factions SET image_path = ?1, updated_at = datetime('now') WHERE id = ?2",
        params![image_path, id],
    )?;

    if updated == 0 {
        return Err(AppError::internal("FACTION_NOT_FOUND", "Faction not found"));
    }

    Ok(())
}

pub fn update_faction_banner_path(
    connection: &Connection,
    id: i32,
    banner_path: &str,
) -> Result<()> {
    let updated = connection.execute(
        "UPDATE factions SET banner_path = ?1, updated_at = datetime('now') WHERE id = ?2",
        params![banner_path, id],
    )?;

    if updated == 0 {
        return Err(AppError::internal("FACTION_NOT_FOUND", "Faction not found"));
    }

    Ok(())
}
