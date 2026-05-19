use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct AppHealthResponse {
    pub status: String,
    pub database: String,
    pub app_version: String,
}
