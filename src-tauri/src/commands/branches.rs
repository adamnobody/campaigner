use tauri::State;

use crate::db::connection::DatabaseState;
use crate::error::{AppError, Result};
use crate::models::branch::{
    CreateBranchInput, DeleteBranchInput, ListBranchesInput, ScenarioBranch, UpdateBranchInput,
};
use crate::repositories::branches;

#[tauri::command(rename = "branches_list")]
pub fn branches_list_command(
    state: State<'_, DatabaseState>,
    input: ListBranchesInput,
) -> Result<Vec<ScenarioBranch>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    branches::list_branches(&connection, &input)
}

#[tauri::command(rename = "branches_create")]
pub fn branches_create_command(
    state: State<'_, DatabaseState>,
    input: CreateBranchInput,
) -> Result<ScenarioBranch> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    branches::create_branch(&connection, &input)
}

#[tauri::command(rename = "branches_update")]
pub fn branches_update_command(
    state: State<'_, DatabaseState>,
    input: UpdateBranchInput,
) -> Result<ScenarioBranch> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    branches::update_branch(&connection, &input)
}

#[tauri::command(rename = "branches_delete")]
pub fn branches_delete_command(
    state: State<'_, DatabaseState>,
    input: DeleteBranchInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    branches::delete_branch(&connection, &input)
}
