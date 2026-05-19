use tauri::State;

use crate::db::connection::DatabaseState;
use crate::error::{AppError, Result};
use crate::models::wiki_link::{
    CreateWikiLinkInput, DeleteWikiLinkInput, ListWikiCategoriesInput, ListWikiLinksInput,
    WikiCategory, WikiLink,
};
use crate::repositories::wiki;

#[tauri::command(rename = "wiki_links_list")]
pub fn wiki_links_list_command(
    state: State<'_, DatabaseState>,
    input: ListWikiLinksInput,
) -> Result<Vec<WikiLink>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    wiki::list_links(&connection, &input)
}

#[tauri::command(rename = "wiki_links_create")]
pub fn wiki_links_create_command(
    state: State<'_, DatabaseState>,
    input: CreateWikiLinkInput,
) -> Result<WikiLink> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    wiki::create_link(&connection, &input)
}

#[tauri::command(rename = "wiki_links_delete")]
pub fn wiki_links_delete_command(
    state: State<'_, DatabaseState>,
    input: DeleteWikiLinkInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    wiki::delete_link(&connection, &input)
}

#[tauri::command(rename = "wiki_categories_list")]
pub fn wiki_categories_list_command(
    state: State<'_, DatabaseState>,
    input: ListWikiCategoriesInput,
) -> Result<Vec<WikiCategory>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    wiki::list_categories(&connection, &input)
}
