use rusqlite::{params, Connection};

use crate::error::Result;

type Migration = (i64, &'static str, &'static str);

const MIGRATIONS: &[Migration] = &[
    (0, "init", include_str!("../../migrations/000_init.sql")),
    (1, "tags", include_str!("../../migrations/001_tags.sql")),
    (
        2,
        "projects",
        include_str!("../../migrations/002_projects.sql"),
    ),
    (
        3,
        "branch_foundation",
        include_str!("../../migrations/003_branch_foundation.sql"),
    ),
    (
        4,
        "tag_associations",
        include_str!("../../migrations/004_tag_associations.sql"),
    ),
    (5, "notes", include_str!("../../migrations/005_notes.sql")),
    (
        6,
        "timeline",
        include_str!("../../migrations/006_timeline.sql"),
    ),
    (
        7,
        "characters",
        include_str!("../../migrations/007_characters.sql"),
    ),
    (
        8,
        "factions",
        include_str!("../../migrations/008_factions.sql"),
    ),
    (9, "dogmas", include_str!("../../migrations/009_dogmas.sql")),
    (
        10,
        "ambitions",
        include_str!("../../migrations/010_ambitions.sql"),
    ),
    (
        11,
        "character_traits",
        include_str!("../../migrations/011_character_traits.sql"),
    ),
    (
        12,
        "political_scales",
        include_str!("../../migrations/012_political_scales.sql"),
    ),
    (
        13,
        "graph_layouts",
        include_str!("../../migrations/013_graph_layouts.sql"),
    ),
    (
        14,
        "dynasties",
        include_str!("../../migrations/014_dynasties.sql"),
    ),
    (15, "maps", include_str!("../../migrations/015_maps.sql")),
    (
        16,
        "wiki_links",
        include_str!("../../migrations/016_wiki_links.sql"),
    ),
];

pub fn run_migrations(connection: &Connection) -> Result<()> {
    ensure_schema_migrations_table(connection)?;

    for &(version, name, sql) in load_migrations() {
        if is_migration_applied(connection, version)? {
            continue;
        }

        connection.execute_batch(sql)?;
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

fn load_migrations() -> &'static [Migration] {
    MIGRATIONS
}

fn is_migration_applied(connection: &Connection, version: i64) -> Result<bool> {
    let mut statement =
        connection.prepare("SELECT 1 FROM schema_migrations WHERE version = ?1 LIMIT 1")?;
    let mut rows = statement.query(params![version])?;
    Ok(rows.next()?.is_some())
}
