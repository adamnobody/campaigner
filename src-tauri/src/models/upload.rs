use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UploadFileInput {
    pub file_bytes: Vec<u8>,
    pub file_name: String,
    pub mime: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UploadSavedPath {
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CharacterUploadImageInput {
    pub id: i32,
    pub file_bytes: Vec<u8>,
    pub file_name: String,
    pub mime: String,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FactionUploadImageInput {
    pub id: i32,
    pub file_bytes: Vec<u8>,
    pub file_name: String,
    pub mime: String,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FactionUploadBannerInput {
    pub id: i32,
    pub file_bytes: Vec<u8>,
    pub file_name: String,
    pub mime: String,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DynastyUploadImageInput {
    pub id: i32,
    pub file_bytes: Vec<u8>,
    pub file_name: String,
    pub mime: String,
    pub branch_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MapUploadImageInput {
    pub map_id: i32,
    pub file_bytes: Vec<u8>,
    pub file_name: String,
    pub mime: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ProjectUploadMapImageInput {
    pub project_id: i32,
    pub file_bytes: Vec<u8>,
    pub file_name: String,
    pub mime: String,
}
