use serde::{Deserialize, Serialize};
use specta::Type;

/// Must match `shared/src/constants.ts` (`MARKER_ICONS`).
pub const MARKER_ICONS: &[&str] = &[
    "castle",
    "city",
    "village",
    "tavern",
    "dungeon",
    "forest",
    "mountain",
    "river",
    "cave",
    "temple",
    "ruins",
    "port",
    "bridge",
    "tower",
    "camp",
    "battlefield",
    "mine",
    "farm",
    "graveyard",
    "custom",
];

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MapRecord {
    pub id: i32,
    pub project_id: i32,
    pub parent_map_id: Option<i32>,
    pub parent_marker_id: Option<i32>,
    pub name: String,
    pub image_path: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GetRootMapInput {
    pub project_id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GetMapTreeInput {
    pub project_id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GetMapInput {
    pub id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CreateMapInput {
    pub project_id: i32,
    pub parent_map_id: Option<i32>,
    pub parent_marker_id: Option<i32>,
    pub name: String,
    pub image_path: Option<String>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdateMapInput {
    pub id: i32,
    pub name: Option<String>,
    pub image_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DeleteMapInput {
    pub id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MapMarker {
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
pub struct ListMapMarkersInput {
    pub map_id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CreateMapMarkerInput {
    pub map_id: i32,
    pub title: String,
    pub description: Option<String>,
    pub position_x: f64,
    pub position_y: f64,
    pub color: Option<String>,
    pub icon: Option<String>,
    pub linked_note_id: Option<i32>,
    pub child_map_id: Option<i32>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdateMapMarkerInput {
    pub id: i32,
    pub title: Option<String>,
    pub description: Option<String>,
    pub position_x: Option<f64>,
    pub position_y: Option<f64>,
    pub color: Option<String>,
    pub icon: Option<String>,
    pub linked_note_id: Option<i32>,
    pub child_map_id: Option<i32>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DeleteMapMarkerInput {
    pub id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MapTerritoryPoint {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MapTerritory {
    pub id: i32,
    pub map_id: i32,
    pub name: String,
    pub description: String,
    pub color: String,
    pub opacity: f64,
    pub border_color: String,
    pub border_width: f64,
    pub smoothing: f64,
    pub rings: Vec<Vec<MapTerritoryPoint>>,
    pub faction_id: Option<i32>,
    pub sort_order: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ListMapTerritoriesInput {
    pub map_id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CreateMapTerritoryInput {
    pub map_id: i32,
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
    pub opacity: Option<f64>,
    pub border_color: Option<String>,
    pub border_width: Option<f64>,
    pub smoothing: Option<f64>,
    pub rings: Vec<Vec<MapTerritoryPoint>>,
    pub faction_id: Option<i32>,
    pub sort_order: Option<i32>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdateMapTerritoryInput {
    pub id: i32,
    pub name: Option<String>,
    pub description: Option<String>,
    pub color: Option<String>,
    pub opacity: Option<f64>,
    pub border_color: Option<String>,
    pub border_width: Option<f64>,
    pub smoothing: Option<f64>,
    pub rings: Option<Vec<Vec<MapTerritoryPoint>>>,
    pub faction_id: Option<i32>,
    pub sort_order: Option<i32>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DeleteMapTerritoryInput {
    pub id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ListTerritorySummariesInput {
    pub project_id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MapTerritorySummary {
    pub id: i32,
    pub name: String,
    pub map_id: i32,
    pub map_name: String,
    pub faction_id: Option<i32>,
    pub occupant_name: Option<String>,
    pub occupant_kind: Option<String>,
}
