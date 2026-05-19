use std::sync::Mutex;

use rusqlite::Connection;
use tauri::AppHandle;

use crate::error::Result;
use crate::paths::database_path;

pub struct DatabaseState {
    pub connection: Mutex<Connection>,
}

impl DatabaseState {
    pub fn new(connection: Connection) -> Self {
        Self {
            connection: Mutex::new(connection),
        }
    }
}

pub fn open_database(app: &AppHandle) -> Result<Connection> {
    let db_path = database_path(app)?;
    let connection = Connection::open(db_path)?;

    connection.execute_batch(
        r#"
        PRAGMA foreign_keys = ON;
        PRAGMA journal_mode = WAL;
        "#,
    )?;

    Ok(connection)
}
