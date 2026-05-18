use serde::{Deserialize, Serialize};
use specta::Type;

use crate::models::tag::Tag;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct TimelineEvent {
    pub id: i32,
    pub project_id: i32,
    pub title: String,
    pub description: String,
    pub event_date: String,
    pub sort_order: i32,
    pub era: String,
    pub era_color: String,
    pub linked_note_id: Option<i32>,
    pub created_at: String,
    pub updated_at: String,
    pub tags: Vec<Tag>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct TimelineListInput {
    pub project_id: i32,
    pub era: Option<String>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GetTimelineEventInput {
    pub id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CreateTimelineEventInput {
    pub project_id: i32,
    pub title: String,
    pub description: Option<String>,
    pub event_date: String,
    pub sort_order: Option<i32>,
    pub era: Option<String>,
    pub era_color: Option<String>,
    pub linked_note_id: Option<i32>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTimelineEventInput {
    pub id: i32,
    pub title: Option<String>,
    pub description: Option<String>,
    pub event_date: Option<String>,
    pub sort_order: Option<i32>,
    pub era: Option<String>,
    pub era_color: Option<String>,
    pub linked_note_id: Option<Option<i32>>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DeleteTimelineEventInput {
    pub id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ReorderTimelineInput {
    pub project_id: i32,
    pub ordered_ids: Vec<i32>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SetTimelineTagsInput {
    pub id: i32,
    pub tag_ids: Vec<i32>,
    pub branch_id: Option<i32>,
}
