use tauri::State;

use crate::db::connection::DatabaseState;
use crate::error::{AppError, Result};
use crate::models::character_trait::{
    AssignCharacterTraitInput, CharacterTrait, CreateCharacterTraitInput,
    DeleteCharacterTraitInput, GetAssignedCharacterTraitsInput, ListCharacterTraitsInput,
    UnassignCharacterTraitInput, UpdateCharacterTraitExclusionsInput,
};
use crate::repositories::character_traits;

#[tauri::command(rename = "character_traits_list")]
pub fn character_traits_list_command(
    state: State<'_, DatabaseState>,
    input: ListCharacterTraitsInput,
) -> Result<Vec<CharacterTrait>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    character_traits::list_traits(&connection, &input)
}

#[tauri::command(rename = "character_traits_get_assigned")]
pub fn character_traits_get_assigned_command(
    state: State<'_, DatabaseState>,
    input: GetAssignedCharacterTraitsInput,
) -> Result<Vec<i32>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    character_traits::get_assigned_trait_ids(&connection, &input)
}

#[tauri::command(rename = "character_traits_assign")]
pub fn character_traits_assign_command(
    state: State<'_, DatabaseState>,
    input: AssignCharacterTraitInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    character_traits::assign_trait(&connection, &input)
}

#[tauri::command(rename = "character_traits_unassign")]
pub fn character_traits_unassign_command(
    state: State<'_, DatabaseState>,
    input: UnassignCharacterTraitInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    character_traits::unassign_trait(&connection, &input)
}

#[tauri::command(rename = "character_traits_create")]
pub fn character_traits_create_command(
    state: State<'_, DatabaseState>,
    input: CreateCharacterTraitInput,
) -> Result<CharacterTrait> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    character_traits::create_trait(&connection, &input)
}

#[tauri::command(rename = "character_traits_update_exclusions")]
pub fn character_traits_update_exclusions_command(
    state: State<'_, DatabaseState>,
    input: UpdateCharacterTraitExclusionsInput,
) -> Result<CharacterTrait> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    character_traits::update_exclusions(&connection, &input)
}

#[tauri::command(rename = "character_traits_delete")]
pub fn character_traits_delete_command(
    state: State<'_, DatabaseState>,
    input: DeleteCharacterTraitInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    character_traits::delete_trait(&connection, &input)
}
