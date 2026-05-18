use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ScenarioBranch {
    pub id: i32,
    pub project_id: i32,
    pub name: String,
    pub parent_branch_id: Option<i32>,
    pub base_revision: i32,
    pub is_main: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum OverlayOperation {
    #[serde(rename = "upsert")]
    Upsert,
    #[serde(rename = "delete")]
    Delete,
    #[serde(rename = "create")]
    Create,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct BranchOverride {
    pub id: i32,
    pub branch_id: i32,
    pub entity_type: String,
    pub entity_id: i32,
    pub op: OverlayOperation,
    pub patch_json: String,
    pub created_at: String,
    pub updated_at: String,
}
