use std::path::{Component, Path, PathBuf};

use tauri::{AppHandle, Runtime};

use crate::error::{AppError, Result};
use crate::paths::{self, UploadSubdir};

pub fn web_path_from(subdir: UploadSubdir, filename: &str) -> String {
    format!("/uploads/{}/{}", subdir.as_str(), filename)
}

pub fn parse_web_path(web_path: &str) -> Result<(UploadSubdir, String)> {
    let normalized = web_path.trim();
    if normalized.contains("..") {
        return Err(AppError::internal(
            "ASSET_PATH_FORBIDDEN",
            "Path traversal is not allowed",
        ));
    }

    let without_query = normalized.split('?').next().unwrap_or(normalized);
    let path = if without_query.starts_with('/') {
        without_query.to_string()
    } else {
        format!("/{without_query}")
    };

    let mut parts = path.trim_start_matches('/').split('/');
    let uploads = parts.next();
    if uploads != Some("uploads") {
        return Err(AppError::internal(
            "ASSET_PATH_FORBIDDEN",
            "Only uploads assets are allowed",
        ));
    }

    let subdir_name = parts
        .next()
        .ok_or_else(|| AppError::internal("ASSET_PATH_FORBIDDEN", "Missing uploads subdir"))?;
    let subdir = UploadSubdir::parse(subdir_name)?;

    let filename = parts
        .next()
        .ok_or_else(|| AppError::internal("ASSET_PATH_FORBIDDEN", "Missing filename"))?;

    if parts.next().is_some() {
        return Err(AppError::internal(
            "ASSET_PATH_FORBIDDEN",
            "Nested upload paths are not allowed",
        ));
    }

    if filename.is_empty() || filename.contains('/') || filename.contains('\\') {
        return Err(AppError::internal(
            "ASSET_PATH_FORBIDDEN",
            "Invalid upload filename",
        ));
    }

    Ok((subdir, filename.to_string()))
}

pub fn resolve_disk_path<R: Runtime>(app: &AppHandle<R>, web_path: &str) -> Result<PathBuf> {
    let (subdir, filename) = parse_web_path(web_path)?;
    let root = paths::uploads_root(app)?;
    let candidate = paths::uploads_subdir(app, subdir)?.join(filename);

    for component in candidate.components() {
        if matches!(component, Component::ParentDir) {
            return Err(AppError::internal(
                "ASSET_PATH_FORBIDDEN",
                "Path traversal is not allowed",
            ));
        }
    }

    let canonical_root = root.canonicalize().unwrap_or(root);
    let canonical_file = candidate
        .canonicalize()
        .map_err(|_| AppError::internal("ASSET_NOT_FOUND", "Upload asset file was not found"))?;

    if !canonical_file.starts_with(&canonical_root) {
        return Err(AppError::internal(
            "ASSET_PATH_FORBIDDEN",
            "Resolved path escapes uploads root",
        ));
    }

    Ok(canonical_file)
}

pub fn content_type_for_path(path: &Path) -> &'static str {
    match path
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or("")
        .to_lowercase()
        .as_str()
    {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "svg" => "image/svg+xml",
        "webp" => "image/webp",
        "gif" => "image/gif",
        "avif" => "image/avif",
        _ => "application/octet-stream",
    }
}
