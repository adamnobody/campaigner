use serde::{Deserialize, Serialize};
use serde_json::Value;
use specta::Type;

pub const CANVAS_OBJECT_KINDS: &[&str] = &[
    "territory",
    "marker",
    "curve_text",
    "text",
    "polygon",
    "polyline",
    "rectangle",
    "ellipse",
    "image",
    "icon",
    "group",
];

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CanvasScene {
    pub id: i32,
    pub project_id: i32,
    pub parent_scene_id: Option<i32>,
    pub parent_object_id: Option<i32>,
    pub name: String,
    pub background_path: Option<String>,
    #[specta(type = specta_typescript::Unknown)]
    pub viewport_json: Value,
    #[specta(type = specta_typescript::Unknown)]
    pub metadata_json: Value,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CanvasLayer {
    pub id: i32,
    pub scene_id: i32,
    pub name: String,
    pub kind: String,
    pub z_index: i32,
    pub is_hidden: bool,
    pub is_locked: bool,
    pub opacity: f64,
    pub blend_mode: String,
    #[specta(type = specta_typescript::Unknown)]
    pub metadata_json: Value,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CanvasObject {
    pub id: i32,
    pub scene_id: i32,
    pub layer_id: i32,
    pub kind: String,
    pub name: Option<String>,
    pub z_index: i32,
    #[specta(type = specta_typescript::Unknown)]
    pub transform_json: Value,
    #[specta(type = specta_typescript::Unknown)]
    pub geometry_json: Value,
    #[specta(type = specta_typescript::Unknown)]
    pub style_json: Value,
    #[specta(type = specta_typescript::Unknown)]
    pub content_json: Value,
    pub resource_path: Option<String>,
    pub linked_note_id: Option<i32>,
    pub linked_scene_id: Option<i32>,
    pub is_hidden: bool,
    pub is_locked: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CanvasReconcileResult {
    pub upserted: Vec<CanvasObject>,
    pub deleted_ids: Vec<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CanvasTerritorySummary {
    pub id: i32,
    pub name: String,
    pub scene_id: i32,
    pub scene_name: String,
    pub faction_id: Option<i32>,
    pub occupant_name: Option<String>,
    pub occupant_kind: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GetRootCanvasSceneInput {
    pub project_id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GetCanvasSceneTreeInput {
    pub project_id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GetCanvasSceneInput {
    pub id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CreateCanvasSceneInput {
    pub project_id: i32,
    pub parent_scene_id: Option<i32>,
    pub parent_object_id: Option<i32>,
    pub name: String,
    pub background_path: Option<String>,
    #[specta(type = Option<specta_typescript::Unknown>)]
    pub viewport_json: Option<Value>,
    #[specta(type = Option<specta_typescript::Unknown>)]
    pub metadata_json: Option<Value>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCanvasSceneInput {
    pub id: i32,
    pub name: Option<String>,
    pub background_path: Option<String>,
    #[specta(type = Option<specta_typescript::Unknown>)]
    pub viewport_json: Option<Value>,
    #[specta(type = Option<specta_typescript::Unknown>)]
    pub metadata_json: Option<Value>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DeleteCanvasSceneInput {
    pub id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ListCanvasLayersInput {
    pub scene_id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CreateCanvasLayerInput {
    pub scene_id: i32,
    pub name: String,
    pub kind: String,
    pub z_index: Option<i32>,
    pub is_hidden: Option<bool>,
    pub is_locked: Option<bool>,
    pub opacity: Option<f64>,
    pub blend_mode: Option<String>,
    #[specta(type = Option<specta_typescript::Unknown>)]
    pub metadata_json: Option<Value>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCanvasLayerInput {
    pub id: i32,
    pub name: Option<String>,
    pub kind: Option<String>,
    pub z_index: Option<i32>,
    pub is_hidden: Option<bool>,
    pub is_locked: Option<bool>,
    pub opacity: Option<f64>,
    pub blend_mode: Option<String>,
    #[specta(type = Option<specta_typescript::Unknown>)]
    pub metadata_json: Option<Value>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DeleteCanvasLayerInput {
    pub id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ReorderCanvasLayersInput {
    pub scene_id: i32,
    pub ordered_ids: Vec<i32>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ListCanvasObjectsInput {
    pub scene_id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ListCanvasTerritorySummariesInput {
    pub project_id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GetCanvasObjectInput {
    pub id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CreateCanvasObjectInput {
    pub scene_id: i32,
    pub layer_id: i32,
    pub kind: String,
    pub name: Option<String>,
    pub z_index: Option<i32>,
    #[specta(type = specta_typescript::Unknown)]
    pub transform_json: Value,
    #[specta(type = Option<specta_typescript::Unknown>)]
    pub geometry_json: Option<Value>,
    #[specta(type = Option<specta_typescript::Unknown>)]
    pub style_json: Option<Value>,
    #[specta(type = Option<specta_typescript::Unknown>)]
    pub content_json: Option<Value>,
    pub resource_path: Option<String>,
    pub linked_note_id: Option<i32>,
    pub linked_scene_id: Option<i32>,
    pub is_hidden: Option<bool>,
    pub is_locked: Option<bool>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCanvasObjectInput {
    pub id: i32,
    pub layer_id: Option<i32>,
    pub kind: Option<String>,
    pub name: Option<String>,
    pub z_index: Option<i32>,
    #[specta(type = Option<specta_typescript::Unknown>)]
    pub transform_json: Option<Value>,
    #[specta(type = Option<specta_typescript::Unknown>)]
    pub geometry_json: Option<Value>,
    #[specta(type = Option<specta_typescript::Unknown>)]
    pub style_json: Option<Value>,
    #[specta(type = Option<specta_typescript::Unknown>)]
    pub content_json: Option<Value>,
    pub resource_path: Option<String>,
    pub linked_note_id: Option<i32>,
    pub linked_scene_id: Option<i32>,
    pub is_hidden: Option<bool>,
    pub is_locked: Option<bool>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DeleteCanvasObjectInput {
    pub id: i32,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ReorderCanvasObjectsInput {
    pub scene_id: i32,
    pub layer_id: Option<i32>,
    pub ordered_ids: Vec<i32>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct BulkUpsertCanvasObjectsInput {
    pub scene_id: i32,
    pub objects: Vec<UpsertCanvasObjectInput>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpsertCanvasObjectInput {
    pub id: Option<i32>,
    pub layer_id: i32,
    pub kind: String,
    pub name: Option<String>,
    pub z_index: i32,
    #[specta(type = specta_typescript::Unknown)]
    pub transform_json: Value,
    #[specta(type = Option<specta_typescript::Unknown>)]
    pub geometry_json: Option<Value>,
    #[specta(type = Option<specta_typescript::Unknown>)]
    pub style_json: Option<Value>,
    #[specta(type = Option<specta_typescript::Unknown>)]
    pub content_json: Option<Value>,
    pub resource_path: Option<String>,
    pub linked_note_id: Option<i32>,
    pub linked_scene_id: Option<i32>,
    pub is_hidden: Option<bool>,
    pub is_locked: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct BulkDeleteCanvasObjectsInput {
    pub scene_id: i32,
    pub object_ids: Vec<i32>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ReconcileCanvasSceneInput {
    pub scene_id: i32,
    pub upsert: Vec<UpsertCanvasObjectInput>,
    pub delete_ids: Vec<i32>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct AttachChildSceneToMarkerInput {
    pub marker_id: i32,
    pub scene_name: String,
    pub background_path: Option<String>,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct AttachChildSceneToMarkerResult {
    pub marker: CanvasObject,
    pub child_scene: CanvasScene,
}
