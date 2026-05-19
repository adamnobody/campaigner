use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct Ambition {
    pub id: i32,
    pub name: String,
    pub description: String,
    pub icon_path: String,
    pub is_custom: bool,
    pub exclusions: Vec<i32>,
    pub project_id: Option<i32>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GetAmbitionsCatalogInput {
    pub project_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CreateAmbitionInput {
    pub project_id: i32,
    pub name: String,
    pub description: Option<String>,
    pub icon_path: Option<String>,
    pub excluded_ids: Option<Vec<i32>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdateAmbitionInput {
    pub id: i32,
    pub name: Option<String>,
    pub description: Option<String>,
    pub icon_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdateAmbitionExclusionsInput {
    pub id: i32,
    pub excluded_ids: Vec<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DeleteAmbitionInput {
    pub id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GetFactionAmbitionsInput {
    pub faction_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct AssignFactionAmbitionInput {
    pub faction_id: i32,
    pub ambition_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UnassignFactionAmbitionInput {
    pub faction_id: i32,
    pub ambition_id: i32,
}
