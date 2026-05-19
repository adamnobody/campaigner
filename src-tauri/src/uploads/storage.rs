use std::fs;
use std::path::Path;

use tauri::{AppHandle, Runtime};

use crate::error::{AppError, Result};
use crate::paths::{self, UploadSubdir};
use crate::uploads::web_path;

pub fn write_file<R: Runtime>(
    app: &AppHandle<R>,
    subdir: UploadSubdir,
    filename: &str,
    bytes: &[u8],
) -> Result<String> {
    if filename.contains('/') || filename.contains('\\') || filename.contains("..") {
        return Err(AppError::internal(
            "VALIDATION_ERROR",
            "Invalid upload filename",
        ));
    }

    let dir = paths::uploads_subdir(app, subdir)?;
    let disk_path = dir.join(filename);
    fs::write(&disk_path, bytes).map_err(AppError::from)?;
    Ok(web_path::web_path_from(subdir, filename))
}

pub fn delete_file_if_exists<R: Runtime>(app: &AppHandle<R>, web_path: &str) -> Result<()> {
    if web_path.trim().is_empty() {
        return Ok(());
    }

    let disk_path = match web_path::resolve_disk_path(app, web_path) {
        Ok(path) => path,
        Err(AppError::Internal { code, .. }) if code == "ASSET_NOT_FOUND" => return Ok(()),
        Err(error) => return Err(error),
    };

    if disk_path.is_file() {
        fs::remove_file(disk_path).map_err(AppError::from)?;
    }

    Ok(())
}

pub fn read_file_bytes(path: &Path) -> Result<Vec<u8>> {
    fs::read(path).map_err(AppError::from)
}
