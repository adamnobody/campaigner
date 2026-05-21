use tauri::{AppHandle, State};

use crate::db::connection::DatabaseState;
use crate::db::legacy_migration;
use crate::error::{AppError, Result};
use crate::models::legacy_migration::{LegacyMigrationPreview, LegacyMigrationReport};

#[tauri::command(rename = "check_legacy_migration_available")]
pub fn check_legacy_migration_available_command(
    app: AppHandle,
    state: State<'_, DatabaseState>,
) -> Result<Option<LegacyMigrationPreview>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    legacy_migration::check_legacy_migration_available(&app, &connection)
}

#[tauri::command(rename = "run_legacy_migration")]
pub fn run_legacy_migration_command(
    app: AppHandle,
    state: State<'_, DatabaseState>,
) -> Result<LegacyMigrationReport> {
    let _connection_guard = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    legacy_migration::run_legacy_migration(&app)
}

#[tauri::command(rename = "skip_legacy_migration")]
pub fn skip_legacy_migration_command(state: State<'_, DatabaseState>) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    legacy_migration::skip_legacy_migration(&connection)
}

// Ask-later is intentionally frontend-only: closing the dialog leaves the marker untouched,
// so the next launch can offer the import again without a backend side effect.
