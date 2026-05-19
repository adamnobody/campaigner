use rusqlite::{params, params_from_iter, types::Value as SqlValue, Connection, OptionalExtension};

use crate::error::{AppError, Result};
use crate::models::ambition::{
    Ambition, AssignFactionAmbitionInput, CreateAmbitionInput, DeleteAmbitionInput,
    GetAmbitionsCatalogInput, GetFactionAmbitionsInput, UnassignFactionAmbitionInput,
    UpdateAmbitionExclusionsInput, UpdateAmbitionInput,
};

#[derive(Debug, Clone)]
struct AmbitionRow {
    id: i32,
    name: String,
    description: String,
    icon_path: String,
    is_custom: bool,
    project_id: Option<i32>,
    created_at: String,
    updated_at: String,
}

pub fn get_catalog(
    connection: &Connection,
    input: &GetAmbitionsCatalogInput,
) -> Result<Vec<Ambition>> {
    super::ambitions_seed::seed_builtin_catalog(connection)?;
    let mut statement = connection.prepare(
        r#"
        SELECT id, name, description, icon_path, is_custom, project_id, created_at, updated_at
        FROM ambitions_catalog
        WHERE is_custom = 0 OR project_id = ?1
        ORDER BY is_custom ASC, name COLLATE NOCASE ASC
        "#,
    )?;

    let rows = statement
        .query_map(params![input.project_id], map_ambition_row)?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    rows.into_iter()
        .map(|row| map_ambition(connection, row))
        .collect()
}

pub fn create_ambition(connection: &Connection, input: &CreateAmbitionInput) -> Result<Ambition> {
    connection.execute(
        r#"
        INSERT INTO ambitions_catalog (name, description, icon_path, is_custom, project_id)
        VALUES (?1, ?2, ?3, 1, ?4)
        "#,
        params![
            input.name,
            input.description.as_deref().unwrap_or(""),
            input.icon_path.as_deref().unwrap_or(""),
            input.project_id
        ],
    )?;

    let id = i32::try_from(connection.last_insert_rowid()).map_err(|_| {
        AppError::internal(
            "AMBITION_ID_RANGE_ERROR",
            "Created ambition id is out of range",
        )
    })?;

    let created = get_by_id(connection, id)?;
    if let Some(excluded_ids) = input.excluded_ids.as_ref() {
        if !excluded_ids.is_empty() {
            return set_exclusions(connection, id, excluded_ids.clone());
        }
    }
    Ok(created)
}

pub fn update_ambition(connection: &Connection, input: &UpdateAmbitionInput) -> Result<Ambition> {
    let row = connection
        .query_row(
            "SELECT is_custom FROM ambitions_catalog WHERE id = ?1",
            params![input.id],
            |row| row.get::<_, i32>(0),
        )
        .optional()?;

    let is_custom =
        row.ok_or_else(|| AppError::internal("AMBITION_NOT_FOUND", "Ambition not found"))?;
    if is_custom != 1 {
        return Err(AppError::internal(
            "AMBITION_BAD_REQUEST",
            "Only custom ambitions can be updated",
        ));
    }

    connection.execute(
        r#"
        UPDATE ambitions_catalog
        SET
            name = COALESCE(?1, name),
            description = COALESCE(?2, description),
            icon_path = COALESCE(?3, icon_path),
            updated_at = datetime('now')
        WHERE id = ?4
        "#,
        params![
            input.name.as_deref(),
            input.description.as_deref(),
            input.icon_path.as_deref(),
            input.id
        ],
    )?;

    get_by_id(connection, input.id)
}

pub fn set_exclusions(
    connection: &Connection,
    ambition_id: i32,
    excluded_ids: Vec<i32>,
) -> Result<Ambition> {
    let ambition = connection
        .query_row(
            "SELECT id, is_custom, project_id FROM ambitions_catalog WHERE id = ?1",
            params![ambition_id],
            |row| {
                Ok((
                    row.get::<_, i32>(0)?,
                    row.get::<_, i32>(1)?,
                    row.get::<_, Option<i32>>(2)?,
                ))
            },
        )
        .optional()?
        .ok_or_else(|| AppError::internal("AMBITION_NOT_FOUND", "Ambition not found"))?;

    let (_, _, project_id) = ambition;

    let mut normalized: Vec<i32> = excluded_ids
        .into_iter()
        .collect::<std::collections::HashSet<_>>()
        .into_iter()
        .collect();
    normalized.sort_unstable();

    if normalized.contains(&ambition_id) {
        return Err(AppError::internal(
            "AMBITION_BAD_REQUEST",
            "Ambition cannot exclude itself",
        ));
    }

    if !normalized.is_empty() {
        let placeholders = normalized.iter().map(|_| "?").collect::<Vec<_>>().join(",");
        let query =
            format!("SELECT id, project_id FROM ambitions_catalog WHERE id IN ({placeholders})");
        let params: Vec<SqlValue> = normalized
            .iter()
            .map(|id| SqlValue::Integer(i64::from(*id)))
            .collect();
        let mut statement = connection.prepare(&query)?;
        let candidates = statement
            .query_map(params_from_iter(params.iter()), |row| {
                Ok((row.get::<_, i32>(0)?, row.get::<_, Option<i32>>(1)?))
            })?
            .collect::<std::result::Result<Vec<_>, _>>()?;

        if candidates.len() != normalized.len() {
            return Err(AppError::internal(
                "EXCLUDED_AMBITION_NOT_FOUND",
                "Excluded ambition",
            ));
        }

        for (_, candidate_project_id) in candidates {
            let invalid = if project_id.is_none() {
                candidate_project_id.is_some()
            } else {
                candidate_project_id.is_some() && candidate_project_id != project_id
            };
            if invalid {
                return Err(AppError::internal(
                    "AMBITION_BAD_REQUEST",
                    "Excluded ambitions must belong to the same scope",
                ));
            }
        }
    }

    let transaction = connection.unchecked_transaction()?;
    transaction.execute(
        r#"
        DELETE FROM ambition_exclusions
        WHERE ambition_id = ?1 OR excluded_ambition_id = ?1
        "#,
        params![ambition_id],
    )?;

    for excluded_id in &normalized {
        transaction.execute(
            "INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id) VALUES (?1, ?2)",
            params![ambition_id, excluded_id],
        )?;
        transaction.execute(
            "INSERT OR IGNORE INTO ambition_exclusions (ambition_id, excluded_ambition_id) VALUES (?1, ?2)",
            params![excluded_id, ambition_id],
        )?;
    }
    transaction.commit()?;

    get_by_id(connection, ambition_id)
}

pub fn update_exclusions(
    connection: &Connection,
    input: &UpdateAmbitionExclusionsInput,
) -> Result<Ambition> {
    set_exclusions(connection, input.id, input.excluded_ids.clone())
}

pub fn delete_ambition(connection: &Connection, input: &DeleteAmbitionInput) -> Result<()> {
    let row = connection
        .query_row(
            "SELECT is_custom FROM ambitions_catalog WHERE id = ?1",
            params![input.id],
            |row| row.get::<_, i32>(0),
        )
        .optional()?;

    let is_custom =
        row.ok_or_else(|| AppError::internal("AMBITION_NOT_FOUND", "Ambition not found"))?;
    if is_custom != 1 {
        return Err(AppError::internal(
            "AMBITION_BAD_REQUEST",
            "Cannot delete predefined ambition",
        ));
    }

    connection.execute(
        "DELETE FROM ambitions_catalog WHERE id = ?1",
        params![input.id],
    )?;
    Ok(())
}

pub fn get_faction_ambitions(
    connection: &Connection,
    input: &GetFactionAmbitionsInput,
) -> Result<Vec<Ambition>> {
    let mut statement = connection.prepare(
        r#"
        SELECT ac.id, ac.name, ac.description, ac.icon_path, ac.is_custom, ac.project_id, ac.created_at, ac.updated_at
        FROM faction_ambitions fa
        JOIN ambitions_catalog ac ON ac.id = fa.ambition_id
        WHERE fa.faction_id = ?1
        ORDER BY ac.is_custom ASC, ac.name COLLATE NOCASE ASC
        "#,
    )?;

    let rows = statement
        .query_map(params![input.faction_id], map_ambition_row)?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    rows.into_iter()
        .map(|row| map_ambition(connection, row))
        .collect()
}

pub fn assign_faction_ambition(
    connection: &Connection,
    input: &AssignFactionAmbitionInput,
) -> Result<()> {
    let check = connection
        .query_row(
            r#"
            SELECT
                f.project_id AS faction_project_id,
                a.project_id AS ambition_project_id
            FROM factions f
            CROSS JOIN ambitions_catalog a
            WHERE f.id = ?1 AND a.id = ?2
            "#,
            params![input.faction_id, input.ambition_id],
            |row| Ok((row.get::<_, i32>(0)?, row.get::<_, Option<i32>>(1)?)),
        )
        .optional()?;

    let (faction_project_id, ambition_project_id) = check.ok_or_else(|| {
        AppError::internal("FACTION_OR_AMBITION_NOT_FOUND", "Faction or ambition")
    })?;

    if let Some(ambition_project_id) = ambition_project_id {
        if ambition_project_id != faction_project_id {
            return Err(AppError::internal(
                "AMBITION_BAD_REQUEST",
                "Ambition does not belong to the same project as faction",
            ));
        }
    }

    let conflict = connection
        .query_row(
            r#"
            SELECT fa.ambition_id AS assigned_ambition_id
            FROM faction_ambitions fa
            LEFT JOIN ambition_exclusions e1
                ON e1.ambition_id = fa.ambition_id AND e1.excluded_ambition_id = ?1
            LEFT JOIN ambition_exclusions e2
                ON e2.ambition_id = ?1 AND e2.excluded_ambition_id = fa.ambition_id
            WHERE fa.faction_id = ?2
                AND (e1.ambition_id IS NOT NULL OR e2.ambition_id IS NOT NULL)
            LIMIT 1
            "#,
            params![input.ambition_id, input.faction_id],
            |row| row.get::<_, i32>(0),
        )
        .optional()?;

    if conflict.is_some() {
        return Err(AppError::internal(
            "AMBITION_BAD_REQUEST",
            "Ambition conflicts with already assigned ambition",
        ));
    }

    connection.execute(
        "INSERT OR IGNORE INTO faction_ambitions (faction_id, ambition_id) VALUES (?1, ?2)",
        params![input.faction_id, input.ambition_id],
    )?;

    Ok(())
}

pub fn unassign_faction_ambition(
    connection: &Connection,
    input: &UnassignFactionAmbitionInput,
) -> Result<()> {
    connection.execute(
        "DELETE FROM faction_ambitions WHERE faction_id = ?1 AND ambition_id = ?2",
        params![input.faction_id, input.ambition_id],
    )?;
    Ok(())
}

fn get_by_id(connection: &Connection, id: i32) -> Result<Ambition> {
    let row = connection
        .query_row(
            r#"
            SELECT id, name, description, icon_path, is_custom, project_id, created_at, updated_at
            FROM ambitions_catalog
            WHERE id = ?1
            "#,
            params![id],
            map_ambition_row,
        )
        .optional()?
        .ok_or_else(|| AppError::internal("AMBITION_NOT_FOUND", "Ambition not found"))?;

    map_ambition(connection, row)
}

fn get_exclusions(connection: &Connection, ambition_id: i32) -> Result<Vec<i32>> {
    let mut statement = connection.prepare(
        r#"
        SELECT excluded_ambition_id
        FROM ambition_exclusions
        WHERE ambition_id = ?1
        ORDER BY excluded_ambition_id ASC
        "#,
    )?;

    let rows = statement
        .query_map(params![ambition_id], |row| row.get::<_, i32>(0))?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(rows)
}

fn map_ambition_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<AmbitionRow> {
    Ok(AmbitionRow {
        id: row.get("id")?,
        name: row.get("name")?,
        description: row.get("description")?,
        icon_path: row.get("icon_path")?,
        is_custom: row.get::<_, i32>("is_custom")? != 0,
        project_id: row.get("project_id")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

fn map_ambition(connection: &Connection, row: AmbitionRow) -> Result<Ambition> {
    let exclusions = get_exclusions(connection, row.id)?;
    Ok(Ambition {
        id: row.id,
        name: row.name,
        description: row.description,
        icon_path: row.icon_path,
        is_custom: row.is_custom,
        exclusions,
        project_id: row.project_id,
        created_at: Some(row.created_at),
        updated_at: Some(row.updated_at),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn setup_connection() -> Connection {
        let connection = Connection::open_in_memory().expect("in-memory db");
        connection
            .execute_batch(
                r#"
                CREATE TABLE projects (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
                CREATE TABLE factions (
                  id INTEGER PRIMARY KEY,
                  project_id INTEGER NOT NULL,
                  name TEXT NOT NULL,
                  kind TEXT NOT NULL DEFAULT 'faction'
                );
                CREATE TABLE ambitions_catalog (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL,
                  description TEXT DEFAULT '',
                  icon_path TEXT DEFAULT '',
                  is_custom INTEGER NOT NULL DEFAULT 0,
                  project_id INTEGER,
                  created_at TEXT DEFAULT (datetime('now')),
                  updated_at TEXT DEFAULT (datetime('now'))
                );
                CREATE TABLE ambition_exclusions (
                  ambition_id INTEGER NOT NULL,
                  excluded_ambition_id INTEGER NOT NULL,
                  PRIMARY KEY (ambition_id, excluded_ambition_id)
                );
                CREATE TABLE faction_ambitions (
                  faction_id INTEGER NOT NULL,
                  ambition_id INTEGER NOT NULL,
                  UNIQUE(faction_id, ambition_id)
                );
                "#,
            )
            .expect("schema");
        connection
            .execute("INSERT INTO projects (id, name) VALUES (1, 'P1')", [])
            .expect("project");
        connection
            .execute(
                "INSERT INTO factions (id, project_id, name) VALUES (1, 1, 'F1')",
                [],
            )
            .expect("faction");
        connection
            .execute(
                "INSERT INTO ambitions_catalog (id, name, is_custom, project_id) VALUES (1, 'Builtin', 0, NULL)",
                [],
            )
            .expect("builtin");
        connection
    }

    #[test]
    fn catalog_includes_builtin_and_custom() {
        let connection = setup_connection();
        create_ambition(
            &connection,
            &CreateAmbitionInput {
                project_id: 1,
                name: "Custom".to_string(),
                description: None,
                icon_path: None,
                excluded_ids: None,
            },
        )
        .unwrap();

        let catalog =
            get_catalog(&connection, &GetAmbitionsCatalogInput { project_id: 1 }).unwrap();
        assert_eq!(catalog.len(), 2);
    }

    #[test]
    fn assign_and_list_faction_ambitions() {
        let connection = setup_connection();
        assign_faction_ambition(
            &connection,
            &AssignFactionAmbitionInput {
                faction_id: 1,
                ambition_id: 1,
            },
        )
        .unwrap();

        let assigned =
            get_faction_ambitions(&connection, &GetFactionAmbitionsInput { faction_id: 1 })
                .unwrap();
        assert_eq!(assigned.len(), 1);
        assert_eq!(assigned[0].id, 1);
    }
}
