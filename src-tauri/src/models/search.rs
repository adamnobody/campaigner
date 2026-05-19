use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, Type, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum SearchResultType {
    Character,
    Note,
    Marker,
    Event,
    Dogma,
    Tag,
    Faction,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    #[serde(rename = "type")]
    pub result_type: SearchResultType,
    pub id: i32,
    pub title: String,
    pub subtitle: String,
    pub icon: String,
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SearchQueryInput {
    pub project_id: i32,
    pub q: String,
    pub branch_id: Option<i32>,
    pub limit: Option<i32>,
}
