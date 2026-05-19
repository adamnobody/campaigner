use tauri::State;

use crate::db::connection::DatabaseState;
use crate::error::{AppError, Result};
use crate::models::character::{
    Character, CharacterGraph, CharacterRelationship, CharactersListInput, CharactersListResult,
    CreateCharacterInput, CreateRelationshipInput, DeleteCharacterInput, DeleteRelationshipInput,
    GetCharacterInput, RelationshipsListInput, SetCharacterTagsInput, UpdateCharacterInput,
    UpdateRelationshipInput,
};
use crate::models::tag::Tag;
use crate::repositories::characters;

#[tauri::command(rename = "characters_list")]
pub fn characters_list_command(
    state: State<'_, DatabaseState>,
    input: CharactersListInput,
) -> Result<CharactersListResult> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    characters::list_characters(&connection, &input)
}

#[tauri::command(rename = "characters_get")]
pub fn characters_get_command(
    state: State<'_, DatabaseState>,
    input: GetCharacterInput,
) -> Result<Character> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    characters::get_character_by_id(&connection, &input)
}

#[tauri::command(rename = "characters_create")]
pub fn characters_create_command(
    state: State<'_, DatabaseState>,
    input: CreateCharacterInput,
) -> Result<Character> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    characters::create_character(&connection, &input)
}

#[tauri::command(rename = "characters_update")]
pub fn characters_update_command(
    state: State<'_, DatabaseState>,
    input: UpdateCharacterInput,
) -> Result<Character> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    characters::update_character(&connection, &input)
}

#[tauri::command(rename = "characters_delete")]
pub fn characters_delete_command(
    state: State<'_, DatabaseState>,
    input: DeleteCharacterInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    characters::delete_character(&connection, &input)
}

#[tauri::command(rename = "characters_set_tags")]
pub fn characters_set_tags_command(
    state: State<'_, DatabaseState>,
    input: SetCharacterTagsInput,
) -> Result<Vec<Tag>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    characters::set_character_tags(&connection, &input)
}

#[tauri::command(rename = "characters_relationships_list")]
pub fn characters_relationships_list_command(
    state: State<'_, DatabaseState>,
    input: RelationshipsListInput,
) -> Result<Vec<CharacterRelationship>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    characters::list_relationships(&connection, &input)
}

#[tauri::command(rename = "characters_relationships_create")]
pub fn characters_relationships_create_command(
    state: State<'_, DatabaseState>,
    input: CreateRelationshipInput,
) -> Result<CharacterRelationship> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    characters::create_relationship(&connection, &input)
}

#[tauri::command(rename = "characters_relationships_update")]
pub fn characters_relationships_update_command(
    state: State<'_, DatabaseState>,
    input: UpdateRelationshipInput,
) -> Result<CharacterRelationship> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    characters::update_relationship(&connection, &input)
}

#[tauri::command(rename = "characters_relationships_delete")]
pub fn characters_relationships_delete_command(
    state: State<'_, DatabaseState>,
    input: DeleteRelationshipInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    characters::delete_relationship(&connection, &input)
}

#[tauri::command(rename = "characters_graph")]
pub fn characters_graph_command(
    state: State<'_, DatabaseState>,
    input: RelationshipsListInput,
) -> Result<CharacterGraph> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    characters::get_graph(&connection, &input)
}
