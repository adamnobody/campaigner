use tauri::State;

use crate::db::connection::DatabaseState;
use crate::error::{AppError, Result};
use crate::models::note::{
    CreateNoteInput, DeleteNoteInput, GetNoteInput, Note, NotesListInput, NotesListResult,
    SetNoteTagsInput, UpdateNoteInput,
};
use crate::models::tag::Tag;
use crate::repositories::notes;

#[tauri::command(rename = "notes_list")]
pub fn notes_list_command(
    state: State<'_, DatabaseState>,
    input: NotesListInput,
) -> Result<NotesListResult> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    notes::list_notes(&connection, &input)
}

#[tauri::command(rename = "notes_get")]
pub fn notes_get_command(state: State<'_, DatabaseState>, input: GetNoteInput) -> Result<Note> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    notes::get_note_by_id(&connection, &input)
}

#[tauri::command(rename = "notes_create")]
pub fn notes_create_command(
    state: State<'_, DatabaseState>,
    input: CreateNoteInput,
) -> Result<Note> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    notes::create_note(&connection, &input)
}

#[tauri::command(rename = "notes_update")]
pub fn notes_update_command(
    state: State<'_, DatabaseState>,
    input: UpdateNoteInput,
) -> Result<Note> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    notes::update_note(&connection, &input)
}

#[tauri::command(rename = "notes_delete")]
pub fn notes_delete_command(state: State<'_, DatabaseState>, input: DeleteNoteInput) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    notes::delete_note(&connection, &input)
}

#[tauri::command(rename = "notes_set_tags")]
pub fn notes_set_tags_command(
    state: State<'_, DatabaseState>,
    input: SetNoteTagsInput,
) -> Result<Vec<Tag>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    notes::set_note_tags(&connection, &input)
}
