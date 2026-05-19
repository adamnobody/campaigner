use tauri::State;

use crate::db::connection::DatabaseState;
use crate::error::{AppError, Result};
use crate::models::dynasty::{
    AddDynastyEventInput, AddDynastyFamilyLinkInput, AddDynastyMemberInput, CreateDynastyInput,
    DeleteDynastyEventInput, DeleteDynastyFamilyLinkInput, DeleteDynastyInput, DynastiesListInput,
    DynastiesListResult, Dynasty, DynastyEvent, DynastyFamilyLink, DynastyMember, GetDynastyInput,
    RemoveDynastyMemberInput, ReorderDynastyEventsInput, SaveDynastyGraphPositionsInput,
    SetDynastyTagsInput, UpdateDynastyEventInput, UpdateDynastyInput, UpdateDynastyMemberInput,
};
use crate::repositories::dynasties;

#[tauri::command(rename = "dynasties_list")]
pub fn dynasties_list_command(
    state: State<'_, DatabaseState>,
    input: DynastiesListInput,
) -> Result<DynastiesListResult> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    dynasties::list_dynasties(&connection, &input)
}

#[tauri::command(rename = "dynasties_get")]
pub fn dynasties_get_command(
    state: State<'_, DatabaseState>,
    input: GetDynastyInput,
) -> Result<Dynasty> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    dynasties::get_dynasty_by_id(&connection, &input)
}

#[tauri::command(rename = "dynasties_create")]
pub fn dynasties_create_command(
    state: State<'_, DatabaseState>,
    input: CreateDynastyInput,
) -> Result<Dynasty> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    dynasties::create_dynasty(&connection, &input)
}

#[tauri::command(rename = "dynasties_update")]
pub fn dynasties_update_command(
    state: State<'_, DatabaseState>,
    input: UpdateDynastyInput,
) -> Result<Dynasty> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    dynasties::update_dynasty(&connection, &input)
}

#[tauri::command(rename = "dynasties_delete")]
pub fn dynasties_delete_command(
    state: State<'_, DatabaseState>,
    input: DeleteDynastyInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    dynasties::delete_dynasty(&connection, &input)
}

#[tauri::command(rename = "dynasties_set_tags")]
pub fn dynasties_set_tags_command(
    state: State<'_, DatabaseState>,
    input: SetDynastyTagsInput,
) -> Result<Dynasty> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    dynasties::set_dynasty_tags(&connection, &input)
}

#[tauri::command(rename = "dynasties_add_member")]
pub fn dynasties_add_member_command(
    state: State<'_, DatabaseState>,
    input: AddDynastyMemberInput,
) -> Result<DynastyMember> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    dynasties::add_dynasty_member(&connection, &input)
}

#[tauri::command(rename = "dynasties_update_member")]
pub fn dynasties_update_member_command(
    state: State<'_, DatabaseState>,
    input: UpdateDynastyMemberInput,
) -> Result<DynastyMember> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    dynasties::update_dynasty_member(&connection, &input)
}

#[tauri::command(rename = "dynasties_remove_member")]
pub fn dynasties_remove_member_command(
    state: State<'_, DatabaseState>,
    input: RemoveDynastyMemberInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    dynasties::remove_dynasty_member(&connection, &input)
}

#[tauri::command(rename = "dynasties_save_graph_positions")]
pub fn dynasties_save_graph_positions_command(
    state: State<'_, DatabaseState>,
    input: SaveDynastyGraphPositionsInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    dynasties::save_dynasty_graph_positions(&connection, &input)
}

#[tauri::command(rename = "dynasties_add_family_link")]
pub fn dynasties_add_family_link_command(
    state: State<'_, DatabaseState>,
    input: AddDynastyFamilyLinkInput,
) -> Result<DynastyFamilyLink> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    dynasties::add_dynasty_family_link(&connection, &input)
}

#[tauri::command(rename = "dynasties_delete_family_link")]
pub fn dynasties_delete_family_link_command(
    state: State<'_, DatabaseState>,
    input: DeleteDynastyFamilyLinkInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    dynasties::delete_dynasty_family_link(&connection, &input)
}

#[tauri::command(rename = "dynasties_add_event")]
pub fn dynasties_add_event_command(
    state: State<'_, DatabaseState>,
    input: AddDynastyEventInput,
) -> Result<DynastyEvent> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    dynasties::add_dynasty_event(&connection, &input)
}

#[tauri::command(rename = "dynasties_update_event")]
pub fn dynasties_update_event_command(
    state: State<'_, DatabaseState>,
    input: UpdateDynastyEventInput,
) -> Result<DynastyEvent> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    dynasties::update_dynasty_event(&connection, &input)
}

#[tauri::command(rename = "dynasties_delete_event")]
pub fn dynasties_delete_event_command(
    state: State<'_, DatabaseState>,
    input: DeleteDynastyEventInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    dynasties::delete_dynasty_event(&connection, &input)
}

#[tauri::command(rename = "dynasties_reorder_events")]
pub fn dynasties_reorder_events_command(
    state: State<'_, DatabaseState>,
    input: ReorderDynastyEventsInput,
) -> Result<Dynasty> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    dynasties::reorder_dynasty_events(&connection, &input)
}
