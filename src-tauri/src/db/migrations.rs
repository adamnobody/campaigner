use std::path::Path;

use rusqlite::{params, Connection};

use crate::error::{AppError, Result};

type Migration = (i64, String, String);

pub fn run_migrations(connection: &Connection) -> Result<()> {
    ensure_schema_migrations_table(connection)?;

    let migrations = load_migrations()?;
    for (version, name, sql) in migrations {
        if is_migration_applied(connection, version)? {
            continue;
        }

        connection.execute_batch(&sql)?;
        connection.execute(
            "INSERT INTO schema_migrations (version, name) VALUES (?1, ?2)",
            params![version, name],
        )?;
    }

    Ok(())
}

fn ensure_schema_migrations_table(connection: &Connection) -> Result<()> {
    connection.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        "#,
    )?;

    Ok(())
}

fn load_migrations() -> Result<Vec<Migration>> {
    let migrations_dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("migrations");
    let mut migrations = Vec::new();

    for entry in std::fs::read_dir(&migrations_dir)? {
        let entry = entry?;
        if !entry.file_type()?.is_file() {
            continue;
        }

        let path = entry.path();
        if path.extension().and_then(|ext| ext.to_str()) != Some("sql") {
            continue;
        }

        let file_name = match path.file_name().and_then(|name| name.to_str()) {
            Some(name) => name,
            None => {
                return Err(AppError::internal(
                    "MIGRATION_FILENAME_ERROR",
                    format!("Invalid migration filename: {}", path.display()),
                ));
            }
        };

        let (version, name) = parse_migration_name(file_name)?;
        let sql = std::fs::read_to_string(&path)?;
        migrations.push((version, name, sql));
    }

    migrations.sort_by_key(|(version, _, _)| *version);
    Ok(migrations)
}

fn parse_migration_name(file_name: &str) -> Result<(i64, String)> {
    let stem = file_name
        .strip_suffix(".sql")
        .ok_or_else(|| AppError::internal("MIGRATION_EXTENSION_ERROR", file_name.to_string()))?;

    let (version_part, name_part) = stem.split_once('_').ok_or_else(|| {
        AppError::internal(
            "MIGRATION_NAME_ERROR",
            format!("Expected '<version>_<name>.sql', got '{file_name}'"),
        )
    })?;

    let version = version_part.parse::<i64>().map_err(|_| {
        AppError::internal(
            "MIGRATION_VERSION_ERROR",
            format!("Invalid migration version in '{file_name}'"),
        )
    })?;

    if name_part.trim().is_empty() {
        return Err(AppError::internal(
            "MIGRATION_NAME_ERROR",
            format!("Migration name is empty in '{file_name}'"),
        ));
    }

    Ok((version, name_part.to_string()))
}

fn is_migration_applied(connection: &Connection, version: i64) -> Result<bool> {
    let mut statement =
        connection.prepare("SELECT 1 FROM schema_migrations WHERE version = ?1 LIMIT 1")?;
    let mut rows = statement.query(params![version])?;
    Ok(rows.next()?.is_some())
}
