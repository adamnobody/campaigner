use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct WikiLink {
    pub id: i32,
    pub project_id: i32,
    pub source_note_id: i32,
    pub target_note_id: i32,
    pub label: String,
    pub created_at: String,
    pub source_title: Option<String>,
    pub target_title: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct WikiCategory {
    pub name: String,
    pub count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ListWikiLinksInput {
    pub project_id: i32,
    pub note_id: Option<i32>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CreateWikiLinkInput {
    pub project_id: i32,
    pub source_note_id: i32,
    pub target_note_id: i32,
    pub label: Option<String>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DeleteWikiLinkInput {
    pub id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ListWikiCategoriesInput {
    pub project_id: i32,
    pub branch_id: Option<i32>,
}
