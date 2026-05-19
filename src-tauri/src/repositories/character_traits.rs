use rusqlite::{params, params_from_iter, types::Value as SqlValue, Connection, OptionalExtension};

use crate::error::{AppError, Result};
use crate::models::character_trait::{
    AssignCharacterTraitInput, CharacterTrait, CreateCharacterTraitInput,
    DeleteCharacterTraitInput, GetAssignedCharacterTraitsInput, ListCharacterTraitsInput,
    UnassignCharacterTraitInput, UpdateCharacterTraitExclusionsInput,
};

#[derive(Debug, Clone)]
struct TraitRow {
    id: i32,
    project_id: i32,
    name: String,
    description: String,
    image_path: String,
    is_predefined: bool,
    sort_order: i32,
    created_at: String,
    updated_at: String,
}

pub fn list_traits(
    connection: &Connection,
    input: &ListCharacterTraitsInput,
) -> Result<Vec<CharacterTrait>> {
    super::character_traits_seed::seed_predefined(connection, input.project_id)?;

    let mut statement = connection.prepare(
        r#"
        SELECT id, project_id, name, description, image_path, is_predefined, sort_order, created_at, updated_at
        FROM character_traits
        WHERE project_id = ?1
        ORDER BY sort_order ASC, name ASC
        "#,
    )?;

    let rows = statement
        .query_map(params![input.project_id], map_trait_row)?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    rows.into_iter()
        .map(|row| map_trait(connection, row))
        .collect()
}

pub fn get_assigned_trait_ids(
    connection: &Connection,
    input: &GetAssignedCharacterTraitsInput,
) -> Result<Vec<i32>> {
    let mut statement = connection.prepare(
        r#"
        SELECT trait_id
        FROM character_trait_assignments
        WHERE character_id = ?1
        ORDER BY trait_id ASC
        "#,
    )?;

    let rows = statement
        .query_map(params![input.character_id], |row| row.get::<_, i32>(0))?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(rows)
}

pub fn assign_trait(connection: &Connection, input: &AssignCharacterTraitInput) -> Result<()> {
    let check = connection
        .query_row(
            r#"
            SELECT c.project_id AS cp, ct.project_id AS tp
            FROM characters c
            CROSS JOIN character_traits ct
            WHERE c.id = ?1 AND ct.id = ?2
            "#,
            params![input.character_id, input.trait_id],
            |row| Ok((row.get::<_, i32>(0)?, row.get::<_, i32>(1)?)),
        )
        .optional()?;

    let (character_project_id, trait_project_id) = check
        .ok_or_else(|| AppError::internal("CHARACTER_OR_TRAIT_NOT_FOUND", "Character or trait"))?;

    if character_project_id != trait_project_id {
        return Err(AppError::internal(
            "TRAIT_BAD_REQUEST",
            "Trait does not belong to the same project as the character",
        ));
    }

    let conflict = connection
        .query_row(
            r#"
            SELECT cta.trait_id AS assigned_trait_id
            FROM character_trait_assignments cta
            LEFT JOIN character_trait_exclusions e1
                ON e1.trait_id = cta.trait_id AND e1.excluded_trait_id = ?1
            LEFT JOIN character_trait_exclusions e2
                ON e2.trait_id = ?1 AND e2.excluded_trait_id = cta.trait_id
            WHERE cta.character_id = ?2
                AND (e1.trait_id IS NOT NULL OR e2.trait_id IS NOT NULL)
            LIMIT 1
            "#,
            params![input.trait_id, input.character_id],
            |row| row.get::<_, i32>(0),
        )
        .optional()?;

    if conflict.is_some() {
        return Err(AppError::internal(
            "TRAIT_BAD_REQUEST",
            "Trait conflicts with already assigned trait",
        ));
    }

    connection.execute(
        "INSERT OR IGNORE INTO character_trait_assignments (character_id, trait_id) VALUES (?1, ?2)",
        params![input.character_id, input.trait_id],
    )?;

    Ok(())
}

pub fn unassign_trait(connection: &Connection, input: &UnassignCharacterTraitInput) -> Result<()> {
    connection.execute(
        "DELETE FROM character_trait_assignments WHERE character_id = ?1 AND trait_id = ?2",
        params![input.character_id, input.trait_id],
    )?;
    Ok(())
}

pub fn create_trait(
    connection: &Connection,
    input: &CreateCharacterTraitInput,
) -> Result<CharacterTrait> {
    super::character_traits_seed::seed_predefined(connection, input.project_id)?;

    let max_sort = connection
        .query_row(
            "SELECT COALESCE(MAX(sort_order), 0) FROM character_traits WHERE project_id = ?1",
            params![input.project_id],
            |row| row.get::<_, i32>(0),
        )
        .unwrap_or(0);

    connection.execute(
        r#"
        INSERT INTO character_traits (project_id, name, description, image_path, is_predefined, sort_order)
        VALUES (?1, ?2, ?3, ?4, 0, ?5)
        "#,
        params![
            input.project_id,
            input.name,
            input.description.as_deref().unwrap_or(""),
            input.image_path.as_deref().unwrap_or(""),
            max_sort + 1
        ],
    )?;

    let id = i32::try_from(connection.last_insert_rowid()).map_err(|_| {
        AppError::internal("TRAIT_ID_RANGE_ERROR", "Created trait id is out of range")
    })?;

    let created = get_by_id(connection, id)?;
    if let Some(excluded_ids) = input.excluded_ids.as_ref() {
        if !excluded_ids.is_empty() {
            return set_exclusions(connection, id, excluded_ids.clone());
        }
    }
    Ok(created)
}

pub fn update_exclusions(
    connection: &Connection,
    input: &UpdateCharacterTraitExclusionsInput,
) -> Result<CharacterTrait> {
    set_exclusions(connection, input.id, input.excluded_ids.clone())
}

pub fn delete_trait(connection: &Connection, input: &DeleteCharacterTraitInput) -> Result<()> {
    let row = connection
        .query_row(
            "SELECT is_predefined FROM character_traits WHERE id = ?1",
            params![input.id],
            |row| row.get::<_, i32>(0),
        )
        .optional()?;

    let is_predefined =
        row.ok_or_else(|| AppError::internal("TRAIT_NOT_FOUND", "Trait not found"))?;
    if is_predefined == 1 {
        return Err(AppError::internal(
            "TRAIT_BAD_REQUEST",
            "Cannot delete predefined trait",
        ));
    }

    connection.execute(
        "DELETE FROM character_traits WHERE id = ?1",
        params![input.id],
    )?;
    Ok(())
}

fn set_exclusions(
    connection: &Connection,
    trait_id: i32,
    excluded_ids: Vec<i32>,
) -> Result<CharacterTrait> {
    let trait_row = connection
        .query_row(
            "SELECT id, project_id FROM character_traits WHERE id = ?1",
            params![trait_id],
            |row| Ok((row.get::<_, i32>(0)?, row.get::<_, i32>(1)?)),
        )
        .optional()?
        .ok_or_else(|| AppError::internal("TRAIT_NOT_FOUND", "Trait not found"))?;

    let (_, project_id) = trait_row;

    let mut normalized: Vec<i32> = excluded_ids
        .into_iter()
        .collect::<std::collections::HashSet<_>>()
        .into_iter()
        .collect();
    normalized.sort_unstable();

    if normalized.contains(&trait_id) {
        return Err(AppError::internal(
            "TRAIT_BAD_REQUEST",
            "Trait cannot exclude itself",
        ));
    }

    if !normalized.is_empty() {
        let placeholders = normalized.iter().map(|_| "?").collect::<Vec<_>>().join(",");
        let query =
            format!("SELECT id, project_id FROM character_traits WHERE id IN ({placeholders})");
        let sql_params: Vec<SqlValue> = normalized
            .iter()
            .map(|id| SqlValue::Integer(i64::from(*id)))
            .collect();
        let mut statement = connection.prepare(&query)?;
        let candidates = statement
            .query_map(params_from_iter(sql_params.iter()), |row| {
                Ok((row.get::<_, i32>(0)?, row.get::<_, i32>(1)?))
            })?
            .collect::<std::result::Result<Vec<_>, _>>()?;

        if candidates.len() != normalized.len() {
            return Err(AppError::internal(
                "EXCLUDED_TRAIT_NOT_FOUND",
                "Excluded trait",
            ));
        }

        if candidates
            .iter()
            .any(|(_, candidate_project_id)| *candidate_project_id != project_id)
        {
            return Err(AppError::internal(
                "TRAIT_BAD_REQUEST",
                "Excluded traits must belong to the same project",
            ));
        }
    }

    let transaction = connection.unchecked_transaction()?;
    transaction.execute(
        r#"
        DELETE FROM character_trait_exclusions
        WHERE trait_id = ?1 OR excluded_trait_id = ?1
        "#,
        params![trait_id],
    )?;

    for excluded_id in &normalized {
        transaction.execute(
            "INSERT OR IGNORE INTO character_trait_exclusions (trait_id, excluded_trait_id) VALUES (?1, ?2)",
            params![trait_id, excluded_id],
        )?;
        transaction.execute(
            "INSERT OR IGNORE INTO character_trait_exclusions (trait_id, excluded_trait_id) VALUES (?1, ?2)",
            params![excluded_id, trait_id],
        )?;
    }
    transaction.commit()?;

    get_by_id(connection, trait_id)
}

fn get_by_id(connection: &Connection, id: i32) -> Result<CharacterTrait> {
    let row = connection
        .query_row(
            r#"
            SELECT id, project_id, name, description, image_path, is_predefined, sort_order, created_at, updated_at
            FROM character_traits
            WHERE id = ?1
            "#,
            params![id],
            map_trait_row,
        )
        .optional()?
        .ok_or_else(|| AppError::internal("TRAIT_NOT_FOUND", "Trait not found"))?;

    map_trait(connection, row)
}

fn get_exclusions(connection: &Connection, trait_id: i32) -> Result<Vec<i32>> {
    let mut statement = connection.prepare(
        r#"
        SELECT excluded_trait_id
        FROM character_trait_exclusions
        WHERE trait_id = ?1
        ORDER BY excluded_trait_id ASC
        "#,
    )?;

    let rows = statement
        .query_map(params![trait_id], |row| row.get::<_, i32>(0))?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(rows)
}

fn map_trait_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<TraitRow> {
    Ok(TraitRow {
        id: row.get("id")?,
        project_id: row.get("project_id")?,
        name: row.get("name")?,
        description: row.get("description")?,
        image_path: row.get("image_path")?,
        is_predefined: row.get::<_, i32>("is_predefined")? != 0,
        sort_order: row.get("sort_order")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

fn map_trait(connection: &Connection, row: TraitRow) -> Result<CharacterTrait> {
    let exclusions = get_exclusions(connection, row.id)?;
    Ok(CharacterTrait {
        id: row.id,
        project_id: row.project_id,
        name: row.name,
        description: row.description,
        image_path: row.image_path,
        is_predefined: row.is_predefined,
        exclusions,
        sort_order: row.sort_order,
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
                CREATE TABLE characters (
                  id INTEGER PRIMARY KEY,
                  project_id INTEGER NOT NULL,
                  name TEXT NOT NULL
                );
                CREATE TABLE character_traits (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  project_id INTEGER NOT NULL,
                  name TEXT NOT NULL,
                  description TEXT DEFAULT '',
                  image_path TEXT DEFAULT '',
                  is_predefined INTEGER DEFAULT 0,
                  sort_order INTEGER DEFAULT 0,
                  created_at TEXT DEFAULT (datetime('now')),
                  updated_at TEXT DEFAULT (datetime('now')),
                  UNIQUE(project_id, name)
                );
                CREATE TABLE character_trait_exclusions (
                  trait_id INTEGER NOT NULL,
                  excluded_trait_id INTEGER NOT NULL,
                  PRIMARY KEY (trait_id, excluded_trait_id)
                );
                CREATE TABLE character_trait_assignments (
                  character_id INTEGER NOT NULL,
                  trait_id INTEGER NOT NULL,
                  UNIQUE(character_id, trait_id)
                );
                "#,
            )
            .expect("schema");
        connection
            .execute("INSERT INTO projects (id, name) VALUES (1, 'P1')", [])
            .expect("project");
        connection
            .execute(
                "INSERT INTO characters (id, project_id, name) VALUES (1, 1, 'Hero')",
                [],
            )
            .expect("character");
        connection
    }

    #[test]
    fn list_seeds_predefined_traits() {
        let connection = setup_connection();
        let traits = list_traits(&connection, &ListCharacterTraitsInput { project_id: 1 }).unwrap();
        assert!(traits.len() >= 30);
        assert!(traits.iter().any(|t| t.name == "Доброта"));
    }

    #[test]
    fn assign_blocks_conflicting_traits() {
        let connection = setup_connection();
        let traits = list_traits(&connection, &ListCharacterTraitsInput { project_id: 1 }).unwrap();
        let kindness = traits.iter().find(|t| t.name == "Доброта").unwrap();
        let anger = traits.iter().find(|t| t.name == "Злость").unwrap();

        set_exclusions(&connection, kindness.id, vec![anger.id]).unwrap();
        assign_trait(
            &connection,
            &AssignCharacterTraitInput {
                character_id: 1,
                trait_id: kindness.id,
            },
        )
        .unwrap();

        let conflict = assign_trait(
            &connection,
            &AssignCharacterTraitInput {
                character_id: 1,
                trait_id: anger.id,
            },
        );
        assert!(conflict.is_err());
    }
}
