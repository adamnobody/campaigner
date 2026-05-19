use std::fs;
use std::path::Path;

use tauri::{AppHandle, Runtime};

use crate::error::{AppError, Result};
use crate::paths::{self, UploadSubdir};
use crate::uploads::filename::generate_filename;
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

/// Decode `data:<mime>;base64,...` and write under uploads. Returns web path `/uploads/...`.
pub fn save_base64_data_url<R: Runtime>(
    app: &AppHandle<R>,
    subdir: UploadSubdir,
    data_url: &str,
) -> Result<Option<String>> {
    let Some((mime, bytes)) = decode_data_url(data_url)? else {
        return Ok(None);
    };
    let ext = mime_to_ext(&mime);
    let filename = generate_filename("asset", &format!("file.{ext}"));
    let path = write_file(app, subdir, &filename, &bytes)?;
    Ok(Some(path))
}

/// Read upload file and return data URL, or None if missing.
pub fn read_web_path_as_data_url<R: Runtime>(
    app: &AppHandle<R>,
    web_path: &str,
) -> Result<Option<String>> {
    if web_path.trim().is_empty() {
        return Ok(None);
    }
    let disk_path = match crate::uploads::web_path::resolve_disk_path(app, web_path) {
        Ok(path) => path,
        Err(AppError::Internal { code, .. }) if code == "ASSET_NOT_FOUND" => return Ok(None),
        Err(error) => return Err(error),
    };
    if !disk_path.is_file() {
        return Ok(None);
    }
    let bytes = read_file_bytes(&disk_path)?;
    let ext = disk_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    let mime = ext_to_mime(&ext);
    let encoded = base64_encode(&bytes);
    Ok(Some(format!("data:{mime};base64,{encoded}")))
}

fn decode_data_url(data_url: &str) -> Result<Option<(String, Vec<u8>)>> {
    let Some(rest) = data_url.strip_prefix("data:") else {
        return Ok(None);
    };
    let Some((mime, data)) = rest.split_once(";base64,") else {
        return Ok(None);
    };
    let bytes = base64_decode(data)?;
    Ok(Some((mime.to_string(), bytes)))
}

fn mime_to_ext(mime: &str) -> &'static str {
    match mime {
        "image/png" => "png",
        "image/jpeg" => "jpg",
        "image/svg+xml" => "svg",
        "image/webp" => "webp",
        "image/gif" => "gif",
        _ => "png",
    }
}

fn ext_to_mime(ext: &str) -> &'static str {
    match ext {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "svg" => "image/svg+xml",
        "webp" => "image/webp",
        "gif" => "image/gif",
        _ => "application/octet-stream",
    }
}

fn base64_encode(bytes: &[u8]) -> String {
    use base64::Engine;
    base64::engine::general_purpose::STANDARD.encode(bytes)
}

fn base64_decode(data: &str) -> Result<Vec<u8>> {
    use base64::Engine;
    base64::engine::general_purpose::STANDARD
        .decode(data)
        .map_err(|error| AppError::internal("BASE64_DECODE_ERROR", error.to_string()))
}
