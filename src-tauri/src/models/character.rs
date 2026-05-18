use serde::{Deserialize, Serialize};
use specta::Type;

use crate::models::tag::Tag;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct Character {
    pub id: i32,
    pub project_id: i32,
    pub state_id: Option<i32>,
    pub name: String,
    pub title: String,
    pub race: String,
    pub character_class: String,
    pub level: Option<i32>,
    pub status: String,
    pub bio: String,
    pub appearance: String,
    pub personality: String,
    pub backstory: String,
    pub notes: String,
    pub image_path: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub tags: Vec<Tag>,
    pub faction_ids: Vec<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CharactersListInput {
    pub project_id: i32,
    pub page: Option<i32>,
    pub limit: Option<i32>,
    pub search: Option<String>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CharactersListResult {
    pub items: Vec<Character>,
    pub total: i32,
    pub page: i32,
    pub limit: i32,
    pub total_pages: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GetCharacterInput {
    pub id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CreateCharacterInput {
    pub project_id: i32,
    pub name: String,
    pub title: Option<String>,
    pub race: Option<String>,
    pub character_class: Option<String>,
    pub level: Option<i32>,
    pub status: Option<String>,
    pub bio: Option<String>,
    pub appearance: Option<String>,
    pub personality: Option<String>,
    pub backstory: Option<String>,
    pub notes: Option<String>,
    pub state_id: Option<i32>,
    pub faction_ids: Option<Vec<i32>>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCharacterInput {
    pub id: i32,
    pub name: Option<String>,
    pub title: Option<String>,
    pub race: Option<String>,
    pub character_class: Option<String>,
    pub level: Option<Option<i32>>,
    pub status: Option<String>,
    pub bio: Option<String>,
    pub appearance: Option<String>,
    pub personality: Option<String>,
    pub backstory: Option<String>,
    pub notes: Option<String>,
    pub state_id: Option<Option<i32>>,
    pub faction_ids: Option<Vec<i32>>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DeleteCharacterInput {
    pub id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SetCharacterTagsInput {
    pub id: i32,
    pub tag_ids: Vec<i32>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CharacterRelationship {
    pub id: i32,
    pub project_id: i32,
    pub source_character_id: i32,
    pub target_character_id: i32,
    pub relationship_type: String,
    pub custom_label: String,
    pub description: String,
    pub is_bidirectional: bool,
    pub created_at: String,
    pub source_character_name: Option<String>,
    pub target_character_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct RelationshipsListInput {
    pub project_id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CreateRelationshipInput {
    pub project_id: i32,
    pub source_character_id: i32,
    pub target_character_id: i32,
    pub relationship_type: String,
    pub custom_label: Option<String>,
    pub description: Option<String>,
    pub is_bidirectional: Option<bool>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdateRelationshipInput {
    pub id: i32,
    pub relationship_type: Option<String>,
    pub custom_label: Option<String>,
    pub description: Option<String>,
    pub is_bidirectional: Option<bool>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DeleteRelationshipInput {
    pub id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CharacterGraphNode {
    pub id: i32,
    pub name: String,
    pub title: String,
    pub status: String,
    pub image_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CharacterGraphEdge {
    pub id: i32,
    pub source: i32,
    pub target: i32,
    pub relationship_type: String,
    pub custom_label: String,
    pub is_bidirectional: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CharacterGraph {
    pub nodes: Vec<CharacterGraphNode>,
    pub edges: Vec<CharacterGraphEdge>,
}
