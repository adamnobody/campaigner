use serde::{Deserialize, Serialize};
use specta::Type;

use crate::models::tag::Tag;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct Dogma {
    pub id: i32,
    pub project_id: i32,
    pub title: String,
    pub category: String,
    pub description: String,
    pub impact: String,
    pub exceptions: String,
    pub is_public: bool,
    pub importance: String,
    pub status: String,
    pub sort_order: i32,
    pub icon: String,
    pub color: String,
    pub tags: Vec<Tag>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DogmasListInput {
    pub project_id: i32,
    pub category: Option<String>,
    pub importance: Option<String>,
    pub status: Option<String>,
    pub search: Option<String>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DogmasListResult {
    pub items: Vec<Dogma>,
    pub total: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GetDogmaInput {
    pub id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CreateDogmaInput {
    pub project_id: i32,
    pub title: String,
    pub category: String,
    pub description: Option<String>,
    pub impact: Option<String>,
    pub exceptions: Option<String>,
    pub is_public: Option<bool>,
    pub importance: Option<String>,
    pub status: Option<String>,
    pub sort_order: Option<i32>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdateDogmaInput {
    pub id: i32,
    pub title: Option<String>,
    pub category: Option<String>,
    pub description: Option<String>,
    pub impact: Option<String>,
    pub exceptions: Option<String>,
    pub is_public: Option<bool>,
    pub importance: Option<String>,
    pub status: Option<String>,
    pub sort_order: Option<i32>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DeleteDogmaInput {
    pub id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ReorderDogmasInput {
    pub project_id: i32,
    pub ordered_ids: Vec<i32>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SetDogmaTagsInput {
    pub id: i32,
    pub tag_ids: Vec<i32>,
    pub branch_id: Option<i32>,
}
