use rusqlite::{params, Connection, OptionalExtension};

use crate::error::{AppError, Result};
use crate::models::branch::{
    BranchOverride, CreateBranchInput, DeleteBranchInput, ListBranchesInput, OverlayOperation,
    ScenarioBranch, UpdateBranchInput,
};

pub fn get_main_branch_id_for_project(
    connection: &Connection,
    project_id: i32,
) -> Result<Option<i32>> {
    connection
        .query_row(
            "SELECT id FROM scenario_branches WHERE project_id = ?1 AND is_main = 1 LIMIT 1",
            params![project_id],
            |row| row.get::<_, i32>(0),
        )
        .optional()
        .map_err(Into::into)
}

pub fn get_branch_by_id(connection: &Connection, branch_id: i32) -> Result<Option<ScenarioBranch>> {
    connection
        .query_row(
            r#"
            SELECT
                id,
                project_id,
                name,
                parent_branch_id,
                base_revision,
                is_main,
                created_at,
                updated_at
            FROM scenario_branches
            WHERE id = ?1
            "#,
            params![branch_id],
            map_scenario_branch,
        )
        .optional()
        .map_err(Into::into)
}

pub fn list_project_branches(
    connection: &Connection,
    project_id: i32,
) -> Result<Vec<ScenarioBranch>> {
    let mut statement = connection.prepare(
        r#"
        SELECT
            id,
            project_id,
            name,
            parent_branch_id,
            base_revision,
            is_main,
            created_at,
            updated_at
        FROM scenario_branches
        WHERE project_id = ?1
        ORDER BY is_main DESC, created_at ASC
        "#,
    )?;

    let rows = statement.query_map(params![project_id], map_scenario_branch)?;
    rows.collect::<std::result::Result<Vec<_>, _>>()
        .map_err(Into::into)
}

pub fn list_branches(
    connection: &Connection,
    input: &ListBranchesInput,
) -> Result<Vec<ScenarioBranch>> {
    list_project_branches(connection, input.project_id)
}

pub fn create_branch(connection: &Connection, input: &CreateBranchInput) -> Result<ScenarioBranch> {
    let name = input.name.trim();
    if name.is_empty() {
        return Err(AppError::internal(
            "VALIDATION_ERROR",
            "Branch name is required",
        ));
    }

    connection.execute(
        r#"
        INSERT INTO scenario_branches (
            project_id,
            name,
            parent_branch_id,
            base_revision,
            is_main,
            created_at,
            updated_at
        )
        VALUES (?1, ?2, ?3, ?4, 0, datetime('now'), datetime('now'))
        "#,
        params![
            input.project_id,
            name,
            input.parent_branch_id,
            input.base_revision.unwrap_or(0)
        ],
    )?;

    let id = connection.last_insert_rowid() as i32;

    if let Some(parent_branch_id) = input.parent_branch_id {
        super::graph_layouts::copy_layouts_from_parent(
            connection,
            input.project_id,
            parent_branch_id,
            id,
        )?;
    }

    get_branch_by_id(connection, id)?
        .ok_or_else(|| AppError::internal("BRANCH_NOT_FOUND", "Scenario branch not found"))
}

pub fn update_branch(connection: &Connection, input: &UpdateBranchInput) -> Result<ScenarioBranch> {
    get_branch_by_id(connection, input.id)?
        .ok_or_else(|| AppError::internal("BRANCH_NOT_FOUND", "Scenario branch not found"))?;

    if let Some(name) = input.name.as_deref() {
        let trimmed = name.trim();
        if !trimmed.is_empty() {
            connection.execute(
                r#"
                UPDATE scenario_branches
                SET name = ?1, updated_at = datetime('now')
                WHERE id = ?2
                "#,
                params![trimmed, input.id],
            )?;
        }
    }

    get_branch_by_id(connection, input.id)?
        .ok_or_else(|| AppError::internal("BRANCH_NOT_FOUND", "Scenario branch not found"))
}

pub fn delete_branch(connection: &Connection, input: &DeleteBranchInput) -> Result<()> {
    let branch = get_branch_by_id(connection, input.id)?
        .ok_or_else(|| AppError::internal("BRANCH_NOT_FOUND", "Scenario branch not found"))?;

    if branch.is_main {
        return Ok(());
    }

    connection.execute(
        "DELETE FROM scenario_branches WHERE id = ?1",
        params![input.id],
    )?;
    Ok(())
}

pub fn assert_branch_belongs_to_project(
    connection: &Connection,
    branch_id: i32,
    project_id: i32,
) -> Result<()> {
    let branch = get_branch_by_id(connection, branch_id)?
        .ok_or_else(|| AppError::internal("BRANCH_NOT_FOUND", "Scenario branch not found"))?;

    if branch.project_id != project_id {
        return Err(AppError::internal(
            "BRANCH_PROJECT_MISMATCH",
            "branchId does not belong to this project",
        ));
    }

    Ok(())
}

pub fn get_branch_ancestor_ids(connection: &Connection, branch_id: i32) -> Result<Vec<i32>> {
    let chain = get_branch_ancestor_ids_including_self(connection, branch_id)?;
    Ok(chain.into_iter().skip(1).collect())
}

pub fn get_branch_ancestor_ids_including_self(
    connection: &Connection,
    branch_id: i32,
) -> Result<Vec<i32>> {
    let mut ids = Vec::new();
    let mut current_id = Some(branch_id);

    for _ in 0..64 {
        let Some(id) = current_id else {
            break;
        };

        let branch = get_branch_by_id(connection, id)?
            .ok_or_else(|| AppError::internal("BRANCH_NOT_FOUND", "Scenario branch not found"))?;
        ids.push(branch.id);
        current_id = branch.parent_branch_id;
    }

    Ok(ids)
}

pub fn get_entity_override(
    connection: &Connection,
    branch_id: i32,
    entity_type: &str,
    entity_id: i32,
) -> Result<Option<BranchOverride>> {
    connection
        .query_row(
            r#"
            SELECT
                id,
                branch_id,
                entity_type,
                entity_id,
                op,
                patch_json,
                created_at,
                updated_at
            FROM branch_overrides
            WHERE branch_id = ?1 AND entity_type = ?2 AND entity_id = ?3
            LIMIT 1
            "#,
            params![branch_id, entity_type, entity_id],
            map_branch_override,
        )
        .optional()
        .map_err(Into::into)
}

pub fn get_effective_entity_override(
    connection: &Connection,
    branch_id: i32,
    entity_type: &str,
    entity_id: i32,
) -> Result<Option<BranchOverride>> {
    let chain = get_branch_ancestor_ids_including_self(connection, branch_id)?;

    for current_branch_id in chain {
        if let Some(found) =
            get_entity_override(connection, current_branch_id, entity_type, entity_id)?
        {
            return Ok(Some(found));
        }
    }

    Ok(None)
}

fn map_scenario_branch(row: &rusqlite::Row<'_>) -> rusqlite::Result<ScenarioBranch> {
    let is_main = row.get::<_, i32>("is_main")? != 0;

    Ok(ScenarioBranch {
        id: row.get("id")?,
        project_id: row.get("project_id")?,
        name: row.get("name")?,
        parent_branch_id: row.get("parent_branch_id")?,
        base_revision: row.get("base_revision")?,
        is_main,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

fn map_branch_override(row: &rusqlite::Row<'_>) -> rusqlite::Result<BranchOverride> {
    let op_raw = row.get::<_, String>("op")?;
    let op = match op_raw.as_str() {
        "upsert" => OverlayOperation::Upsert,
        "delete" => OverlayOperation::Delete,
        "create" => OverlayOperation::Create,
        _ => {
            return Err(rusqlite::Error::FromSqlConversionFailure(
                0,
                rusqlite::types::Type::Text,
                Box::new(std::io::Error::new(
                    std::io::ErrorKind::InvalidData,
                    format!("Unsupported overlay op: {op_raw}"),
                )),
            ));
        }
    };

    Ok(BranchOverride {
        id: row.get("id")?,
        branch_id: row.get("branch_id")?,
        entity_type: row.get("entity_type")?,
        entity_id: row.get("entity_id")?,
        op,
        patch_json: row.get("patch_json")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::params;

    fn setup_connection() -> Connection {
        let connection = Connection::open_in_memory().expect("in-memory db");

        connection
            .execute_batch(
                r#"
                CREATE TABLE projects (
                  id INTEGER PRIMARY KEY,
                  name TEXT NOT NULL
                );

                CREATE TABLE scenario_branches (
                  id INTEGER PRIMARY KEY,
                  project_id INTEGER NOT NULL,
                  name TEXT NOT NULL,
                  parent_branch_id INTEGER,
                  base_revision INTEGER DEFAULT 0,
                  is_main INTEGER DEFAULT 0,
                  created_at TEXT NOT NULL,
                  updated_at TEXT NOT NULL
                );

                CREATE TABLE branch_overrides (
                  id INTEGER PRIMARY KEY,
                  branch_id INTEGER NOT NULL,
                  entity_type TEXT NOT NULL,
                  entity_id INTEGER NOT NULL,
                  op TEXT NOT NULL,
                  patch_json TEXT NOT NULL,
                  created_at TEXT NOT NULL,
                  updated_at TEXT NOT NULL
                );

                CREATE TABLE graph_layouts (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  project_id INTEGER NOT NULL,
                  branch_id INTEGER NOT NULL,
                  graph_type TEXT NOT NULL,
                  layout_data TEXT NOT NULL DEFAULT '{}',
                  created_at TEXT DEFAULT (datetime('now')),
                  updated_at TEXT DEFAULT (datetime('now')),
                  UNIQUE(project_id, branch_id, graph_type)
                );
                "#,
            )
            .expect("schema created");

        connection
            .execute(
                "INSERT INTO projects (id, name) VALUES (?1, ?2)",
                params![1, "P1"],
            )
            .expect("project");

        for (id, parent_id, name, created_at, is_main) in [
            (1, None, "main", "2025-01-01 00:00:00", 1),
            (2, Some(1), "child", "2025-02-01 00:00:00", 0),
            (3, Some(2), "grandchild", "2025-03-01 00:00:00", 0),
        ] {
            connection
                .execute(
                    "INSERT INTO scenario_branches (id, project_id, name, parent_branch_id, base_revision, is_main, created_at, updated_at) VALUES (?1, 1, ?2, ?3, 0, ?4, ?5, ?5)",
                    params![id, name, parent_id, is_main, created_at],
                )
                .expect("branch");
        }

        connection
    }

    #[test]
    fn effective_override_prefers_nearest_branch() {
        let connection = setup_connection();

        connection
            .execute(
                "INSERT INTO branch_overrides (id, branch_id, entity_type, entity_id, op, patch_json, created_at, updated_at) VALUES (1, 1, 'note', 77, 'delete', '{}', '2025-01-01 00:00:00', '2025-01-01 00:00:00')",
                [],
            )
            .expect("root override");
        connection
            .execute(
                "INSERT INTO branch_overrides (id, branch_id, entity_type, entity_id, op, patch_json, created_at, updated_at) VALUES (2, 2, 'note', 77, 'upsert', '{\"title\":\"restored\"}', '2025-02-01 00:00:00', '2025-02-01 00:00:00')",
                [],
            )
            .expect("child override");

        let effective = get_effective_entity_override(&connection, 3, "note", 77)
            .unwrap()
            .expect("expected override");

        assert_eq!(effective.branch_id, 2);
        assert_eq!(effective.op, OverlayOperation::Upsert);
    }

    #[test]
    fn branch_crud_matches_backend_semantics() {
        let connection = setup_connection();

        let created = create_branch(
            &connection,
            &CreateBranchInput {
                project_id: 1,
                name: "  Branch A  ".to_string(),
                parent_branch_id: Some(1),
                base_revision: None,
            },
        )
        .expect("create branch");
        assert_eq!(created.name, "Branch A");
        assert_eq!(created.parent_branch_id, Some(1));
        assert!(!created.is_main);
        assert_eq!(created.base_revision, 0);

        let updated = update_branch(
            &connection,
            &UpdateBranchInput {
                id: created.id,
                name: Some("Renamed".to_string()),
            },
        )
        .expect("update branch");
        assert_eq!(updated.name, "Renamed");

        delete_branch(&connection, &DeleteBranchInput { id: 1 }).expect("delete main is noop");
        assert!(get_branch_by_id(&connection, 1).unwrap().is_some());

        delete_branch(&connection, &DeleteBranchInput { id: created.id }).expect("delete branch");
        assert!(get_branch_by_id(&connection, created.id).unwrap().is_none());
    }
}
