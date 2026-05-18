use std::path::PathBuf;
use tauri::{AppHandle, Manager};

use crate::error::{AppError, Result};

const DATABASE_FILE_NAME: &str = "campaigner.sqlite";

pub fn app_data_dir(app: &AppHandle) -> Result<PathBuf> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|err| AppError::internal("PATH_RESOLVE_ERROR", err.to_string()))?;

    std::fs::create_dir_all(&dir)?;
    Ok(dir)
}

pub fn database_path(app: &AppHandle) -> Result<PathBuf> {
    let mut db_path = app_data_dir(app)?;
    db_path.push(DATABASE_FILE_NAME);
    Ok(db_path)
}
