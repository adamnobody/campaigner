use serde::{Deserialize, Deserializer, Serialize};
use specta::Type;

use super::graph_layout::GraphLayoutDataV1;

mod flexible_bool {
    use super::*;

    pub fn deserialize<'de, D>(deserializer: D) -> Result<bool, D::Error>
    where
        D: Deserializer<'de>,
    {
        let value = serde_json::Value::deserialize(deserializer)?;
        Ok(match value {
            serde_json::Value::Bool(flag) => flag,
            serde_json::Value::Number(number) => number.as_i64().is_some_and(|n| n != 0),
            _ => false,
        })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ExportProjectMeta {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub map_image_base64: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ExportCharacterRow {
    pub id: i32,
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
    #[serde(skip_serializing_if = "Option::is_none")]
    pub state_id: Option<i32>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub faction_ids: Vec<i32>,
    pub image_path: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_base64: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ExportRelationshipRow {
    pub id: i32,
    pub source_character_id: i32,
    pub target_character_id: i32,
    pub relationship_type: String,
    pub custom_label: String,
    pub description: String,
    #[serde(default, deserialize_with = "flexible_bool::deserialize")]
    #[specta(type = bool)]
    pub is_bidirectional: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ExportNoteRow {
    pub id: i32,
    pub folder_id: Option<i32>,
    pub title: String,
    pub content: String,
    pub format: String,
    pub note_type: String,
    #[serde(default, deserialize_with = "flexible_bool::deserialize")]
    #[specta(type = bool)]
    pub is_pinned: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ExportFolderRow {
    pub id: i32,
    pub name: String,
    pub parent_id: Option<i32>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ExportMapRow {
    pub id: i32,
    pub project_id: i32,
    pub parent_map_id: Option<i32>,
    pub parent_marker_id: Option<i32>,
    pub name: String,
    pub image_path: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_base64: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ExportMarkerRow {
    pub id: i32,
    pub map_id: i32,
    pub title: String,
    pub description: String,
    pub position_x: f64,
    pub position_y: f64,
    pub color: String,
    pub icon: String,
    pub linked_note_id: Option<i32>,
    pub child_map_id: Option<i32>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ExportTerritoryRow {
    pub id: i32,
    pub map_id: i32,
    pub name: String,
    pub description: String,
    pub color: String,
    pub opacity: f64,
    pub border_color: String,
    pub border_width: f64,
    pub points: String,
    pub faction_id: Option<i32>,
    pub smoothing: f64,
    pub sort_order: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ExportTimelineEventRow {
    pub id: i32,
    pub title: String,
    pub description: String,
    pub event_date: String,
    pub sort_order: i32,
    pub era: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub era_color: Option<String>,
    pub linked_note_id: Option<i32>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ExportTagRow {
    pub id: i32,
    pub name: String,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ExportTagAssociationRow {
    pub tag_id: i32,
    pub entity_type: String,
    pub entity_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ExportWikiLinkRow {
    pub id: i32,
    pub source_note_id: i32,
    pub target_note_id: i32,
    pub label: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ExportDogmaRow {
    pub id: i32,
    pub title: String,
    pub category: String,
    pub description: String,
    pub impact: String,
    pub exceptions: String,
    #[serde(default, deserialize_with = "flexible_bool::deserialize")]
    #[specta(type = bool)]
    pub is_public: bool,
    pub importance: String,
    pub status: String,
    pub sort_order: i32,
    pub icon: String,
    pub color: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ExportFactionCustomMetricRow {
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
pub struct ExportFactionRow {
    pub id: i32,
    pub name: String,
    pub kind: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub r#type: Option<String>,
    pub motto: String,
    pub description: String,
    pub history: String,
    pub goals: String,
    pub headquarters: String,
    pub territory: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub treasury: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub population: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub army_size: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub navy_size: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub territory_km2: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub annual_income: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub annual_expenses: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub members_count: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub influence: Option<f64>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub custom_metrics: Vec<ExportFactionCustomMetricRow>,
    pub status: String,
    pub color: String,
    pub secondary_color: String,
    pub image_path: Option<String>,
    pub banner_path: Option<String>,
    pub founded_date: String,
    pub disbanded_date: String,
    pub parent_faction_id: Option<i32>,
    pub sort_order: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ExportFactionRankRow {
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
pub struct ExportFactionMemberRow {
    pub id: i32,
    pub faction_id: i32,
    pub character_id: i32,
    pub rank_id: Option<i32>,
    pub role: String,
    pub joined_date: String,
    pub left_date: String,
    #[serde(default, deserialize_with = "flexible_bool::deserialize")]
    #[specta(type = bool)]
    pub is_active: bool,
    pub notes: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ExportFactionRelationRow {
    pub id: i32,
    pub source_faction_id: i32,
    pub target_faction_id: i32,
    pub relation_type: String,
    pub custom_label: String,
    pub description: String,
    pub started_date: String,
    #[serde(default, deserialize_with = "flexible_bool::deserialize")]
    #[specta(type = bool)]
    pub is_bidirectional: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ExportDynastyRow {
    pub id: i32,
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
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ExportDynastyMemberRow {
    pub id: i32,
    pub dynasty_id: i32,
    pub character_id: i32,
    pub generation: i32,
    pub role: String,
    pub birth_date: String,
    pub death_date: String,
    #[serde(default, deserialize_with = "flexible_bool::deserialize")]
    #[specta(type = bool)]
    pub is_main_line: bool,
    pub notes: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ExportDynastyFamilyLinkRow {
    pub id: i32,
    pub dynasty_id: i32,
    pub source_character_id: i32,
    pub target_character_id: i32,
    pub relation_type: String,
    pub custom_label: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ExportDynastyEventRow {
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
pub struct ExportScenarioBranchRow {
    pub id: i32,
    pub project_id: i32,
    pub name: String,
    pub parent_branch_id: Option<i32>,
    pub base_revision: i32,
    pub is_main: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ExportGraphLayoutRow {
    pub branch_id: i32,
    pub graph_type: String,
    pub layout_data: GraphLayoutDataV1,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ImportedProjectPayload {
    pub version: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub exported_at: Option<String>,
    pub project: ExportProjectMeta,
    #[serde(default)]
    pub characters: Vec<ExportCharacterRow>,
    #[serde(default)]
    pub relationships: Vec<ExportRelationshipRow>,
    #[serde(default)]
    pub notes: Vec<ExportNoteRow>,
    #[serde(default)]
    pub folders: Vec<ExportFolderRow>,
    #[serde(default)]
    pub maps: Vec<ExportMapRow>,
    #[serde(default)]
    pub markers: Vec<ExportMarkerRow>,
    #[serde(default)]
    pub territories: Vec<ExportTerritoryRow>,
    #[serde(default)]
    pub timeline_events: Vec<ExportTimelineEventRow>,
    #[serde(default)]
    pub tags: Vec<ExportTagRow>,
    #[serde(default)]
    pub tag_associations: Vec<ExportTagAssociationRow>,
    #[serde(default)]
    pub wiki_links: Vec<ExportWikiLinkRow>,
    #[serde(default)]
    pub dogmas: Vec<ExportDogmaRow>,
    #[serde(default)]
    pub factions: Vec<ExportFactionRow>,
    #[serde(default)]
    pub faction_custom_metrics: Vec<ExportFactionCustomMetricRow>,
    #[serde(default)]
    pub faction_ranks: Vec<ExportFactionRankRow>,
    #[serde(default)]
    pub faction_members: Vec<ExportFactionMemberRow>,
    #[serde(default)]
    pub faction_relations: Vec<ExportFactionRelationRow>,
    #[serde(default)]
    pub dynasties: Vec<ExportDynastyRow>,
    #[serde(default)]
    pub dynasty_members: Vec<ExportDynastyMemberRow>,
    #[serde(default)]
    pub dynasty_family_links: Vec<ExportDynastyFamilyLinkRow>,
    #[serde(default)]
    pub dynasty_events: Vec<ExportDynastyEventRow>,
    #[serde(default)]
    pub scenario_branches: Vec<ExportScenarioBranchRow>,
    #[serde(default)]
    pub graph_layouts: Vec<ExportGraphLayoutRow>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ImportProjectInput {
    pub payload: ImportedProjectPayload,
    pub locale: Option<String>,
    #[serde(default = "default_true")]
    pub append_import_name_suffix: bool,
}

fn default_true() -> bool {
    true
}
