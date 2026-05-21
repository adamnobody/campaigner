use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct LegacyMigrationPreview {
    pub projects: i32,
    pub characters: i32,
    pub factions: i32,
    pub notes: i32,
    pub source_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct LegacyMigrationReport {
    pub imported_counts: HashMap<String, i32>,
    pub uploads_copied: bool,
    pub errors: Vec<String>,
}
