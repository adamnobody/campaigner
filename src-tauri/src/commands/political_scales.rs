use tauri::State;

use crate::db::connection::DatabaseState;
use crate::error::{AppError, Result};
use crate::models::political_scale::{
    CreatePoliticalScaleInput, DeletePoliticalScaleAssignmentInput, DeletePoliticalScaleInput,
    ListPoliticalScaleAssignmentsInput, ListPoliticalScalesInput, PoliticalScale,
    PoliticalScaleAssignment, ReplacePoliticalScaleAssignmentsInput, UpdatePoliticalScaleInput,
};
use crate::repositories::political_scales;

#[tauri::command(rename = "political_scales_list")]
pub fn political_scales_list_command(
    state: State<'_, DatabaseState>,
    input: ListPoliticalScalesInput,
) -> Result<Vec<PoliticalScale>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    political_scales::list_scales(&connection, &input)
}

#[tauri::command(rename = "political_scales_create")]
pub fn political_scales_create_command(
    state: State<'_, DatabaseState>,
    input: CreatePoliticalScaleInput,
) -> Result<PoliticalScale> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    political_scales::create_scale(&connection, &input)
}

#[tauri::command(rename = "political_scales_update")]
pub fn political_scales_update_command(
    state: State<'_, DatabaseState>,
    input: UpdatePoliticalScaleInput,
) -> Result<PoliticalScale> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    political_scales::update_scale(&connection, &input)
}

#[tauri::command(rename = "political_scales_delete")]
pub fn political_scales_delete_command(
    state: State<'_, DatabaseState>,
    input: DeletePoliticalScaleInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    political_scales::delete_scale(&connection, &input)
}

#[tauri::command(rename = "political_scale_assignments_list")]
pub fn political_scale_assignments_list_command(
    state: State<'_, DatabaseState>,
    input: ListPoliticalScaleAssignmentsInput,
) -> Result<Vec<PoliticalScaleAssignment>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    political_scales::list_assignments(&connection, &input)
}

#[tauri::command(rename = "political_scale_assignments_replace")]
pub fn political_scale_assignments_replace_command(
    state: State<'_, DatabaseState>,
    input: ReplacePoliticalScaleAssignmentsInput,
) -> Result<Vec<PoliticalScaleAssignment>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    political_scales::replace_assignments(&connection, &input)
}

#[tauri::command(rename = "political_scale_assignments_delete")]
pub fn political_scale_assignments_delete_command(
    state: State<'_, DatabaseState>,
    input: DeletePoliticalScaleAssignmentInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    political_scales::delete_assignment(&connection, &input)
}
