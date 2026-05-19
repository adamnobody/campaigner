use tauri::{AppHandle, State};

use crate::db::connection::DatabaseState;
use crate::error::{AppError, Result};
use crate::models::character::Character;
use crate::models::dynasty::Dynasty;
use crate::models::faction::Faction;
use crate::models::map::MapRecord;
use crate::models::project::Project;
use crate::models::upload::{
    CharacterUploadImageInput, DynastyUploadImageInput, FactionUploadBannerInput,
    FactionUploadImageInput, MapUploadImageInput, ProjectUploadMapImageInput, UploadFileInput,
    UploadSavedPath,
};
use crate::uploads::service;
use crate::uploads::web_path;

#[tauri::command(rename = "uploads_resolve_path")]
pub fn uploads_resolve_path_command(app: AppHandle, relative_path: String) -> Result<String> {
    let disk_path = web_path::resolve_disk_path(&app, &relative_path)?;
    let normalized = disk_path
        .to_str()
        .ok_or_else(|| AppError::internal("PATH_RESOLVE_ERROR", "Upload path is not valid UTF-8"))?
        .to_string();

    Ok(normalized
        .strip_prefix("\\\\?\\")
        .map(str::to_string)
        .unwrap_or(normalized))
}

#[tauri::command(rename = "uploads_save_map_image")]
pub fn uploads_save_map_image_command(
    app: AppHandle,
    input: UploadFileInput,
) -> Result<UploadSavedPath> {
    service::uploads_save_map_image(&app, input)
}

#[tauri::command(rename = "uploads_save_character_image")]
pub fn uploads_save_character_image_command(
    app: AppHandle,
    input: UploadFileInput,
) -> Result<UploadSavedPath> {
    service::uploads_save_character_image(&app, input)
}

#[tauri::command(rename = "uploads_save_trait_image")]
pub fn uploads_save_trait_image_command(
    app: AppHandle,
    input: UploadFileInput,
) -> Result<UploadSavedPath> {
    service::uploads_save_trait_image(&app, input)
}

#[tauri::command(rename = "uploads_save_ambition_image")]
pub fn uploads_save_ambition_image_command(
    app: AppHandle,
    input: UploadFileInput,
) -> Result<UploadSavedPath> {
    service::uploads_save_ambition_image(&app, input)
}

#[tauri::command(rename = "uploads_save_appearance_image")]
pub fn uploads_save_appearance_image_command(
    app: AppHandle,
    input: UploadFileInput,
) -> Result<UploadSavedPath> {
    service::uploads_save_appearance_image(&app, input)
}

#[tauri::command(rename = "characters_upload_image")]
pub fn characters_upload_image_command(
    app: AppHandle,
    state: State<'_, DatabaseState>,
    input: CharacterUploadImageInput,
) -> Result<Character> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    service::characters_upload_image(&app, &connection, input)
}

#[tauri::command(rename = "factions_upload_image")]
pub fn factions_upload_image_command(
    app: AppHandle,
    state: State<'_, DatabaseState>,
    input: FactionUploadImageInput,
) -> Result<Faction> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    service::factions_upload_image(&app, &connection, input)
}

#[tauri::command(rename = "factions_upload_banner")]
pub fn factions_upload_banner_command(
    app: AppHandle,
    state: State<'_, DatabaseState>,
    input: FactionUploadBannerInput,
) -> Result<Faction> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    service::factions_upload_banner(&app, &connection, input)
}

#[tauri::command(rename = "dynasties_upload_image")]
pub fn dynasties_upload_image_command(
    app: AppHandle,
    state: State<'_, DatabaseState>,
    input: DynastyUploadImageInput,
) -> Result<Dynasty> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    service::dynasties_upload_image(&app, &connection, input)
}

#[tauri::command(rename = "maps_upload_image")]
pub fn maps_upload_image_command(
    app: AppHandle,
    state: State<'_, DatabaseState>,
    input: MapUploadImageInput,
) -> Result<MapRecord> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    service::maps_upload_image(&app, &connection, input)
}

#[tauri::command(rename = "projects_upload_map_image")]
pub fn projects_upload_map_image_command(
    app: AppHandle,
    state: State<'_, DatabaseState>,
    input: ProjectUploadMapImageInput,
) -> Result<Project> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::internal("DB_LOCK_ERROR", "Failed to lock database connection"))?;
    service::projects_upload_map_image(&app, &connection, input)
}
