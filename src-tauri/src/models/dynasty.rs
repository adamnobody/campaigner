use serde::{Deserialize, Serialize};
use specta::Type;

use crate::models::tag::Tag;

/// Must match `shared/src/constants.ts` (`DYNASTY_STATUSES`).
pub const DYNASTY_STATUSES: &[&str] = &["active", "extinct", "exiled", "declining", "rising"];
/// Must match `shared/src/constants.ts` (`DYNASTY_FAMILY_RELATION_TYPES`).
pub const DYNASTY_FAMILY_RELATION_TYPES: &[&str] = &["parent", "child", "spouse", "sibling"];
/// Must match `shared/src/constants.ts` (`DYNASTY_EVENT_IMPORTANCE`).
pub const DYNASTY_EVENT_IMPORTANCE: &[&str] = &["critical", "major", "normal", "minor"];

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct Dynasty {
    pub id: i32,
    pub project_id: i32,
    pub name: String,
    pub motto: String,
    pub description: String,
    pub history: String,
    pub status: String,
    pub color: String,
    pub secondary_color: String,
    pub image_path: Option<String>,
    pub founded_date: String,
    pub extinct_date: String,
    pub founder_id: Option<i32>,
    pub current_leader_id: Option<i32>,
    pub heir_id: Option<i32>,
    pub linked_faction_id: Option<i32>,
    pub sort_order: i32,
    pub created_at: String,
    pub updated_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub member_count: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<Tag>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub members: Option<Vec<DynastyMember>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub family_links: Option<Vec<DynastyFamilyLink>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub events: Option<Vec<DynastyEvent>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub founder_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub current_leader_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub heir_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub linked_faction_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DynastyMember {
    pub id: i32,
    pub dynasty_id: i32,
    pub character_id: i32,
    pub generation: i32,
    pub role: String,
    pub birth_date: String,
    pub death_date: String,
    pub is_main_line: bool,
    pub notes: String,
    pub graph_x: Option<f64>,
    pub graph_y: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub character_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub character_image_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub character_status: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DynastyFamilyLink {
    pub id: i32,
    pub dynasty_id: i32,
    pub source_character_id: i32,
    pub target_character_id: i32,
    pub relation_type: String,
    pub custom_label: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_character_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_character_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DynastyEvent {
    pub id: i32,
    pub dynasty_id: i32,
    pub title: String,
    pub description: String,
    pub event_date: String,
    pub importance: String,
    pub sort_order: i32,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DynastiesListInput {
    pub project_id: i32,
    pub search: Option<String>,
    pub status: Option<String>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DynastiesListResult {
    pub items: Vec<Dynasty>,
    pub total: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GetDynastyInput {
    pub id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CreateDynastyInput {
    pub project_id: i32,
    pub name: String,
    pub motto: Option<String>,
    pub description: Option<String>,
    pub history: Option<String>,
    pub status: Option<String>,
    pub color: Option<String>,
    pub secondary_color: Option<String>,
    pub founded_date: Option<String>,
    pub extinct_date: Option<String>,
    pub founder_id: Option<i32>,
    pub current_leader_id: Option<i32>,
    pub heir_id: Option<i32>,
    pub linked_faction_id: Option<i32>,
    pub sort_order: Option<i32>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdateDynastyInput {
    pub id: i32,
    pub name: Option<String>,
    pub motto: Option<String>,
    pub description: Option<String>,
    pub history: Option<String>,
    pub status: Option<String>,
    pub color: Option<String>,
    pub secondary_color: Option<String>,
    pub founded_date: Option<String>,
    pub extinct_date: Option<String>,
    pub founder_id: Option<i32>,
    pub current_leader_id: Option<i32>,
    pub heir_id: Option<i32>,
    pub linked_faction_id: Option<i32>,
    pub sort_order: Option<i32>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DeleteDynastyInput {
    pub id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SetDynastyTagsInput {
    pub id: i32,
    pub tag_ids: Vec<i32>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct AddDynastyMemberInput {
    pub dynasty_id: i32,
    pub character_id: i32,
    pub generation: Option<i32>,
    pub role: Option<String>,
    pub birth_date: Option<String>,
    pub death_date: Option<String>,
    pub is_main_line: Option<bool>,
    pub notes: Option<String>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdateDynastyMemberInput {
    pub dynasty_id: i32,
    pub member_id: i32,
    pub generation: Option<i32>,
    pub role: Option<String>,
    pub birth_date: Option<String>,
    pub death_date: Option<String>,
    pub is_main_line: Option<bool>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct RemoveDynastyMemberInput {
    pub dynasty_id: i32,
    pub member_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DynastyGraphPosition {
    pub character_id: i32,
    pub graph_x: f64,
    pub graph_y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SaveDynastyGraphPositionsInput {
    pub dynasty_id: i32,
    pub positions: Vec<DynastyGraphPosition>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct AddDynastyFamilyLinkInput {
    pub dynasty_id: i32,
    pub source_character_id: i32,
    pub target_character_id: i32,
    pub relation_type: String,
    pub custom_label: Option<String>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DeleteDynastyFamilyLinkInput {
    pub dynasty_id: i32,
    pub link_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct AddDynastyEventInput {
    pub dynasty_id: i32,
    pub title: String,
    pub description: Option<String>,
    pub event_date: String,
    pub importance: Option<String>,
    pub sort_order: Option<i32>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdateDynastyEventInput {
    pub dynasty_id: i32,
    pub event_id: i32,
    pub title: Option<String>,
    pub description: Option<String>,
    pub event_date: Option<String>,
    pub importance: Option<String>,
    pub sort_order: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DeleteDynastyEventInput {
    pub dynasty_id: i32,
    pub event_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ReorderDynastyEventsInput {
    pub dynasty_id: i32,
    pub ordered_ids: Vec<i32>,
    pub branch_id: Option<i32>,
}
