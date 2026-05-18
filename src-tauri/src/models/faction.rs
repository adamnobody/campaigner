use serde::{Deserialize, Serialize};
use specta::Type;

use crate::models::tag::Tag;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct Faction {
    pub id: i32,
    pub project_id: i32,
    pub name: String,
    pub kind: String,
    pub r#type: Option<String>,
    pub motto: String,
    pub description: String,
    pub history: String,
    pub goals: String,
    pub headquarters: String,
    pub territory: String,
    pub ruling_dynasty_id: Option<i32>,
    pub ruler_character_id: Option<i32>,
    pub treasury: Option<i32>,
    pub population: Option<i32>,
    pub army_size: Option<i32>,
    pub navy_size: Option<i32>,
    pub territory_km2: Option<i32>,
    pub annual_income: Option<i32>,
    pub annual_expenses: Option<i32>,
    pub members_count: Option<i32>,
    pub influence: Option<i32>,
    pub status: String,
    pub color: String,
    pub secondary_color: String,
    pub image_path: String,
    pub banner_path: String,
    pub founded_date: String,
    pub disbanded_date: String,
    pub parent_faction_id: Option<i32>,
    pub sort_order: i32,
    pub created_at: String,
    pub updated_at: String,
    pub tags: Vec<Tag>,
    pub custom_metrics: Vec<FactionCustomMetric>,
    pub ranks: Vec<FactionRank>,
    pub members: Vec<FactionMember>,
    pub member_count: i32,
    pub parent_faction: Option<IdNameRef>,
    pub child_factions: Vec<IdNameRef>,
    pub ruling_dynasty: Option<IdNameRef>,
    pub ruler: Option<IdNameRef>,
    pub territories: Vec<IdNameRef>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct IdNameRef {
    pub id: i32,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FactionsListInput {
    pub project_id: i32,
    pub kind: Option<String>,
    pub status: Option<String>,
    pub search: Option<String>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FactionsListResult {
    pub items: Vec<Faction>,
    pub total: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GetFactionInput {
    pub id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CreateFactionInput {
    pub project_id: i32,
    pub name: String,
    pub kind: Option<String>,
    pub r#type: Option<String>,
    pub motto: Option<String>,
    pub description: Option<String>,
    pub history: Option<String>,
    pub goals: Option<String>,
    pub headquarters: Option<String>,
    pub territory: Option<String>,
    pub ruling_dynasty_id: Option<i32>,
    pub ruler_character_id: Option<i32>,
    pub territory_ids: Option<Vec<i32>>,
    pub treasury: Option<i32>,
    pub population: Option<i32>,
    pub army_size: Option<i32>,
    pub navy_size: Option<i32>,
    pub territory_km2: Option<i32>,
    pub annual_income: Option<i32>,
    pub annual_expenses: Option<i32>,
    pub members_count: Option<i32>,
    pub influence: Option<i32>,
    pub status: Option<String>,
    pub color: Option<String>,
    pub secondary_color: Option<String>,
    pub founded_date: Option<String>,
    pub disbanded_date: Option<String>,
    pub parent_faction_id: Option<i32>,
    pub sort_order: Option<i32>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdateFactionInput {
    pub id: i32,
    pub name: Option<String>,
    pub kind: Option<String>,
    pub r#type: Option<Option<String>>,
    pub motto: Option<String>,
    pub description: Option<String>,
    pub history: Option<String>,
    pub goals: Option<String>,
    pub headquarters: Option<String>,
    pub territory: Option<String>,
    pub ruling_dynasty_id: Option<Option<i32>>,
    pub ruler_character_id: Option<Option<i32>>,
    pub territory_ids: Option<Vec<i32>>,
    pub treasury: Option<Option<i32>>,
    pub population: Option<Option<i32>>,
    pub army_size: Option<Option<i32>>,
    pub navy_size: Option<Option<i32>>,
    pub territory_km2: Option<Option<i32>>,
    pub annual_income: Option<Option<i32>>,
    pub annual_expenses: Option<Option<i32>>,
    pub members_count: Option<Option<i32>>,
    pub influence: Option<Option<i32>>,
    pub status: Option<String>,
    pub color: Option<String>,
    pub secondary_color: Option<String>,
    pub founded_date: Option<String>,
    pub disbanded_date: Option<String>,
    pub parent_faction_id: Option<Option<i32>>,
    pub sort_order: Option<i32>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DeleteFactionInput {
    pub id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SetFactionTagsInput {
    pub id: i32,
    pub tag_ids: Vec<i32>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FactionRank {
    pub id: i32,
    pub faction_id: i32,
    pub name: String,
    pub level: i32,
    pub description: String,
    pub permissions: String,
    pub icon: String,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ListFactionRanksInput {
    pub faction_id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CreateFactionRankInput {
    pub faction_id: i32,
    pub name: String,
    pub level: Option<i32>,
    pub description: Option<String>,
    pub permissions: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdateFactionRankInput {
    pub faction_id: i32,
    pub rank_id: i32,
    pub name: Option<String>,
    pub level: Option<i32>,
    pub description: Option<String>,
    pub permissions: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DeleteFactionRankInput {
    pub faction_id: i32,
    pub rank_id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FactionMember {
    pub id: i32,
    pub faction_id: i32,
    pub character_id: i32,
    pub rank_id: Option<i32>,
    pub role: String,
    pub joined_date: String,
    pub left_date: String,
    pub is_active: bool,
    pub notes: String,
    pub character_name: String,
    pub character_image_path: String,
    pub rank_name: String,
    pub rank_level: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ListFactionMembersInput {
    pub faction_id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CreateFactionMemberInput {
    pub faction_id: i32,
    pub character_id: i32,
    pub rank_id: Option<i32>,
    pub role: Option<String>,
    pub joined_date: Option<String>,
    pub left_date: Option<String>,
    pub is_active: Option<bool>,
    pub notes: Option<String>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdateFactionMemberInput {
    pub faction_id: i32,
    pub member_id: i32,
    pub rank_id: Option<Option<i32>>,
    pub role: Option<String>,
    pub joined_date: Option<String>,
    pub left_date: Option<String>,
    pub is_active: Option<bool>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DeleteFactionMemberInput {
    pub faction_id: i32,
    pub member_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FactionCustomMetric {
    pub id: i32,
    pub faction_id: i32,
    pub name: String,
    pub value: f64,
    pub unit: Option<String>,
    pub sort_order: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpsertFactionCustomMetricInput {
    pub id: Option<i32>,
    pub name: String,
    pub value: f64,
    pub unit: Option<String>,
    pub sort_order: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ReplaceFactionCustomMetricsInput {
    pub faction_id: i32,
    pub metrics: Vec<UpsertFactionCustomMetricInput>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CompareFactionsInput {
    pub faction_ids: Vec<i32>,
    pub metric_keys: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FactionCompareMetricValue {
    pub faction_id: i32,
    pub value: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FactionCompareMetric {
    pub key: String,
    pub label: String,
    pub unit: Option<String>,
    pub values: Vec<FactionCompareMetricValue>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FactionCompareEntity {
    pub id: i32,
    pub name: String,
    pub kind: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FactionCompareResult {
    pub factions: Vec<FactionCompareEntity>,
    pub metrics: Vec<FactionCompareMetric>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FactionRelation {
    pub id: i32,
    pub project_id: i32,
    pub source_faction_id: i32,
    pub target_faction_id: i32,
    pub relation_type: String,
    pub custom_label: String,
    pub description: String,
    pub started_date: String,
    pub is_bidirectional: bool,
    pub created_at: String,
    pub source_faction_name: String,
    pub target_faction_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FactionsRelationsListInput {
    pub project_id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CreateFactionRelationInput {
    pub project_id: i32,
    pub source_faction_id: i32,
    pub target_faction_id: i32,
    pub relation_type: Option<String>,
    pub custom_label: Option<String>,
    pub description: Option<String>,
    pub started_date: Option<String>,
    pub is_bidirectional: Option<bool>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdateFactionRelationInput {
    pub relation_id: i32,
    pub relation_type: Option<String>,
    pub custom_label: Option<String>,
    pub description: Option<String>,
    pub started_date: Option<String>,
    pub is_bidirectional: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DeleteFactionRelationInput {
    pub relation_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FactionGraphNode {
    pub id: i32,
    pub name: String,
    pub kind: String,
    pub r#type: Option<String>,
    pub status: String,
    pub color: String,
    pub image_path: String,
    pub member_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FactionGraph {
    pub nodes: Vec<FactionGraphNode>,
    pub edges: Vec<FactionRelation>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FactionPolicy {
    pub id: i32,
    pub faction_id: i32,
    pub title: String,
    pub r#type: String,
    pub status: String,
    pub category: String,
    pub enacted_date: Option<String>,
    pub description: String,
    pub sort_order: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ListFactionPoliciesInput {
    pub faction_id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CreateFactionPolicyInput {
    pub faction_id: i32,
    pub title: String,
    pub r#type: String,
    pub status: Option<String>,
    pub category: Option<String>,
    pub enacted_date: Option<String>,
    pub description: Option<String>,
    pub sort_order: Option<i32>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdateFactionPolicyInput {
    pub faction_id: i32,
    pub policy_id: i32,
    pub title: Option<String>,
    pub r#type: Option<String>,
    pub status: Option<String>,
    pub category: Option<String>,
    pub enacted_date: Option<Option<String>>,
    pub description: Option<String>,
    pub sort_order: Option<i32>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DeleteFactionPolicyInput {
    pub faction_id: i32,
    pub policy_id: i32,
    pub branch_id: Option<i32>,
}
