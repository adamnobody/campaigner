use tauri::State;

use crate::db::connection::DatabaseState;
use crate::error::{AppError, Result};
use crate::models::search::{SearchQueryInput, SearchResult};
use crate::repositories::search;

#[tauri::command(rename = "search_query")]
pub fn search_query_command(
    state: State<'_, DatabaseState>,
    input: SearchQueryInput,
) -> Result<Vec<SearchResult>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    search::search_query(&connection, &input)
}
