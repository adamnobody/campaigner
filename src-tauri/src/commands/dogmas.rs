use tauri::State;

use crate::db::connection::DatabaseState;
use crate::error::{AppError, Result};
use crate::models::dogma::{
    CreateDogmaInput, DeleteDogmaInput, Dogma, DogmasListInput, DogmasListResult, GetDogmaInput,
    ReorderDogmasInput, SetDogmaTagsInput, UpdateDogmaInput,
};
use crate::models::tag::Tag;
use crate::repositories::dogmas;

#[tauri::command(rename = "dogmas_list")]
pub fn dogmas_list_command(
    state: State<'_, DatabaseState>,
    input: DogmasListInput,
) -> Result<DogmasListResult> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    dogmas::list_dogmas(&connection, &input)
}

#[tauri::command(rename = "dogmas_get")]
pub fn dogmas_get_command(state: State<'_, DatabaseState>, input: GetDogmaInput) -> Result<Dogma> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    dogmas::get_dogma_by_id(&connection, &input)
}

#[tauri::command(rename = "dogmas_create")]
pub fn dogmas_create_command(
    state: State<'_, DatabaseState>,
    input: CreateDogmaInput,
) -> Result<Dogma> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    dogmas::create_dogma(&connection, &input)
}

#[tauri::command(rename = "dogmas_update")]
pub fn dogmas_update_command(
    state: State<'_, DatabaseState>,
    input: UpdateDogmaInput,
) -> Result<Dogma> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    dogmas::update_dogma(&connection, &input)
}

#[tauri::command(rename = "dogmas_delete")]
pub fn dogmas_delete_command(
    state: State<'_, DatabaseState>,
    input: DeleteDogmaInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    dogmas::delete_dogma(&connection, &input)
}

#[tauri::command(rename = "dogmas_reorder")]
pub fn dogmas_reorder_command(
    state: State<'_, DatabaseState>,
    input: ReorderDogmasInput,
) -> Result<DogmasListResult> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    dogmas::reorder_dogmas(&connection, &input)
}

#[tauri::command(rename = "dogmas_set_tags")]
pub fn dogmas_set_tags_command(
    state: State<'_, DatabaseState>,
    input: SetDogmaTagsInput,
) -> Result<Vec<Tag>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    dogmas::set_dogma_tags(&connection, &input)
}
