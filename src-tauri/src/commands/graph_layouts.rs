use tauri::State;

use crate::db::connection::DatabaseState;
use crate::error::{AppError, Result};
use crate::models::graph_layout::{
    DeleteGraphLayoutInput, GetGraphLayoutInput, GraphLayoutResponse, UpsertGraphLayoutInput,
};
use crate::repositories::graph_layouts;

#[tauri::command(rename = "graph_layout_get")]
pub fn graph_layout_get_command(
    state: State<'_, DatabaseState>,
    input: GetGraphLayoutInput,
) -> Result<GraphLayoutResponse> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    graph_layouts::get_parsed(&connection, &input)
}

#[tauri::command(rename = "graph_layout_upsert")]
pub fn graph_layout_upsert_command(
    state: State<'_, DatabaseState>,
    input: UpsertGraphLayoutInput,
) -> Result<GraphLayoutResponse> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    graph_layouts::upsert(&connection, &input)
}

#[tauri::command(rename = "graph_layout_delete")]
pub fn graph_layout_delete_command(
    state: State<'_, DatabaseState>,
    input: DeleteGraphLayoutInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    graph_layouts::delete(&connection, &input)
}
