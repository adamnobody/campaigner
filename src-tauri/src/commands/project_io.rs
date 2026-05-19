use tauri::{AppHandle, State};

use crate::db::connection::DatabaseState;
use crate::error::{AppError, Result};
use crate::models::project::Project;
use crate::models::project_io::{ImportProjectInput, ImportedProjectPayload};
use crate::repositories::project_io;

#[tauri::command(rename = "projects_export")]
pub fn projects_export_command(
    app: AppHandle,
    state: State<'_, DatabaseState>,
    project_id: i32,
) -> Result<ImportedProjectPayload> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    project_io::export_project(&app, &connection, project_id)
}

#[tauri::command(rename = "projects_import")]
pub fn projects_import_command(
    app: AppHandle,
    state: State<'_, DatabaseState>,
    input: ImportProjectInput,
) -> Result<Project> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    let locale = input.locale.as_deref().unwrap_or("en");
    project_io::import_project(
        &app,
        &connection,
        &input.payload,
        locale,
        input.append_import_name_suffix,
    )
}
