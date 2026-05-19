use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CharacterTrait {
    pub id: i32,
    pub project_id: i32,
    pub name: String,
    pub description: String,
    pub image_path: String,
    pub is_predefined: bool,
    pub exclusions: Vec<i32>,
    pub sort_order: i32,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ListCharacterTraitsInput {
    pub project_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GetAssignedCharacterTraitsInput {
    pub character_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct AssignCharacterTraitInput {
    pub character_id: i32,
    pub trait_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UnassignCharacterTraitInput {
    pub character_id: i32,
    pub trait_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CreateCharacterTraitInput {
    pub project_id: i32,
    pub name: String,
    pub description: Option<String>,
    pub image_path: Option<String>,
    pub excluded_ids: Option<Vec<i32>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCharacterTraitExclusionsInput {
    pub id: i32,
    pub excluded_ids: Vec<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DeleteCharacterTraitInput {
    pub id: i32,
}
