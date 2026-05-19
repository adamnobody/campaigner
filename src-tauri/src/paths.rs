use std::path::PathBuf;
use std::str::FromStr;

use tauri::{AppHandle, Manager, Runtime};

use crate::error::{AppError, Result};

const DATABASE_FILE_NAME: &str = "campaigner.sqlite";
const UPLOADS_DIR_NAME: &str = "uploads";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum UploadSubdir {
    Maps,
    Characters,
    Factions,
    Dynasties,
    Traits,
    Ambitions,
    Appearance,
}

impl UploadSubdir {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Maps => "maps",
            Self::Characters => "characters",
            Self::Factions => "factions",
            Self::Dynasties => "dynasties",
            Self::Traits => "traits",
            Self::Ambitions => "ambitions",
            Self::Appearance => "appearance",
        }
    }

    pub fn parse(value: &str) -> Result<Self> {
        match value {
            "maps" => Ok(Self::Maps),
            "characters" => Ok(Self::Characters),
            "factions" => Ok(Self::Factions),
            "dynasties" => Ok(Self::Dynasties),
            "traits" => Ok(Self::Traits),
            "ambitions" => Ok(Self::Ambitions),
            "appearance" => Ok(Self::Appearance),
            _ => Err(AppError::internal(
                "ASSET_PATH_FORBIDDEN",
                format!("Unknown uploads subdir: {value}"),
            )),
        }
    }
}

impl FromStr for UploadSubdir {
    type Err = AppError;

    fn from_str(value: &str) -> Result<Self> {
        Self::parse(value)
    }
}

pub fn app_data_dir<R: Runtime>(app: &AppHandle<R>) -> Result<PathBuf> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|err| AppError::internal("PATH_RESOLVE_ERROR", err.to_string()))?;

    std::fs::create_dir_all(&dir)?;
    Ok(dir)
}

pub fn database_path<R: Runtime>(app: &AppHandle<R>) -> Result<PathBuf> {
    let mut db_path = app_data_dir(app)?;
    db_path.push(DATABASE_FILE_NAME);
    Ok(db_path)
}

pub fn uploads_root<R: Runtime>(app: &AppHandle<R>) -> Result<PathBuf> {
    let mut root = app_data_dir(app)?;
    root.push(UPLOADS_DIR_NAME);
    std::fs::create_dir_all(&root)?;
    Ok(root)
}

pub fn uploads_subdir<R: Runtime>(app: &AppHandle<R>, subdir: UploadSubdir) -> Result<PathBuf> {
    let mut path = uploads_root(app)?;
    path.push(subdir.as_str());
    std::fs::create_dir_all(&path)?;
    Ok(path)
}
