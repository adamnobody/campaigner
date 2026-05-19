use tauri::State;

use crate::db::connection::DatabaseState;
use crate::error::{AppError, Result};
use crate::models::faction::{
    CompareFactionsInput, CreateFactionInput, CreateFactionMemberInput, CreateFactionPolicyInput,
    CreateFactionRankInput, CreateFactionRelationInput, DeleteFactionInput,
    DeleteFactionMemberInput, DeleteFactionPolicyInput, DeleteFactionRankInput,
    DeleteFactionRelationInput, Faction, FactionCompareResult, FactionCustomMetric, FactionGraph,
    FactionMember, FactionPolicy, FactionRank, FactionRelation, FactionsListInput,
    FactionsListResult, FactionsRelationsListInput, GetFactionInput, ListFactionMembersInput,
    ListFactionPoliciesInput, ListFactionRanksInput, ReplaceFactionCustomMetricsInput,
    SetFactionTagsInput, UpdateFactionInput, UpdateFactionMemberInput, UpdateFactionPolicyInput,
    UpdateFactionRankInput, UpdateFactionRelationInput,
};
use crate::models::tag::Tag;
use crate::repositories::factions;

#[tauri::command(rename = "factions_list")]
pub fn factions_list_command(
    state: State<'_, DatabaseState>,
    input: FactionsListInput,
) -> Result<FactionsListResult> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    factions::list_factions(&connection, &input)
}

#[tauri::command(rename = "factions_get")]
pub fn factions_get_command(
    state: State<'_, DatabaseState>,
    input: GetFactionInput,
) -> Result<Faction> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    factions::get_faction_by_id(&connection, &input)
}

#[tauri::command(rename = "factions_create")]
pub fn factions_create_command(
    state: State<'_, DatabaseState>,
    input: CreateFactionInput,
) -> Result<Faction> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    factions::create_faction(&connection, &input)
}

#[tauri::command(rename = "factions_update")]
pub fn factions_update_command(
    state: State<'_, DatabaseState>,
    input: UpdateFactionInput,
) -> Result<Faction> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    factions::update_faction(&connection, &input)
}

#[tauri::command(rename = "factions_delete")]
pub fn factions_delete_command(
    state: State<'_, DatabaseState>,
    input: DeleteFactionInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    factions::delete_faction(&connection, &input)
}

#[tauri::command(rename = "factions_set_tags")]
pub fn factions_set_tags_command(
    state: State<'_, DatabaseState>,
    input: SetFactionTagsInput,
) -> Result<Vec<Tag>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    factions::set_faction_tags(&connection, &input)
}

#[tauri::command(rename = "factions_ranks_list")]
pub fn factions_ranks_list_command(
    state: State<'_, DatabaseState>,
    input: ListFactionRanksInput,
) -> Result<Vec<FactionRank>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    factions::list_faction_ranks(&connection, &input)
}

#[tauri::command(rename = "factions_ranks_create")]
pub fn factions_ranks_create_command(
    state: State<'_, DatabaseState>,
    input: CreateFactionRankInput,
) -> Result<FactionRank> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    factions::create_faction_rank(&connection, &input)
}

#[tauri::command(rename = "factions_ranks_update")]
pub fn factions_ranks_update_command(
    state: State<'_, DatabaseState>,
    input: UpdateFactionRankInput,
) -> Result<FactionRank> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    factions::update_faction_rank(&connection, &input)
}

#[tauri::command(rename = "factions_ranks_delete")]
pub fn factions_ranks_delete_command(
    state: State<'_, DatabaseState>,
    input: DeleteFactionRankInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    factions::delete_faction_rank(&connection, &input)
}

#[tauri::command(rename = "factions_members_list")]
pub fn factions_members_list_command(
    state: State<'_, DatabaseState>,
    input: ListFactionMembersInput,
) -> Result<Vec<FactionMember>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    factions::list_faction_members(&connection, &input)
}

#[tauri::command(rename = "factions_members_create")]
pub fn factions_members_create_command(
    state: State<'_, DatabaseState>,
    input: CreateFactionMemberInput,
) -> Result<FactionMember> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    factions::create_faction_member(&connection, &input)
}

#[tauri::command(rename = "factions_members_update")]
pub fn factions_members_update_command(
    state: State<'_, DatabaseState>,
    input: UpdateFactionMemberInput,
) -> Result<FactionMember> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    factions::update_faction_member(&connection, &input)
}

#[tauri::command(rename = "factions_members_delete")]
pub fn factions_members_delete_command(
    state: State<'_, DatabaseState>,
    input: DeleteFactionMemberInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    factions::delete_faction_member(&connection, &input)
}

#[tauri::command(rename = "factions_custom_metrics_replace")]
pub fn factions_custom_metrics_replace_command(
    state: State<'_, DatabaseState>,
    input: ReplaceFactionCustomMetricsInput,
) -> Result<Vec<FactionCustomMetric>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    factions::replace_custom_metrics(&connection, &input)
}

#[tauri::command(rename = "factions_compare")]
pub fn factions_compare_command(
    state: State<'_, DatabaseState>,
    input: CompareFactionsInput,
) -> Result<FactionCompareResult> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    factions::compare_factions(&connection, &input)
}

#[tauri::command(rename = "factions_relations_list")]
pub fn factions_relations_list_command(
    state: State<'_, DatabaseState>,
    input: FactionsRelationsListInput,
) -> Result<Vec<FactionRelation>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    factions::list_faction_relations(&connection, &input)
}

#[tauri::command(rename = "factions_relations_create")]
pub fn factions_relations_create_command(
    state: State<'_, DatabaseState>,
    input: CreateFactionRelationInput,
) -> Result<FactionRelation> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    factions::create_faction_relation(&connection, &input)
}

#[tauri::command(rename = "factions_relations_update")]
pub fn factions_relations_update_command(
    state: State<'_, DatabaseState>,
    input: UpdateFactionRelationInput,
) -> Result<FactionRelation> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    factions::update_faction_relation(&connection, &input)
}

#[tauri::command(rename = "factions_relations_delete")]
pub fn factions_relations_delete_command(
    state: State<'_, DatabaseState>,
    input: DeleteFactionRelationInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    factions::delete_faction_relation(&connection, &input)
}

#[tauri::command(rename = "factions_graph")]
pub fn factions_graph_command(
    state: State<'_, DatabaseState>,
    input: FactionsRelationsListInput,
) -> Result<FactionGraph> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    factions::get_faction_graph(&connection, &input)
}

#[tauri::command(rename = "factions_policies_list")]
pub fn factions_policies_list_command(
    state: State<'_, DatabaseState>,
    input: ListFactionPoliciesInput,
) -> Result<Vec<FactionPolicy>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    factions::list_faction_policies(&connection, &input)
}

#[tauri::command(rename = "factions_policies_create")]
pub fn factions_policies_create_command(
    state: State<'_, DatabaseState>,
    input: CreateFactionPolicyInput,
) -> Result<FactionPolicy> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    factions::create_faction_policy(&connection, &input)
}

#[tauri::command(rename = "factions_policies_update")]
pub fn factions_policies_update_command(
    state: State<'_, DatabaseState>,
    input: UpdateFactionPolicyInput,
) -> Result<FactionPolicy> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    factions::update_faction_policy(&connection, &input)
}

#[tauri::command(rename = "factions_policies_delete")]
pub fn factions_policies_delete_command(
    state: State<'_, DatabaseState>,
    input: DeleteFactionPolicyInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    factions::delete_faction_policy(&connection, &input)
}
