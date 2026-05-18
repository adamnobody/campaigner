use tauri::State;

use crate::db::connection::DatabaseState;
use crate::error::{AppError, Result};
use crate::models::app::AppHealthResponse;

#[tauri::command]
pub fn app_health(state: State<'_, DatabaseState>) -> Result<AppHealthResponse> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    connection.query_row("SELECT 1", [], |_| Ok(()))?;

    Ok(AppHealthResponse {
        status: "ok".to_string(),
        database: "ok".to_string(),
        app_version: env!("CARGO_PKG_VERSION").to_string(),
    })
}
