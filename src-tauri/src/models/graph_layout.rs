use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GraphLayoutViewport {
    pub x: f64,
    pub y: f64,
    pub zoom: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GraphLayoutNodeState {
    pub x: f64,
    pub y: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pinned: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GraphLayoutDataV1 {
    pub version: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub viewport: Option<GraphLayoutViewport>,
    #[serde(default)]
    pub nodes: HashMap<String, GraphLayoutNodeState>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GetGraphLayoutInput {
    pub project_id: i32,
    pub graph_type: String,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpsertGraphLayoutInput {
    pub project_id: i32,
    pub graph_type: String,
    pub layout_data: GraphLayoutDataV1,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DeleteGraphLayoutInput {
    pub project_id: i32,
    pub graph_type: String,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GraphLayoutResponse {
    pub layout_data: GraphLayoutDataV1,
}
