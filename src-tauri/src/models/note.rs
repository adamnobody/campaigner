use serde::{Deserialize, Serialize};
use specta::Type;

use crate::models::tag::Tag;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct Note {
    pub id: i32,
    pub project_id: i32,
    pub folder_id: Option<i32>,
    pub title: String,
    pub content: String,
    pub format: String,
    pub note_type: String,
    pub is_pinned: bool,
    pub created_at: String,
    pub updated_at: String,
    pub tags: Vec<Tag>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct NotesListInput {
    pub project_id: i32,
    pub page: Option<i32>,
    pub limit: Option<i32>,
    pub search: Option<String>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
    pub note_type: Option<String>,
    pub folder_id: Option<Option<i32>>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct NotesListResult {
    pub items: Vec<Note>,
    pub total: i32,
    pub page: i32,
    pub limit: i32,
    pub total_pages: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GetNoteInput {
    pub id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CreateNoteInput {
    pub project_id: i32,
    pub folder_id: Option<i32>,
    pub title: String,
    pub content: Option<String>,
    pub format: Option<String>,
    pub note_type: Option<String>,
    pub is_pinned: Option<bool>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdateNoteInput {
    pub id: i32,
    pub title: Option<String>,
    pub content: Option<String>,
    pub format: Option<String>,
    pub note_type: Option<String>,
    pub folder_id: Option<Option<i32>>,
    pub is_pinned: Option<bool>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DeleteNoteInput {
    pub id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SetNoteTagsInput {
    pub id: i32,
    pub tag_ids: Vec<i32>,
    pub branch_id: Option<i32>,
}
