mod commands;
mod db;
mod error;
mod models;
mod paths;
pub mod specta;

use db::connection::{open_database, DatabaseState};
use db::migrations::run_migrations;
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let connection = open_database(app.handle())
                .map_err(|err| std::io::Error::other(err.to_string()))?;

            run_migrations(&connection).map_err(|err| std::io::Error::other(err.to_string()))?;

            app.manage(DatabaseState::new(connection));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![commands::app::app_health_command])
        .run(tauri::generate_context!())
        .expect("failed to run tauri application");
}
