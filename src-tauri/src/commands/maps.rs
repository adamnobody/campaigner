use tauri::State;

use crate::db::connection::DatabaseState;
use crate::error::{AppError, Result};
use crate::models::map::{
    CreateMapInput, CreateMapMarkerInput, CreateMapTerritoryInput, DeleteMapInput,
    DeleteMapMarkerInput, DeleteMapTerritoryInput, GetMapInput, GetMapTreeInput, GetRootMapInput,
    ListMapMarkersInput, ListMapTerritoriesInput, ListTerritorySummariesInput, MapMarker,
    MapRecord, MapTerritory, MapTerritorySummary, UpdateMapInput, UpdateMapMarkerInput,
    UpdateMapTerritoryInput,
};
use crate::repositories::maps;

#[tauri::command(rename = "maps_get_root")]
pub fn maps_get_root_command(
    state: State<'_, DatabaseState>,
    input: GetRootMapInput,
) -> Result<Option<MapRecord>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    maps::get_root_map(&connection, &input)
}

#[tauri::command(rename = "maps_get_tree")]
pub fn maps_get_tree_command(
    state: State<'_, DatabaseState>,
    input: GetMapTreeInput,
) -> Result<Vec<MapRecord>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    maps::get_map_tree(&connection, &input)
}

#[tauri::command(rename = "maps_get")]
pub fn maps_get_command(state: State<'_, DatabaseState>, input: GetMapInput) -> Result<MapRecord> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    maps::get_map_by_id(&connection, &input)
}

#[tauri::command(rename = "maps_create")]
pub fn maps_create_command(
    state: State<'_, DatabaseState>,
    input: CreateMapInput,
) -> Result<MapRecord> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    maps::create_map(&connection, &input)
}

#[tauri::command(rename = "maps_update")]
pub fn maps_update_command(
    state: State<'_, DatabaseState>,
    input: UpdateMapInput,
) -> Result<MapRecord> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    maps::update_map(&connection, &input)
}

#[tauri::command(rename = "maps_delete")]
pub fn maps_delete_command(state: State<'_, DatabaseState>, input: DeleteMapInput) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    maps::delete_map(&connection, &input)
}

#[tauri::command(rename = "maps_markers_list")]
pub fn maps_markers_list_command(
    state: State<'_, DatabaseState>,
    input: ListMapMarkersInput,
) -> Result<Vec<MapMarker>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    maps::list_map_markers(&connection, &input)
}

#[tauri::command(rename = "maps_markers_create")]
pub fn maps_markers_create_command(
    state: State<'_, DatabaseState>,
    input: CreateMapMarkerInput,
) -> Result<MapMarker> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    maps::create_map_marker(&connection, &input)
}

#[tauri::command(rename = "maps_markers_update")]
pub fn maps_markers_update_command(
    state: State<'_, DatabaseState>,
    input: UpdateMapMarkerInput,
) -> Result<MapMarker> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    maps::update_map_marker(&connection, &input)
}

#[tauri::command(rename = "maps_markers_delete")]
pub fn maps_markers_delete_command(
    state: State<'_, DatabaseState>,
    input: DeleteMapMarkerInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    maps::delete_map_marker(&connection, &input)
}

#[tauri::command(rename = "maps_territories_list")]
pub fn maps_territories_list_command(
    state: State<'_, DatabaseState>,
    input: ListMapTerritoriesInput,
) -> Result<Vec<MapTerritory>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    maps::list_map_territories(&connection, &input)
}

#[tauri::command(rename = "maps_territories_create")]
pub fn maps_territories_create_command(
    state: State<'_, DatabaseState>,
    input: CreateMapTerritoryInput,
) -> Result<MapTerritory> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    maps::create_map_territory(&connection, &input)
}

#[tauri::command(rename = "maps_territories_update")]
pub fn maps_territories_update_command(
    state: State<'_, DatabaseState>,
    input: UpdateMapTerritoryInput,
) -> Result<MapTerritory> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    maps::update_map_territory(&connection, &input)
}

#[tauri::command(rename = "maps_territories_delete")]
pub fn maps_territories_delete_command(
    state: State<'_, DatabaseState>,
    input: DeleteMapTerritoryInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    maps::delete_map_territory(&connection, &input)
}

#[tauri::command(rename = "maps_territory_summaries_list")]
pub fn maps_territory_summaries_list_command(
    state: State<'_, DatabaseState>,
    input: ListTerritorySummariesInput,
) -> Result<Vec<MapTerritorySummary>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    maps::list_territory_summaries(&connection, &input)
}
