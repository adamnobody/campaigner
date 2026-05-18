mod commands;
mod db;
mod error;
pub mod models;
mod paths;
pub mod repositories;
pub mod services;
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
        .invoke_handler(tauri::generate_handler![
            commands::app::app_health_command,
            commands::characters::characters_list_command,
            commands::characters::characters_get_command,
            commands::characters::characters_create_command,
            commands::characters::characters_update_command,
            commands::characters::characters_delete_command,
            commands::characters::characters_set_tags_command,
            commands::characters::characters_relationships_list_command,
            commands::characters::characters_relationships_create_command,
            commands::characters::characters_relationships_update_command,
            commands::characters::characters_relationships_delete_command,
            commands::characters::characters_graph_command,
            commands::projects::projects_list_command,
            commands::projects::projects_get_command,
            commands::projects::projects_create_command,
            commands::projects::projects_update_command,
            commands::projects::projects_delete_command,
            commands::notes::notes_list_command,
            commands::notes::notes_get_command,
            commands::notes::notes_create_command,
            commands::notes::notes_update_command,
            commands::notes::notes_delete_command,
            commands::notes::notes_set_tags_command,
            commands::tags::tags_list_command,
            commands::tags::tags_create_command,
            commands::tags::tags_delete_command,
            commands::timeline::timeline_list_command,
            commands::timeline::timeline_get_command,
            commands::timeline::timeline_create_command,
            commands::timeline::timeline_update_command,
            commands::timeline::timeline_delete_command,
            commands::timeline::timeline_reorder_command,
            commands::timeline::timeline_set_tags_command
        ])
        .run(tauri::generate_context!())
        .expect("failed to run tauri application");
}
