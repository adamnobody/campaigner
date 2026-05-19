use tauri::State;

use crate::db::connection::DatabaseState;
use crate::error::{AppError, Result};
use crate::models::ambition::{
    Ambition, AssignFactionAmbitionInput, CreateAmbitionInput, DeleteAmbitionInput,
    GetAmbitionsCatalogInput, GetFactionAmbitionsInput, UnassignFactionAmbitionInput,
    UpdateAmbitionExclusionsInput, UpdateAmbitionInput,
};
use crate::repositories::ambitions;

#[tauri::command(rename = "ambitions_get_catalog")]
pub fn ambitions_get_catalog_command(
    state: State<'_, DatabaseState>,
    input: GetAmbitionsCatalogInput,
) -> Result<Vec<Ambition>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    ambitions::get_catalog(&connection, &input)
}

#[tauri::command(rename = "ambitions_create")]
pub fn ambitions_create_command(
    state: State<'_, DatabaseState>,
    input: CreateAmbitionInput,
) -> Result<Ambition> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    ambitions::create_ambition(&connection, &input)
}

#[tauri::command(rename = "ambitions_update")]
pub fn ambitions_update_command(
    state: State<'_, DatabaseState>,
    input: UpdateAmbitionInput,
) -> Result<Ambition> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    ambitions::update_ambition(&connection, &input)
}

#[tauri::command(rename = "ambitions_update_exclusions")]
pub fn ambitions_update_exclusions_command(
    state: State<'_, DatabaseState>,
    input: UpdateAmbitionExclusionsInput,
) -> Result<Ambition> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    ambitions::update_exclusions(&connection, &input)
}

#[tauri::command(rename = "ambitions_delete")]
pub fn ambitions_delete_command(
    state: State<'_, DatabaseState>,
    input: DeleteAmbitionInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    ambitions::delete_ambition(&connection, &input)
}

#[tauri::command(rename = "ambitions_get_faction_ambitions")]
pub fn ambitions_get_faction_ambitions_command(
    state: State<'_, DatabaseState>,
    input: GetFactionAmbitionsInput,
) -> Result<Vec<Ambition>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    ambitions::get_faction_ambitions(&connection, &input)
}

#[tauri::command(rename = "ambitions_assign_faction_ambition")]
pub fn ambitions_assign_faction_ambition_command(
    state: State<'_, DatabaseState>,
    input: AssignFactionAmbitionInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    ambitions::assign_faction_ambition(&connection, &input)
}

#[tauri::command(rename = "ambitions_unassign_faction_ambition")]
pub fn ambitions_unassign_faction_ambition_command(
    state: State<'_, DatabaseState>,
    input: UnassignFactionAmbitionInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    ambitions::unassign_faction_ambition(&connection, &input)
}
