use tauri::State;

use crate::db::connection::DatabaseState;
use crate::error::{AppError, Result};
use crate::models::project::{
    CreateProjectInput, DeleteProjectInput, GetProjectInput, Project, UpdateProjectInput,
};
use crate::repositories::projects;

#[tauri::command(rename = "projects_list")]
pub fn projects_list_command(state: State<'_, DatabaseState>) -> Result<Vec<Project>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    projects::list_projects(&connection)
}

#[tauri::command(rename = "projects_get")]
pub fn projects_get_command(
    state: State<'_, DatabaseState>,
    input: GetProjectInput,
) -> Result<Project> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    projects::get_project(&connection, &input)
}

#[tauri::command(rename = "projects_create")]
pub fn projects_create_command(
    state: State<'_, DatabaseState>,
    input: CreateProjectInput,
) -> Result<Project> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    projects::create_project(&connection, &input)
}

#[tauri::command(rename = "projects_update")]
pub fn projects_update_command(
    state: State<'_, DatabaseState>,
    input: UpdateProjectInput,
) -> Result<Project> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    projects::update_project(&connection, &input)
}

#[tauri::command(rename = "projects_delete")]
pub fn projects_delete_command(
    state: State<'_, DatabaseState>,
    input: DeleteProjectInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    projects::delete_project(&connection, &input)
}
