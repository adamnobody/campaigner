use std::path::Path;

use specta_typescript::Typescript;
use tauri_specta::{collect_commands, Builder};

use crate::models::app::AppHealthResponse;

mod codegen_commands {
    use super::AppHealthResponse;

    #[tauri::command]
    #[specta::specta]
    pub fn app_health() -> AppHealthResponse {
        AppHealthResponse {
            status: String::new(),
            database: String::new(),
            app_version: String::new(),
        }
    }
}

pub fn export_bindings(path: &Path) -> Result<(), specta_typescript::Error> {
    Builder::<tauri::Wry>::new()
        .commands(collect_commands![codegen_commands::app_health])
        .typ::<AppHealthResponse>()
        .export(Typescript::default(), path)
}
