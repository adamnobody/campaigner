use tauri::State;

use crate::db::connection::DatabaseState;
use crate::error::{AppError, Result};
use crate::models::tag::{CreateTagInput, DeleteTagInput, Tag, TagsListInput};
use crate::repositories::tags;

#[tauri::command(rename = "tags_list")]
pub fn tags_list_command(
    state: State<'_, DatabaseState>,
    input: TagsListInput,
) -> Result<Vec<Tag>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    tags::list_tags(&connection, &input)
}

#[tauri::command(rename = "tags_create")]
pub fn tags_create_command(state: State<'_, DatabaseState>, input: CreateTagInput) -> Result<Tag> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    tags::create_tag(&connection, &input)
}

#[tauri::command(rename = "tags_delete")]
pub fn tags_delete_command(state: State<'_, DatabaseState>, input: DeleteTagInput) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    tags::delete_tag(&connection, &input)
}
