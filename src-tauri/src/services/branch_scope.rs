use rusqlite::{types::Value as SqlValue, Connection};

use crate::error::Result;
use crate::models::branch::ScenarioBranch;
use crate::repositories::branches;

pub fn effective_branch_id_for_read(
    connection: &Connection,
    project_id: i32,
    requested_branch_id: Option<i32>,
) -> Result<Option<i32>> {
    if let Some(branch_id) = requested_branch_id {
        branches::assert_branch_belongs_to_project(connection, branch_id, project_id)?;
        return Ok(Some(branch_id));
    }

    branches::get_main_branch_id_for_project(connection, project_id)
}

pub fn resolve_created_branch_id(
    connection: &Connection,
    project_id: i32,
    requested_branch_id: Option<i32>,
) -> Result<Option<i32>> {
    let resolved_branch_id = requested_branch_id.or(branches::get_main_branch_id_for_project(
        connection, project_id,
    )?);

    if let Some(branch_id) = resolved_branch_id {
        branches::assert_branch_belongs_to_project(connection, branch_id, project_id)?;
    }

    Ok(resolved_branch_id)
}

pub fn assert_branch_belongs_to_project(
    connection: &Connection,
    branch_id: i32,
    project_id: i32,
) -> Result<()> {
    branches::assert_branch_belongs_to_project(connection, branch_id, project_id)
}

pub fn is_entity_visible_in_branch(
    connection: &Connection,
    project_id: i32,
    requested_branch_id: Option<i32>,
    created_branch_id: Option<i32>,
    created_at: Option<&str>,
) -> Result<bool> {
    let view_branch = effective_branch_id_for_read(connection, project_id, requested_branch_id)?;
    let Some(view_branch_id) = view_branch else {
        return Ok(true);
    };

    let main_branch_id = branches::get_main_branch_id_for_project(connection, project_id)?;
    let Some(main_id) = main_branch_id else {
        return Ok(true);
    };

    let Some(entity_created_branch_id) = created_branch_id else {
        return Ok(true);
    };

    if view_branch_id == main_id {
        return Ok(entity_created_branch_id == main_id);
    }

    if entity_created_branch_id == view_branch_id {
        return Ok(true);
    }

    let chain = get_ancestry_to_root(connection, view_branch_id)?;
    if chain.is_empty() || chain[0].id != view_branch_id {
        return Ok(false);
    }

    for i in 0..chain.len().saturating_sub(1) {
        let child = &chain[i];
        let parent = &chain[i + 1];
        if entity_created_branch_id == parent.id {
            if let Some(entity_created_at) = created_at {
                if entity_created_at <= child.created_at.as_str() {
                    return Ok(true);
                }
            }
        }
    }

    Ok(false)
}

#[derive(Debug, Clone, Default)]
pub struct BranchVisibilitySql {
    pub sql: String,
    pub params: Vec<SqlValue>,
}

pub fn branch_entity_visibility_sql(
    connection: &Connection,
    project_id: i32,
    requested_branch_id: Option<i32>,
    created_branch_column: &str,
    created_at_column: &str,
) -> Result<BranchVisibilitySql> {
    let branch_id = effective_branch_id_for_read(connection, project_id, requested_branch_id)?;
    let Some(branch_id) = branch_id else {
        return Ok(BranchVisibilitySql::default());
    };

    let main_id = branches::get_main_branch_id_for_project(connection, project_id)?;
    let Some(main_id) = main_id else {
        return Ok(BranchVisibilitySql::default());
    };

    if branch_id == main_id {
        return Ok(BranchVisibilitySql {
            sql: format!(" AND ({created_branch_column} IS NULL OR {created_branch_column} = ?)"),
            params: vec![SqlValue::Integer(i64::from(main_id))],
        });
    }

    let chain = get_ancestry_to_root(connection, branch_id)?;
    if chain.is_empty() || chain[0].id != branch_id {
        return Ok(BranchVisibilitySql {
            sql: " AND 1=0".to_string(),
            params: vec![],
        });
    }

    let mut parts = vec![
        format!("{created_branch_column} IS NULL"),
        format!("{created_branch_column} = ?"),
    ];
    let mut params = vec![SqlValue::Integer(i64::from(branch_id))];

    for index in 0..chain.len().saturating_sub(1) {
        let child = &chain[index];
        let parent = &chain[index + 1];
        parts.push(format!(
            "({created_branch_column} = ? AND datetime({created_at_column}) <= datetime(?))"
        ));
        params.push(SqlValue::Integer(i64::from(parent.id)));
        params.push(SqlValue::Text(child.created_at.clone()));
    }

    Ok(BranchVisibilitySql {
        sql: format!(" AND ({})", parts.join(" OR ")),
        params,
    })
}

#[allow(clippy::too_many_arguments)]
pub fn visibility_triple(
    connection: &Connection,
    project_id: i32,
    requested_branch_id: Option<i32>,
    wl_col: &str,
    wl_at: &str,
    sn_col: &str,
    sn_at: &str,
    tn_col: &str,
    tn_at: &str,
) -> Result<BranchVisibilitySql> {
    let link_scope =
        branch_entity_visibility_sql(connection, project_id, requested_branch_id, wl_col, wl_at)?;
    let source_scope =
        branch_entity_visibility_sql(connection, project_id, requested_branch_id, sn_col, sn_at)?;
    let target_scope =
        branch_entity_visibility_sql(connection, project_id, requested_branch_id, tn_col, tn_at)?;

    let mut params = link_scope.params;
    params.extend(source_scope.params);
    params.extend(target_scope.params);

    Ok(BranchVisibilitySql {
        sql: format!("{}{}{}", link_scope.sql, source_scope.sql, target_scope.sql),
        params,
    })
}

fn get_ancestry_to_root(connection: &Connection, branch_id: i32) -> Result<Vec<ScenarioBranch>> {
    let mut chain = Vec::new();
    let mut current = Some(branch_id);

    for _ in 0..64 {
        let Some(current_id) = current else {
            break;
        };

        let branch = branches::get_branch_by_id(connection, current_id)?.ok_or_else(|| {
            crate::error::AppError::internal("BRANCH_NOT_FOUND", "Scenario branch not found")
        })?;
        current = branch.parent_branch_id;
        chain.push(branch);
    }

    Ok(chain)
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
                "#,
            )
            .expect("schema created");

        connection
            .execute(
                "INSERT INTO projects (id, name) VALUES (?1, ?2)",
                params![1, "P1"],
            )
            .expect("project 1");
        connection
            .execute(
                "INSERT INTO projects (id, name) VALUES (?1, ?2)",
                params![2, "P2"],
            )
            .expect("project 2");

        connection
            .execute(
                "INSERT INTO scenario_branches (id, project_id, name, parent_branch_id, base_revision, is_main, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                params![1, 1, "main", Option::<i32>::None, 0, 1, "2025-01-01 00:00:00", "2025-01-01 00:00:00"],
            )
            .expect("main");
        connection
            .execute(
                "INSERT INTO scenario_branches (id, project_id, name, parent_branch_id, base_revision, is_main, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                params![2, 1, "child", 1, 0, 0, "2025-02-01 00:00:00", "2025-02-01 00:00:00"],
            )
            .expect("child");
        connection
            .execute(
                "INSERT INTO scenario_branches (id, project_id, name, parent_branch_id, base_revision, is_main, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                params![3, 1, "grandchild", 2, 0, 0, "2025-03-01 00:00:00", "2025-03-01 00:00:00"],
            )
            .expect("grandchild");
        connection
            .execute(
                "INSERT INTO scenario_branches (id, project_id, name, parent_branch_id, base_revision, is_main, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                params![4, 1, "sibling", 1, 0, 0, "2025-02-15 00:00:00", "2025-02-15 00:00:00"],
            )
            .expect("sibling");
        connection
            .execute(
                "INSERT INTO scenario_branches (id, project_id, name, parent_branch_id, base_revision, is_main, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                params![10, 2, "main-2", Option::<i32>::None, 0, 1, "2025-01-01 00:00:00", "2025-01-01 00:00:00"],
            )
            .expect("project2 main");

        connection
    }

    #[test]
    fn validates_branch_project_membership() {
        let connection = setup_connection();

        assert!(assert_branch_belongs_to_project(&connection, 2, 1).is_ok());
        assert!(assert_branch_belongs_to_project(&connection, 2, 2).is_err());
    }

    #[test]
    fn computes_ancestor_chain_in_expected_order() {
        let connection = setup_connection();

        let chain = branches::get_branch_ancestor_ids_including_self(&connection, 3).unwrap();
        let ancestors = branches::get_branch_ancestor_ids(&connection, 3).unwrap();

        assert_eq!(chain, vec![3, 2, 1]);
        assert_eq!(ancestors, vec![2, 1]);
    }

    #[test]
    fn resolves_effective_branch_for_reads() {
        let connection = setup_connection();

        let fallback = effective_branch_id_for_read(&connection, 1, None).unwrap();
        let explicit = effective_branch_id_for_read(&connection, 1, Some(2)).unwrap();
        let mismatch = effective_branch_id_for_read(&connection, 1, Some(10));

        assert_eq!(fallback, Some(1));
        assert_eq!(explicit, Some(2));
        assert!(mismatch.is_err());
    }

    #[test]
    fn resolves_created_branch_id_legacy_compatible() {
        let connection = setup_connection();

        let fallback = resolve_created_branch_id(&connection, 1, None).unwrap();
        let explicit = resolve_created_branch_id(&connection, 1, Some(3)).unwrap();
        let mismatch = resolve_created_branch_id(&connection, 1, Some(10));

        assert_eq!(fallback, Some(1));
        assert_eq!(explicit, Some(3));
        assert!(mismatch.is_err());
    }

    #[test]
    fn evaluates_branch_visibility_rules() {
        let connection = setup_connection();

        let root_visible_in_child = is_entity_visible_in_branch(
            &connection,
            1,
            Some(2),
            Some(1),
            Some("2025-01-10 00:00:00"),
        )
        .unwrap();
        let sibling_hidden_in_child = is_entity_visible_in_branch(
            &connection,
            1,
            Some(2),
            Some(4),
            Some("2025-02-16 00:00:00"),
        )
        .unwrap();
        let parent_after_fork_hidden = is_entity_visible_in_branch(
            &connection,
            1,
            Some(2),
            Some(1),
            Some("2025-02-10 00:00:00"),
        )
        .unwrap();
        let child_hidden_in_main = is_entity_visible_in_branch(
            &connection,
            1,
            Some(1),
            Some(2),
            Some("2025-02-10 00:00:00"),
        )
        .unwrap();

        assert!(root_visible_in_child);
        assert!(!sibling_hidden_in_child);
        assert!(!parent_after_fork_hidden);
        assert!(!child_hidden_in_main);
    }
}
