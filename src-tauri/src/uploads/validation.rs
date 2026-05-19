use crate::error::{AppError, Result};

pub const MAX_FILE_SIZE: usize = 10 * 1024 * 1024;
pub const MAX_IMAGE_SIZE: usize = 50 * 1024 * 1024;

const DEFAULT_EXTENSIONS: &[&str] = &[".jpg", ".jpeg", ".png", ".webp", ".svg"];
const DEFAULT_MIME_TYPES: &[&str] = &[
    "image/jpeg",
    "image/jpg",
    "image/pjpeg",
    "image/png",
    "image/webp",
    "image/svg+xml",
];

const APPEARANCE_EXTENSIONS: &[&str] = &[".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif", ".avif"];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum UploadProfile {
    Default,
    Appearance,
}

pub fn validate_size(bytes_len: usize, max_size: usize) -> Result<()> {
    if bytes_len == 0 {
        return Err(AppError::internal(
            "VALIDATION_ERROR",
            "Uploaded file is empty",
        ));
    }

    if bytes_len > max_size {
        return Err(AppError::internal(
            "VALIDATION_ERROR",
            format!("File exceeds maximum size of {} bytes", max_size),
        ));
    }

    Ok(())
}

pub fn validate_upload(
    file_name: &str,
    mime: &str,
    profile: UploadProfile,
    _max_size: usize,
) -> Result<()> {
    let allowed_extensions = match profile {
        UploadProfile::Default => DEFAULT_EXTENSIONS,
        UploadProfile::Appearance => APPEARANCE_EXTENSIONS,
    };

    validate_extension(file_name, allowed_extensions)?;
    validate_mime(mime, file_name, profile)?;
    Ok(())
}

fn validate_extension(file_name: &str, allowed_extensions: &[&str]) -> Result<()> {
    let ext = crate::uploads::filename::extension_from_name(file_name);
    if allowed_extensions.iter().any(|allowed| *allowed == ext) {
        return Ok(());
    }

    Err(AppError::internal(
        "VALIDATION_ERROR",
        format!(
            "Invalid file type. Allowed extensions: {}",
            allowed_extensions.join(", ")
        ),
    ))
}

fn validate_mime(mime: &str, file_name: &str, profile: UploadProfile) -> Result<()> {
    let mime = mime.trim().to_lowercase();
    let ext = crate::uploads::filename::extension_from_name(file_name);

    let ext_allowed = match profile {
        UploadProfile::Default => DEFAULT_EXTENSIONS.contains(&ext.as_str()),
        UploadProfile::Appearance => APPEARANCE_EXTENSIONS.contains(&ext.as_str()),
    };

    if !ext_allowed {
        return Err(AppError::internal(
            "VALIDATION_ERROR",
            "Invalid file type for upload profile",
        ));
    }

    if profile == UploadProfile::Appearance
        && (mime.is_empty() || mime == "application/octet-stream")
    {
        return Ok(());
    }

    if profile == UploadProfile::Appearance && mime.starts_with("image/") {
        return Ok(());
    }

    let mime_allowed = DEFAULT_MIME_TYPES.iter().any(|allowed| {
        if allowed.ends_with("/*") {
            mime.starts_with(&allowed[..allowed.len() - 1])
        } else {
            mime == *allowed
        }
    });

    let mime_unknown_but_ext_ok = mime.is_empty() || mime == "application/octet-stream";

    if mime_allowed || mime_unknown_but_ext_ok {
        return Ok(());
    }

    Err(AppError::internal(
        "VALIDATION_ERROR",
        format!(
            "Invalid file type. Allowed extensions: {}",
            DEFAULT_EXTENSIONS.join(", ")
        ),
    ))
}
