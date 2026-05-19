use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ScaleZone {
    pub from: i32,
    pub to: i32,
    pub label: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct PoliticalScale {
    pub id: i32,
    pub code: String,
    pub entity_type: String,
    pub category: String,
    pub name: String,
    pub left_pole_label: String,
    pub right_pole_label: String,
    pub left_pole_description: String,
    pub right_pole_description: String,
    pub icon: Option<String>,
    pub zones: Option<Vec<ScaleZone>>,
    pub is_system: bool,
    pub world_id: Option<i32>,
    pub order: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct PoliticalScaleAssignment {
    pub id: i32,
    pub scale_id: i32,
    pub entity_type: String,
    pub entity_id: i32,
    pub value: i32,
    pub enabled: bool,
    pub note: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ListPoliticalScalesInput {
    pub entity_type: String,
    pub world_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CreatePoliticalScaleInput {
    pub world_id: i32,
    pub code: String,
    pub entity_type: String,
    pub category: String,
    pub name: String,
    pub left_pole_label: String,
    pub right_pole_label: String,
    pub left_pole_description: Option<String>,
    pub right_pole_description: Option<String>,
    pub icon: Option<String>,
    pub zones: Option<Vec<ScaleZone>>,
    pub order: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePoliticalScaleInput {
    pub id: i32,
    pub category: Option<String>,
    pub name: Option<String>,
    pub left_pole_label: Option<String>,
    pub right_pole_label: Option<String>,
    pub left_pole_description: Option<String>,
    pub right_pole_description: Option<String>,
    pub icon: Option<String>,
    pub zones: Option<Vec<ScaleZone>>,
    pub order: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DeletePoliticalScaleInput {
    pub id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ListPoliticalScaleAssignmentsInput {
    pub entity_type: String,
    pub entity_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct PoliticalScaleAssignmentUpsertRow {
    pub scale_id: i32,
    pub value: i32,
    pub enabled: bool,
    pub note: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ReplacePoliticalScaleAssignmentsInput {
    pub entity_type: String,
    pub entity_id: i32,
    pub assignments: Vec<PoliticalScaleAssignmentUpsertRow>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DeletePoliticalScaleAssignmentInput {
    pub id: i32,
}
