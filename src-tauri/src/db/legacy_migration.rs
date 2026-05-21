use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

use rusqlite::{params, Connection, OpenFlags};
use tauri::{AppHandle, Runtime};

use crate::error::{AppError, Result};
use crate::models::legacy_migration::{LegacyMigrationPreview, LegacyMigrationReport};
use crate::paths::{database_path, uploads_root};

const LEGACY_APP_DIR_NAME: &str = "campaigner";
const LEGACY_DATABASE_FILE_NAME: &str = "campaigner.sqlite";
const LEGACY_UPLOADS_DIR_NAME: &str = "uploads";
const LEGACY_IMPORT_MARKER_VERSION: i64 = 999;
const LEGACY_IMPORT_MARKER_NAME: &str = "legacy_electron_import";

struct TableCopy {
    table: &'static str,
    columns: &'static str,
}

struct SchemaMigrationsInfo {
    has_applied_at: bool,
}

enum MarkerStatus {
    Present,
    Absent(SchemaMigrationsInfo),
}

const TABLE_COPIES: &[TableCopy] = &[
    TableCopy {
        table: "projects",
        columns: "id, name, description, status, map_image_path, created_at, updated_at",
    },
    TableCopy {
        table: "scenario_branches",
        columns: "id, project_id, name, parent_branch_id, base_revision, is_main, created_at, updated_at",
    },
    TableCopy {
        table: "ambitions_catalog",
        columns: "id, name, description, icon_path, is_custom, project_id, created_at, updated_at",
    },
    TableCopy {
        table: "ambition_exclusions",
        columns: "ambition_id, excluded_ambition_id, created_at",
    },
    TableCopy {
        table: "characters",
        columns: "id, project_id, state_id, name, title, race, character_class, level, status, bio, appearance, personality, backstory, notes, image_path, created_branch_id, created_at, updated_at",
    },
    TableCopy {
        table: "character_traits",
        columns: "id, project_id, name, description, image_path, is_predefined, sort_order, created_at, updated_at",
    },
    TableCopy {
        table: "character_trait_assignments",
        columns: "id, character_id, trait_id, assigned_at",
    },
    TableCopy {
        table: "character_trait_exclusions",
        columns: "trait_id, excluded_trait_id, created_at",
    },
    TableCopy {
        table: "character_relationships",
        columns: "id, project_id, source_character_id, target_character_id, relationship_type, custom_label, description, is_bidirectional, created_branch_id, created_at",
    },
    TableCopy {
        table: "character_factions",
        columns: "character_id, faction_id, created_at",
    },
    TableCopy {
        table: "factions",
        columns: "id, project_id, name, kind, type, motto, description, history, goals, headquarters, territory, treasury, population, army_size, navy_size, territory_km2, annual_income, annual_expenses, members_count, influence, status, color, secondary_color, image_path, banner_path, founded_date, disbanded_date, parent_faction_id, ruling_dynasty_id, ruler_character_id, sort_order, created_branch_id, created_at, updated_at",
    },
    TableCopy {
        table: "faction_ranks",
        columns: "id, faction_id, name, level, description, permissions, icon, color",
    },
    TableCopy {
        table: "faction_members",
        columns: "id, faction_id, character_id, rank_id, role, joined_date, left_date, is_active, notes",
    },
    TableCopy {
        table: "faction_relations",
        columns: "id, project_id, source_faction_id, target_faction_id, relation_type, custom_label, description, started_date, is_bidirectional, created_branch_id, created_at",
    },
    TableCopy {
        table: "faction_policies",
        columns: "id, faction_id, title, type, status, category, enacted_date, description, sort_order, created_at, updated_at",
    },
    TableCopy {
        table: "faction_ambitions",
        columns: "id, faction_id, ambition_id, created_at",
    },
    TableCopy {
        table: "faction_custom_metrics",
        columns: "id, faction_id, name, value, unit, sort_order, created_at, updated_at",
    },
    TableCopy {
        table: "dynasties",
        columns: "id, project_id, name, motto, description, history, status, color, secondary_color, image_path, founded_date, extinct_date, founder_id, current_leader_id, heir_id, linked_faction_id, sort_order, created_branch_id, created_at, updated_at",
    },
    TableCopy {
        table: "dynasty_members",
        columns: "id, dynasty_id, character_id, generation, role, birth_date, death_date, is_main_line, notes, graph_x, graph_y",
    },
    TableCopy {
        table: "dynasty_events",
        columns: "id, dynasty_id, title, description, event_date, importance, sort_order, created_at",
    },
    TableCopy {
        table: "dynasty_family_links",
        columns: "id, dynasty_id, source_character_id, target_character_id, relation_type, custom_label",
    },
    TableCopy {
        table: "political_scales",
        columns: "id, code, entity_type, category, name, left_pole_label, right_pole_label, left_pole_description, right_pole_description, icon, zones_json, is_system, project_id, sort_order, created_at, updated_at",
    },
    TableCopy {
        table: "political_scale_assignments",
        columns: "id, scale_id, entity_type, entity_id, value, enabled, note, created_at, updated_at",
    },
    TableCopy {
        table: "dogmas",
        columns: "id, project_id, title, category, description, impact, exceptions, is_public, importance, status, sort_order, icon, color, created_branch_id, created_at, updated_at",
    },
    TableCopy {
        table: "notes",
        columns: "id, project_id, folder_id, title, content, format, note_type, is_pinned, created_branch_id, created_at, updated_at",
    },
    TableCopy {
        table: "wiki_links",
        columns: "id, project_id, source_note_id, target_note_id, label, created_branch_id, created_at",
    },
    TableCopy {
        table: "tags",
        columns: "id, project_id, name, color",
    },
    TableCopy {
        table: "tag_associations",
        columns: "id, tag_id, entity_type, entity_id",
    },
    TableCopy {
        table: "timeline_events",
        columns: "id, project_id, title, description, event_date, sort_order, era, era_color, linked_note_id, created_branch_id, created_at, updated_at",
    },
    TableCopy {
        table: "maps",
        columns: "id, project_id, parent_map_id, parent_marker_id, name, image_path, created_branch_id, created_at, updated_at",
    },
    TableCopy {
        table: "map_markers",
        columns: "id, map_id, title, description, position_x, position_y, color, icon, linked_note_id, child_map_id, created_branch_id, created_at, updated_at",
    },
    TableCopy {
        table: "map_territories",
        columns: "id, map_id, name, description, color, opacity, border_color, border_width, points, faction_id, smoothing, sort_order, created_branch_id, created_at, updated_at",
    },
    TableCopy {
        table: "branch_overrides",
        columns: "id, branch_id, entity_type, entity_id, op, patch_json, created_at, updated_at",
    },
    TableCopy {
        table: "graph_layouts",
        columns: "id, project_id, branch_id, graph_type, layout_data, created_at, updated_at",
    },
];

const SYSTEM_TABLE_DELETE_SQL: &str = r#"
DELETE FROM ambition_exclusions;
DELETE FROM faction_ambitions;
DELETE FROM ambitions_catalog;
DELETE FROM political_scale_assignments;
DELETE FROM political_scales;
DELETE FROM character_trait_exclusions;
DELETE FROM character_trait_assignments;
DELETE FROM character_traits;
"#;

const PATH_NORMALIZATION_SQL: &str = r#"
UPDATE projects SET map_image_path = REPLACE(map_image_path, '\', '/') WHERE map_image_path IS NOT NULL;
UPDATE characters SET image_path = REPLACE(image_path, '\', '/') WHERE image_path IS NOT NULL;
UPDATE factions SET image_path = REPLACE(image_path, '\', '/') WHERE image_path IS NOT NULL;
UPDATE factions SET banner_path = REPLACE(banner_path, '\', '/') WHERE banner_path IS NOT NULL;
UPDATE dynasties SET image_path = REPLACE(image_path, '\', '/') WHERE image_path IS NOT NULL;
UPDATE maps SET image_path = REPLACE(image_path, '\', '/') WHERE image_path IS NOT NULL;
UPDATE ambitions_catalog SET icon_path = REPLACE(icon_path, '\', '/') WHERE icon_path != '';
UPDATE character_traits SET image_path = REPLACE(image_path, '\', '/') WHERE image_path != '';
"#;

const AUTOINCREMENT_TABLES: &[&str] = &[
    "projects",
    "scenario_branches",
    "ambitions_catalog",
    "characters",
    "character_traits",
    "character_trait_assignments",
    "character_relationships",
    "factions",
    "faction_ranks",
    "faction_members",
    "faction_relations",
    "faction_policies",
    "faction_ambitions",
    "faction_custom_metrics",
    "dynasties",
    "dynasty_members",
    "dynasty_events",
    "dynasty_family_links",
    "political_scales",
    "political_scale_assignments",
    "dogmas",
    "notes",
    "wiki_links",
    "tags",
    "tag_associations",
    "timeline_events",
    "maps",
    "map_markers",
    "map_territories",
    "branch_overrides",
    "graph_layouts",
];

const REPORT_TABLES: &[&str] = &["projects", "characters", "factions", "notes"];

pub fn check_legacy_migration_available<R: Runtime>(
    _app: &AppHandle<R>,
    connection: &Connection,
) -> Result<Option<LegacyMigrationPreview>> {
    let Some(source_path) = legacy_database_path() else {
        return Ok(None);
    };

    if !source_path.is_file() {
        return Ok(None);
    }

    if count_rows(connection, "projects")? > 0 {
        return Ok(None);
    }

    if matches!(marker_status(connection)?, MarkerStatus::Present) {
        return Ok(None);
    }

    let old_connection = open_readonly_uri_connection(&source_path)?;
    let preview = LegacyMigrationPreview {
        projects: count_rows_i32(&old_connection, "projects")?,
        characters: count_rows_i32(&old_connection, "characters")?,
        factions: count_rows_i32(&old_connection, "factions")?,
        notes: count_rows_i32(&old_connection, "notes")?,
        source_path: source_path.display().to_string(),
    };

    tracing::info!(
        source = %preview.source_path,
        projects = preview.projects,
        characters = preview.characters,
        factions = preview.factions,
        notes = preview.notes,
        "legacy electron migration available"
    );

    Ok(Some(preview))
}

pub fn run_legacy_migration<R: Runtime>(app: &AppHandle<R>) -> Result<LegacyMigrationReport> {
    let source_path = legacy_database_path().ok_or_else(|| {
        AppError::internal(
            "LEGACY_MIGRATION_UNAVAILABLE",
            "Legacy Electron database path is only available on Windows",
        )
    })?;

    if !source_path.is_file() {
        return Err(AppError::internal(
            "LEGACY_MIGRATION_UNAVAILABLE",
            format!("Legacy database not found: {}", source_path.display()),
        ));
    }

    let target_uploads_root = uploads_root(app)?;
    let source_uploads_root = legacy_uploads_path().ok_or_else(|| {
        AppError::internal(
            "LEGACY_MIGRATION_UNAVAILABLE",
            "Legacy Electron uploads path is only available on Windows",
        )
    })?;

    tracing::info!(
        source = %source_path.display(),
        "legacy electron migration started"
    );

    let target_path = database_path(app)?;
    let connection = open_target_uri_connection(&target_path)?;
    let imported_counts = run_database_import(&connection, &source_path)?;

    let mut errors = Vec::new();
    let uploads_copied =
        copy_uploads_skip_existing(&source_uploads_root, &target_uploads_root, &mut errors);

    tracing::info!(
        projects = imported_counts.get("projects").copied().unwrap_or_default(),
        characters = imported_counts
            .get("characters")
            .copied()
            .unwrap_or_default(),
        factions = imported_counts.get("factions").copied().unwrap_or_default(),
        notes = imported_counts.get("notes").copied().unwrap_or_default(),
        uploads_copied,
        upload_errors = errors.len(),
        "legacy electron migration finished"
    );

    Ok(LegacyMigrationReport {
        imported_counts,
        uploads_copied,
        errors,
    })
}

pub fn skip_legacy_migration(connection: &Connection) -> Result<()> {
    match marker_status(connection)? {
        MarkerStatus::Present => Ok(()),
        MarkerStatus::Absent(info) => {
            insert_marker(connection, &info)?;
            tracing::info!("legacy electron migration skipped by user");
            Ok(())
        }
    }
}

fn run_database_import(
    connection: &Connection,
    source_path: &Path,
) -> Result<HashMap<String, i32>> {
    if count_rows(connection, "projects")? > 0 {
        return Err(AppError::internal(
            "LEGACY_MIGRATION_TARGET_NOT_EMPTY",
            "Legacy migration can only run when the new database has no projects",
        ));
    }

    let marker_info = match marker_status(connection)? {
        MarkerStatus::Present => {
            return Err(AppError::internal(
                "LEGACY_MIGRATION_ALREADY_HANDLED",
                "Legacy migration was already imported or skipped",
            ));
        }
        MarkerStatus::Absent(info) => info,
    };

    let source_uri = sqlite_readonly_uri(source_path);
    connection.execute("ATTACH DATABASE ?1 AS old", params![source_uri])?;

    let import_result = run_attached_import(connection, &marker_info);
    let detach_result = connection.execute("DETACH DATABASE old", []);

    match (import_result, detach_result) {
        (Ok(report), Ok(_)) => Ok(report),
        (Err(error), detach) => {
            if let Err(detach_error) = detach {
                tracing::warn!(
                    ?detach_error,
                    "failed to detach legacy database after rollback"
                );
            }
            Err(error)
        }
        (Ok(_), Err(detach_error)) => Err(AppError::Database(detach_error)),
    }
}

fn run_attached_import(
    connection: &Connection,
    marker_info: &SchemaMigrationsInfo,
) -> Result<HashMap<String, i32>> {
    connection.execute_batch("PRAGMA foreign_keys = OFF; BEGIN IMMEDIATE;")?;

    let import_result = (|| {
        connection.execute_batch(SYSTEM_TABLE_DELETE_SQL)?;

        for table in TABLE_COPIES {
            let sql = format!(
                "INSERT INTO main.{table} ({columns}) SELECT {columns} FROM old.{table}",
                table = table.table,
                columns = table.columns
            );
            tracing::debug!(table = table.table, "copying legacy table");
            connection.execute(&sql, [])?;
        }

        connection.execute_batch(PATH_NORMALIZATION_SQL)?;
        refresh_sqlite_sequences(connection)?;
        ensure_no_foreign_key_violations(connection)?;
        insert_marker(connection, marker_info)?;

        let imported_counts = collect_imported_counts(connection)?;
        connection.execute_batch("COMMIT; PRAGMA foreign_keys = ON;")?;
        Ok(imported_counts)
    })();

    match import_result {
        Ok(imported_counts) => Ok(imported_counts),
        Err(error) => {
            tracing::warn!(?error, "legacy electron migration failed, rolling back");
            let _ = connection.execute_batch("ROLLBACK; PRAGMA foreign_keys = ON;");
            Err(error)
        }
    }
}

fn read_schema_migrations_info(connection: &Connection) -> Result<SchemaMigrationsInfo> {
    let ddl: String = connection.query_row(
        "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'",
        [],
        |row| row.get(0),
    )?;
    tracing::debug!(ddl = %ddl, "schema_migrations DDL loaded");

    let mut statement = connection.prepare("PRAGMA table_info(schema_migrations)")?;
    let columns = statement
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?.to_uppercase(),
            ))
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    let Some((_, version_type)) = columns.iter().find(|(name, _)| name == "version") else {
        return Err(AppError::internal(
            "LEGACY_MIGRATION_SCHEMA_ERROR",
            "schema_migrations.version column not found",
        ));
    };

    if !version_type.contains("INT") {
        return Err(AppError::internal(
            "LEGACY_MIGRATION_SCHEMA_ERROR",
            format!("schema_migrations.version must be INTEGER, got {version_type}"),
        ));
    }

    if !columns.iter().any(|(name, _)| name == "name") {
        return Err(AppError::internal(
            "LEGACY_MIGRATION_SCHEMA_ERROR",
            "schema_migrations.name column not found",
        ));
    }

    Ok(SchemaMigrationsInfo {
        has_applied_at: columns.iter().any(|(name, _)| name == "applied_at"),
    })
}

fn marker_status(connection: &Connection) -> Result<MarkerStatus> {
    let info = read_schema_migrations_info(connection)?;

    let marker_count: i64 = connection.query_row(
        "SELECT COUNT(*) FROM schema_migrations WHERE name = ?1",
        params![LEGACY_IMPORT_MARKER_NAME],
        |row| row.get(0),
    )?;

    if marker_count > 0 {
        return Ok(MarkerStatus::Present);
    }

    let version_name: Option<String> = connection
        .query_row(
            "SELECT name FROM schema_migrations WHERE version = ?1 LIMIT 1",
            params![LEGACY_IMPORT_MARKER_VERSION],
            |row| row.get(0),
        )
        .map(Some)
        .or_else(|err| match err {
            rusqlite::Error::QueryReturnedNoRows => Ok(None),
            _ => Err(err),
        })?;

    if let Some(name) = version_name {
        return Err(AppError::internal(
            "LEGACY_MIGRATION_VERSION_CONFLICT",
            format!(
                "schema_migrations version {LEGACY_IMPORT_MARKER_VERSION} is already used by {name}"
            ),
        ));
    }

    Ok(MarkerStatus::Absent(info))
}

fn insert_marker(connection: &Connection, info: &SchemaMigrationsInfo) -> Result<()> {
    if info.has_applied_at {
        connection.execute(
            "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?1, ?2, datetime('now'))",
            params![LEGACY_IMPORT_MARKER_VERSION, LEGACY_IMPORT_MARKER_NAME],
        )?;
    } else {
        connection.execute(
            "INSERT INTO schema_migrations (version, name) VALUES (?1, ?2)",
            params![LEGACY_IMPORT_MARKER_VERSION, LEGACY_IMPORT_MARKER_NAME],
        )?;
    }

    Ok(())
}

fn refresh_sqlite_sequences(connection: &Connection) -> Result<()> {
    for table in AUTOINCREMENT_TABLES {
        connection.execute(
            "DELETE FROM sqlite_sequence WHERE name = ?1",
            params![table],
        )?;
        let sql = format!(
            "INSERT INTO sqlite_sequence (name, seq) SELECT ?1, COALESCE(MAX(id), 0) FROM {table}"
        );
        connection.execute(&sql, params![table])?;
    }

    Ok(())
}

fn ensure_no_foreign_key_violations(connection: &Connection) -> Result<()> {
    let mut statement = connection.prepare("PRAGMA foreign_key_check")?;
    let mut rows = statement.query([])?;
    let mut violations = Vec::new();

    while let Some(row) = rows.next()? {
        let table: String = row.get(0)?;
        let rowid: Option<i64> = row.get(1)?;
        let parent: String = row.get(2)?;
        let fkid: i64 = row.get(3)?;
        violations.push(format!(
            "table={table}, rowid={rowid:?}, parent={parent}, fkid={fkid}"
        ));

        if violations.len() >= 5 {
            break;
        }
    }

    if !violations.is_empty() {
        return Err(AppError::internal(
            "LEGACY_MIGRATION_FOREIGN_KEY_CHECK_FAILED",
            format!("Foreign key check failed: {}", violations.join("; ")),
        ));
    }

    Ok(())
}

fn collect_imported_counts(connection: &Connection) -> Result<HashMap<String, i32>> {
    let mut counts = HashMap::new();

    for table in REPORT_TABLES {
        counts.insert((*table).to_string(), count_rows_i32(connection, table)?);
    }

    Ok(counts)
}

fn count_rows(connection: &Connection, table: &str) -> Result<i64> {
    let sql = format!("SELECT COUNT(*) FROM {table}");
    Ok(connection.query_row(&sql, [], |row| row.get(0))?)
}

fn count_rows_i32(connection: &Connection, table: &str) -> Result<i32> {
    let count = count_rows(connection, table)?;
    i32::try_from(count).map_err(|_| {
        AppError::internal(
            "LEGACY_MIGRATION_COUNT_OVERFLOW",
            format!("Row count for {table} is too large to report"),
        )
    })
}

fn open_target_uri_connection(path: &Path) -> Result<Connection> {
    let flags = OpenFlags::SQLITE_OPEN_READ_WRITE | OpenFlags::SQLITE_OPEN_URI;
    Ok(Connection::open_with_flags(path, flags)?)
}

fn open_readonly_uri_connection(path: &Path) -> Result<Connection> {
    let uri = sqlite_readonly_uri(path);
    let flags = OpenFlags::SQLITE_OPEN_READ_ONLY | OpenFlags::SQLITE_OPEN_URI;
    Ok(Connection::open_with_flags(uri, flags)?)
}

fn sqlite_readonly_uri(path: &Path) -> String {
    let normalized = path.to_string_lossy().replace('\\', "/");
    let prefix = if normalized.starts_with('/') {
        "file:"
    } else {
        "file:///"
    };

    format!(
        "{prefix}{}?mode=ro",
        percent_encode_sqlite_path(&normalized)
    )
}

fn percent_encode_sqlite_path(path: &str) -> String {
    let mut encoded = String::new();

    for byte in path.bytes() {
        let keep =
            byte.is_ascii_alphanumeric() || matches!(byte, b'/' | b':' | b'-' | b'_' | b'.' | b'~');

        if keep {
            encoded.push(byte as char);
        } else {
            encoded.push_str(&format!("%{byte:02X}"));
        }
    }

    encoded
}

fn copy_uploads_skip_existing(
    source_root: &Path,
    target_root: &Path,
    errors: &mut Vec<String>,
) -> bool {
    if !source_root.is_dir() {
        tracing::info!(
            source = %source_root.display(),
            "legacy uploads directory not found, skipping copy"
        );
        return false;
    }

    copy_uploads_dir(source_root, source_root, target_root, errors);
    true
}

fn copy_uploads_dir(
    source_root: &Path,
    current_dir: &Path,
    target_root: &Path,
    errors: &mut Vec<String>,
) {
    let entries = match fs::read_dir(current_dir) {
        Ok(entries) => entries,
        Err(error) => {
            push_upload_error(
                errors,
                format!(
                    "Failed to read uploads directory {}: {error}",
                    current_dir.display()
                ),
            );
            return;
        }
    };

    for entry in entries {
        let entry = match entry {
            Ok(entry) => entry,
            Err(error) => {
                push_upload_error(errors, format!("Failed to read uploads entry: {error}"));
                continue;
            }
        };

        let source_path = entry.path();
        let relative_path = match source_path.strip_prefix(source_root) {
            Ok(path) => path,
            Err(error) => {
                push_upload_error(
                    errors,
                    format!(
                        "Failed to resolve uploads path {}: {error}",
                        source_path.display()
                    ),
                );
                continue;
            }
        };
        let target_path = target_root.join(relative_path);

        let file_type = match entry.file_type() {
            Ok(file_type) => file_type,
            Err(error) => {
                push_upload_error(
                    errors,
                    format!(
                        "Failed to inspect uploads entry {}: {error}",
                        source_path.display()
                    ),
                );
                continue;
            }
        };

        if file_type.is_dir() {
            if let Err(error) = fs::create_dir_all(&target_path) {
                push_upload_error(
                    errors,
                    format!(
                        "Failed to create uploads directory {}: {error}",
                        target_path.display()
                    ),
                );
                continue;
            }
            copy_uploads_dir(source_root, &source_path, target_root, errors);
            continue;
        }

        if !file_type.is_file() {
            continue;
        }

        if target_path.exists() {
            push_upload_error(
                errors,
                format!("Skipped existing upload: {}", target_path.display()),
            );
            continue;
        }

        if let Some(parent) = target_path.parent() {
            if let Err(error) = fs::create_dir_all(parent) {
                push_upload_error(
                    errors,
                    format!(
                        "Failed to create uploads directory {}: {error}",
                        parent.display()
                    ),
                );
                continue;
            }
        }

        if let Err(error) = fs::copy(&source_path, &target_path) {
            push_upload_error(
                errors,
                format!(
                    "Failed to copy upload {} to {}: {error}",
                    source_path.display(),
                    target_path.display()
                ),
            );
        }
    }
}

fn push_upload_error(errors: &mut Vec<String>, message: String) {
    tracing::warn!(message = %message, "legacy uploads copy warning");
    errors.push(message);
}

fn legacy_database_path() -> Option<PathBuf> {
    legacy_app_data_path().map(|path| path.join(LEGACY_DATABASE_FILE_NAME))
}

fn legacy_uploads_path() -> Option<PathBuf> {
    legacy_app_data_path().map(|path| path.join(LEGACY_UPLOADS_DIR_NAME))
}

fn legacy_app_data_path() -> Option<PathBuf> {
    #[cfg(windows)]
    {
        std::env::var_os("APPDATA")
            .map(PathBuf::from)
            .map(|path| path.join(LEGACY_APP_DIR_NAME))
    }

    #[cfg(not(windows))]
    {
        None
    }
}
