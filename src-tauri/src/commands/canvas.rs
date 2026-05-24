use tauri::State;

use crate::db::connection::DatabaseState;
use crate::error::{AppError, Result};
use crate::models::canvas::{
    BulkDeleteCanvasObjectsInput, BulkUpsertCanvasObjectsInput, CanvasLayer, CanvasObject,
    CanvasReconcileResult, CanvasScene, CanvasTerritorySummary, CreateCanvasLayerInput,
    CreateCanvasObjectInput, CreateCanvasSceneInput, DeleteCanvasLayerInput,
    DeleteCanvasObjectInput, DeleteCanvasSceneInput, GetCanvasObjectInput, GetCanvasSceneInput,
    GetCanvasSceneTreeInput, GetRootCanvasSceneInput, ListCanvasLayersInput,
    ListCanvasObjectsInput, ListCanvasTerritorySummariesInput, ReconcileCanvasSceneInput,
    ReorderCanvasLayersInput, ReorderCanvasObjectsInput, UpdateCanvasLayerInput,
    UpdateCanvasObjectInput, UpdateCanvasSceneInput,
};
use crate::repositories::canvas;

#[tauri::command(rename = "canvas_scenes_get_root")]
pub fn canvas_scenes_get_root_command(
    state: State<'_, DatabaseState>,
    input: GetRootCanvasSceneInput,
) -> Result<Option<CanvasScene>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    canvas::get_root_scene(&connection, &input)
}

#[tauri::command(rename = "canvas_scenes_get_tree")]
pub fn canvas_scenes_get_tree_command(
    state: State<'_, DatabaseState>,
    input: GetCanvasSceneTreeInput,
) -> Result<Vec<CanvasScene>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    canvas::get_scene_tree(&connection, &input)
}

#[tauri::command(rename = "canvas_scenes_get")]
pub fn canvas_scenes_get_command(
    state: State<'_, DatabaseState>,
    input: GetCanvasSceneInput,
) -> Result<CanvasScene> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    canvas::get_scene(&connection, &input)
}

#[tauri::command(rename = "canvas_scenes_create")]
pub fn canvas_scenes_create_command(
    state: State<'_, DatabaseState>,
    input: CreateCanvasSceneInput,
) -> Result<CanvasScene> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    canvas::create_scene(&connection, &input)
}

#[tauri::command(rename = "canvas_scenes_update")]
pub fn canvas_scenes_update_command(
    state: State<'_, DatabaseState>,
    input: UpdateCanvasSceneInput,
) -> Result<CanvasScene> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    canvas::update_scene(&connection, &input)
}

#[tauri::command(rename = "canvas_scenes_delete")]
pub fn canvas_scenes_delete_command(
    state: State<'_, DatabaseState>,
    input: DeleteCanvasSceneInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    canvas::delete_scene(&connection, &input)
}

#[tauri::command(rename = "canvas_layers_list")]
pub fn canvas_layers_list_command(
    state: State<'_, DatabaseState>,
    input: ListCanvasLayersInput,
) -> Result<Vec<CanvasLayer>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    canvas::list_layers(&connection, &input)
}

#[tauri::command(rename = "canvas_layers_create")]
pub fn canvas_layers_create_command(
    state: State<'_, DatabaseState>,
    input: CreateCanvasLayerInput,
) -> Result<CanvasLayer> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    canvas::create_layer(&connection, &input)
}

#[tauri::command(rename = "canvas_layers_update")]
pub fn canvas_layers_update_command(
    state: State<'_, DatabaseState>,
    input: UpdateCanvasLayerInput,
) -> Result<CanvasLayer> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    canvas::update_layer(&connection, &input)
}

#[tauri::command(rename = "canvas_layers_delete")]
pub fn canvas_layers_delete_command(
    state: State<'_, DatabaseState>,
    input: DeleteCanvasLayerInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    canvas::delete_layer(&connection, &input)
}

#[tauri::command(rename = "canvas_layers_reorder")]
pub fn canvas_layers_reorder_command(
    state: State<'_, DatabaseState>,
    input: ReorderCanvasLayersInput,
) -> Result<Vec<CanvasLayer>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    canvas::reorder_layers(&connection, &input)
}

#[tauri::command(rename = "canvas_objects_list")]
pub fn canvas_objects_list_command(
    state: State<'_, DatabaseState>,
    input: ListCanvasObjectsInput,
) -> Result<Vec<CanvasObject>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    canvas::list_objects(&connection, &input)
}

#[tauri::command(rename = "canvas_objects_list_territory_summaries")]
pub fn canvas_objects_list_territory_summaries_command(
    state: State<'_, DatabaseState>,
    input: ListCanvasTerritorySummariesInput,
) -> Result<Vec<CanvasTerritorySummary>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    canvas::list_territory_summaries(&connection, &input)
}

#[tauri::command(rename = "canvas_objects_get")]
pub fn canvas_objects_get_command(
    state: State<'_, DatabaseState>,
    input: GetCanvasObjectInput,
) -> Result<CanvasObject> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    canvas::get_object(&connection, &input)
}

#[tauri::command(rename = "canvas_objects_create")]
pub fn canvas_objects_create_command(
    state: State<'_, DatabaseState>,
    input: CreateCanvasObjectInput,
) -> Result<CanvasObject> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    canvas::create_object(&connection, &input)
}

#[tauri::command(rename = "canvas_objects_update")]
pub fn canvas_objects_update_command(
    state: State<'_, DatabaseState>,
    input: UpdateCanvasObjectInput,
) -> Result<CanvasObject> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    canvas::update_object(&connection, &input)
}

#[tauri::command(rename = "canvas_objects_delete")]
pub fn canvas_objects_delete_command(
    state: State<'_, DatabaseState>,
    input: DeleteCanvasObjectInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    canvas::delete_object(&connection, &input)
}

#[tauri::command(rename = "canvas_objects_reorder")]
pub fn canvas_objects_reorder_command(
    state: State<'_, DatabaseState>,
    input: ReorderCanvasObjectsInput,
) -> Result<Vec<CanvasObject>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    canvas::reorder_objects(&connection, &input)
}

#[tauri::command(rename = "canvas_objects_bulk_upsert")]
pub fn canvas_objects_bulk_upsert_command(
    state: State<'_, DatabaseState>,
    input: BulkUpsertCanvasObjectsInput,
) -> Result<Vec<CanvasObject>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    canvas::bulk_upsert_objects(&connection, &input)
}

#[tauri::command(rename = "canvas_objects_bulk_delete")]
pub fn canvas_objects_bulk_delete_command(
    state: State<'_, DatabaseState>,
    input: BulkDeleteCanvasObjectsInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    canvas::bulk_delete_objects(&connection, &input)
}

#[tauri::command(rename = "canvas_reconcile_scene")]
pub fn canvas_reconcile_scene_command(
    state: State<'_, DatabaseState>,
    input: ReconcileCanvasSceneInput,
) -> Result<CanvasReconcileResult> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    canvas::reconcile_scene(&connection, &input)
}
