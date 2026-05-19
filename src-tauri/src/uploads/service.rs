use rusqlite::Connection;
use tauri::{AppHandle, Runtime};

use crate::error::Result;
use crate::models::character::{Character, GetCharacterInput};
use crate::models::dynasty::{Dynasty, GetDynastyInput};
use crate::models::faction::{Faction, GetFactionInput};
use crate::models::map::{GetMapInput, MapRecord};
use crate::models::project::{GetProjectInput, Project};
use crate::models::upload::{
    CharacterUploadImageInput, DynastyUploadImageInput, FactionUploadBannerInput,
    FactionUploadImageInput, MapUploadImageInput, ProjectUploadMapImageInput, UploadFileInput,
    UploadSavedPath,
};
use crate::paths::UploadSubdir;
use crate::repositories::{characters, dynasties, factions, maps, projects};
use crate::uploads::filename::{generate_filename, generate_map_entity_filename};
use crate::uploads::storage::{delete_file_if_exists, write_file};
use crate::uploads::validation::{
    validate_size, validate_upload, UploadProfile, MAX_FILE_SIZE, MAX_IMAGE_SIZE,
};

fn save_generic<R: Runtime>(
    app: &AppHandle<R>,
    subdir: UploadSubdir,
    prefix: &str,
    input: &UploadFileInput,
    profile: UploadProfile,
    max_size: usize,
) -> Result<UploadSavedPath> {
    validate_size(input.file_bytes.len(), max_size)?;
    validate_upload(&input.file_name, &input.mime, profile, max_size)?;
    let filename = generate_filename(prefix, &input.file_name);
    let path = write_file(app, subdir, &filename, &input.file_bytes)?;
    Ok(UploadSavedPath { path })
}

pub fn uploads_save_map_image<R: Runtime>(
    app: &AppHandle<R>,
    input: UploadFileInput,
) -> Result<UploadSavedPath> {
    save_generic(
        app,
        UploadSubdir::Maps,
        "map",
        &input,
        UploadProfile::Default,
        MAX_IMAGE_SIZE,
    )
}

pub fn uploads_save_character_image<R: Runtime>(
    app: &AppHandle<R>,
    input: UploadFileInput,
) -> Result<UploadSavedPath> {
    save_generic(
        app,
        UploadSubdir::Characters,
        "character",
        &input,
        UploadProfile::Default,
        MAX_FILE_SIZE,
    )
}

pub fn uploads_save_trait_image<R: Runtime>(
    app: &AppHandle<R>,
    input: UploadFileInput,
) -> Result<UploadSavedPath> {
    save_generic(
        app,
        UploadSubdir::Traits,
        "trait",
        &input,
        UploadProfile::Default,
        MAX_FILE_SIZE,
    )
}

pub fn uploads_save_ambition_image<R: Runtime>(
    app: &AppHandle<R>,
    input: UploadFileInput,
) -> Result<UploadSavedPath> {
    save_generic(
        app,
        UploadSubdir::Ambitions,
        "ambition",
        &input,
        UploadProfile::Default,
        MAX_FILE_SIZE,
    )
}

pub fn uploads_save_appearance_image<R: Runtime>(
    app: &AppHandle<R>,
    input: UploadFileInput,
) -> Result<UploadSavedPath> {
    save_generic(
        app,
        UploadSubdir::Appearance,
        "appearance",
        &input,
        UploadProfile::Appearance,
        MAX_FILE_SIZE,
    )
}

pub fn characters_upload_image<R: Runtime>(
    app: &AppHandle<R>,
    connection: &Connection,
    input: CharacterUploadImageInput,
) -> Result<Character> {
    validate_size(input.file_bytes.len(), MAX_FILE_SIZE)?;
    validate_upload(
        &input.file_name,
        &input.mime,
        UploadProfile::Default,
        MAX_FILE_SIZE,
    )?;

    let filename = generate_filename("character", &input.file_name);
    let image_path = write_file(app, UploadSubdir::Characters, &filename, &input.file_bytes)?;
    characters::update_character_image_path(connection, input.id, &image_path)?;
    characters::get_character_by_id(
        connection,
        &GetCharacterInput {
            id: input.id,
            branch_id: input.branch_id,
        },
    )
}

pub fn factions_upload_image<R: Runtime>(
    app: &AppHandle<R>,
    connection: &Connection,
    input: FactionUploadImageInput,
) -> Result<Faction> {
    validate_size(input.file_bytes.len(), MAX_FILE_SIZE)?;
    validate_upload(
        &input.file_name,
        &input.mime,
        UploadProfile::Default,
        MAX_FILE_SIZE,
    )?;

    let filename = generate_filename("faction", &input.file_name);
    let image_path = write_file(app, UploadSubdir::Factions, &filename, &input.file_bytes)?;
    factions::update_faction_image_path(connection, input.id, &image_path)?;
    factions::get_faction_by_id(
        connection,
        &GetFactionInput {
            id: input.id,
            branch_id: input.branch_id,
        },
    )
}

pub fn factions_upload_banner<R: Runtime>(
    app: &AppHandle<R>,
    connection: &Connection,
    input: FactionUploadBannerInput,
) -> Result<Faction> {
    validate_size(input.file_bytes.len(), MAX_FILE_SIZE)?;
    validate_upload(
        &input.file_name,
        &input.mime,
        UploadProfile::Default,
        MAX_FILE_SIZE,
    )?;

    let filename = generate_filename("faction-banner", &input.file_name);
    let banner_path = write_file(app, UploadSubdir::Factions, &filename, &input.file_bytes)?;
    factions::update_faction_banner_path(connection, input.id, &banner_path)?;
    factions::get_faction_by_id(
        connection,
        &GetFactionInput {
            id: input.id,
            branch_id: input.branch_id,
        },
    )
}

pub fn dynasties_upload_image<R: Runtime>(
    app: &AppHandle<R>,
    connection: &Connection,
    input: DynastyUploadImageInput,
) -> Result<Dynasty> {
    validate_size(input.file_bytes.len(), MAX_FILE_SIZE)?;
    validate_upload(
        &input.file_name,
        &input.mime,
        UploadProfile::Default,
        MAX_FILE_SIZE,
    )?;

    let filename = generate_filename("dynasty", &input.file_name);
    let image_path = write_file(app, UploadSubdir::Dynasties, &filename, &input.file_bytes)?;
    dynasties::update_dynasty_image_path(connection, input.id, &image_path)?;
    dynasties::get_dynasty_by_id(
        connection,
        &GetDynastyInput {
            id: input.id,
            branch_id: input.branch_id,
        },
    )
}

pub fn maps_upload_image<R: Runtime>(
    app: &AppHandle<R>,
    connection: &Connection,
    input: MapUploadImageInput,
) -> Result<MapRecord> {
    validate_size(input.file_bytes.len(), MAX_IMAGE_SIZE)?;
    validate_upload(
        &input.file_name,
        &input.mime,
        UploadProfile::Default,
        MAX_IMAGE_SIZE,
    )?;

    let existing = maps::get_map_by_id(connection, &GetMapInput { id: input.map_id })?;

    if let Some(old_path) = existing.image_path.as_deref() {
        delete_file_if_exists(app, old_path)?;
    }

    let filename = generate_map_entity_filename(input.map_id, &input.file_name);
    let image_path = write_file(app, UploadSubdir::Maps, &filename, &input.file_bytes)?;
    maps::update_map_image_path(connection, input.map_id, &image_path)?;
    maps::get_map_by_id(connection, &GetMapInput { id: input.map_id })
}

pub fn projects_upload_map_image<R: Runtime>(
    app: &AppHandle<R>,
    connection: &Connection,
    input: ProjectUploadMapImageInput,
) -> Result<Project> {
    validate_size(input.file_bytes.len(), MAX_IMAGE_SIZE)?;
    validate_upload(
        &input.file_name,
        &input.mime,
        UploadProfile::Default,
        MAX_IMAGE_SIZE,
    )?;

    let filename = generate_filename("project-map", &input.file_name);
    let map_image_path = write_file(app, UploadSubdir::Maps, &filename, &input.file_bytes)?;
    projects::update_project_map_image_path(connection, input.project_id, &map_image_path)?;
    projects::get_project(
        connection,
        &GetProjectInput {
            id: input.project_id,
        },
    )
}
