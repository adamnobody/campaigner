use tauri::State;

use crate::db::connection::DatabaseState;
use crate::error::{AppError, Result};
use crate::models::tag::Tag;
use crate::models::timeline::{
    CreateTimelineEventInput, DeleteTimelineEventInput, GetTimelineEventInput,
    ReorderTimelineInput, SetTimelineTagsInput, TimelineEvent, TimelineListInput,
    UpdateTimelineEventInput,
};
use crate::repositories::timeline;

#[tauri::command(rename = "timeline_list")]
pub fn timeline_list_command(
    state: State<'_, DatabaseState>,
    input: TimelineListInput,
) -> Result<Vec<TimelineEvent>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    timeline::list_timeline_events(&connection, &input)
}

#[tauri::command(rename = "timeline_get")]
pub fn timeline_get_command(
    state: State<'_, DatabaseState>,
    input: GetTimelineEventInput,
) -> Result<TimelineEvent> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    timeline::get_timeline_event_by_id(&connection, &input)
}

#[tauri::command(rename = "timeline_create")]
pub fn timeline_create_command(
    state: State<'_, DatabaseState>,
    input: CreateTimelineEventInput,
) -> Result<TimelineEvent> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    timeline::create_timeline_event(&connection, &input)
}

#[tauri::command(rename = "timeline_update")]
pub fn timeline_update_command(
    state: State<'_, DatabaseState>,
    input: UpdateTimelineEventInput,
) -> Result<TimelineEvent> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    timeline::update_timeline_event(&connection, &input)
}

#[tauri::command(rename = "timeline_delete")]
pub fn timeline_delete_command(
    state: State<'_, DatabaseState>,
    input: DeleteTimelineEventInput,
) -> Result<()> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    timeline::delete_timeline_event(&connection, &input)
}

#[tauri::command(rename = "timeline_reorder")]
pub fn timeline_reorder_command(
    state: State<'_, DatabaseState>,
    input: ReorderTimelineInput,
) -> Result<Vec<TimelineEvent>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    timeline::reorder_timeline_events(&connection, &input)
}

#[tauri::command(rename = "timeline_set_tags")]
pub fn timeline_set_tags_command(
    state: State<'_, DatabaseState>,
    input: SetTimelineTagsInput,
) -> Result<Vec<Tag>> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;

    timeline::set_timeline_event_tags(&connection, &input)
}
