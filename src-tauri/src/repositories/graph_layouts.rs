use rusqlite::{params, Connection, OptionalExtension};

use crate::error::{AppError, Result};
use crate::models::graph_layout::{
    DeleteGraphLayoutInput, GetGraphLayoutInput, GraphLayoutDataV1, GraphLayoutResponse,
    UpsertGraphLayoutInput,
};
use crate::models::project::GetProjectInput;
use crate::repositories::projects;
use crate::services::branch_scope;

pub fn empty_graph_layout_data() -> GraphLayoutDataV1 {
    GraphLayoutDataV1 {
        version: 1,
        viewport: None,
        nodes: std::collections::HashMap::new(),
    }
}

fn parse_layout_data(raw: Option<String>) -> GraphLayoutDataV1 {
    let Some(raw) = raw else {
        return empty_graph_layout_data();
    };

    match serde_json::from_str::<GraphLayoutDataV1>(&raw) {
        Ok(parsed) if parsed.version == 1 => parsed,
        _ => empty_graph_layout_data(),
    }
}

fn normalize_layout_data(layout_data: GraphLayoutDataV1) -> GraphLayoutDataV1 {
    if layout_data.version != 1 {
        return empty_graph_layout_data();
    }

    let Ok(value) = serde_json::to_value(&layout_data) else {
        return empty_graph_layout_data();
    };

    match serde_json::from_value::<GraphLayoutDataV1>(value) {
        Ok(parsed) if parsed.version == 1 => parsed,
        _ => empty_graph_layout_data(),
    }
}

pub fn get_parsed(
    connection: &Connection,
    input: &GetGraphLayoutInput,
) -> Result<GraphLayoutResponse> {
    projects::get_project(
        connection,
        &GetProjectInput {
            id: input.project_id,
        },
    )?;

    let view_branch =
        branch_scope::effective_branch_id_for_read(connection, input.project_id, input.branch_id)?;

    let Some(view_branch) = view_branch else {
        return Ok(GraphLayoutResponse {
            layout_data: empty_graph_layout_data(),
        });
    };

    branch_scope::assert_branch_belongs_to_project(connection, view_branch, input.project_id)?;

    let row = connection
        .query_row(
            r#"
            SELECT layout_data
            FROM graph_layouts
            WHERE project_id = ?1 AND branch_id = ?2 AND graph_type = ?3
            "#,
            params![input.project_id, view_branch, input.graph_type],
            |row| row.get::<_, String>(0),
        )
        .optional()?;

    Ok(GraphLayoutResponse {
        layout_data: parse_layout_data(row),
    })
}

pub fn upsert(
    connection: &Connection,
    input: &UpsertGraphLayoutInput,
) -> Result<GraphLayoutResponse> {
    projects::get_project(
        connection,
        &GetProjectInput {
            id: input.project_id,
        },
    )?;

    let view_branch =
        branch_scope::effective_branch_id_for_read(connection, input.project_id, input.branch_id)?;

    let Some(view_branch) = view_branch else {
        return Err(AppError::internal(
            "BAD_REQUEST",
            "branchId required (no main branch for project)",
        ));
    };

    branch_scope::assert_branch_belongs_to_project(connection, view_branch, input.project_id)?;

    let stored = normalize_layout_data(input.layout_data.clone());
    let layout_json = serde_json::to_string(&stored).map_err(|error| {
        AppError::internal(
            "GRAPH_LAYOUT_SERIALIZE_ERROR",
            format!("Failed to serialize layout data: {error}"),
        )
    })?;

    connection.execute(
        r#"
        INSERT INTO graph_layouts (project_id, branch_id, graph_type, layout_data, updated_at)
        VALUES (?1, ?2, ?3, ?4, datetime('now'))
        ON CONFLICT(project_id, branch_id, graph_type) DO UPDATE SET
            layout_data = excluded.layout_data,
            updated_at = datetime('now')
        "#,
        params![input.project_id, view_branch, input.graph_type, layout_json],
    )?;

    Ok(GraphLayoutResponse {
        layout_data: stored,
    })
}

pub fn delete(connection: &Connection, input: &DeleteGraphLayoutInput) -> Result<()> {
    projects::get_project(
        connection,
        &GetProjectInput {
            id: input.project_id,
        },
    )?;

    let view_branch =
        branch_scope::effective_branch_id_for_read(connection, input.project_id, input.branch_id)?;

    let Some(view_branch) = view_branch else {
        return Err(AppError::internal(
            "BAD_REQUEST",
            "branchId required (no main branch for project)",
        ));
    };

    branch_scope::assert_branch_belongs_to_project(connection, view_branch, input.project_id)?;

    connection.execute(
        r#"
        DELETE FROM graph_layouts
        WHERE project_id = ?1 AND branch_id = ?2 AND graph_type = ?3
        "#,
        params![input.project_id, view_branch, input.graph_type],
    )?;

    Ok(())
}

/// Snapshot parent branch layouts onto a new branch (fork). Mirrors `GraphLayoutService.copyLayoutsFromParent`.
pub fn copy_layouts_from_parent(
    connection: &Connection,
    project_id: i32,
    parent_branch_id: i32,
    new_branch_id: i32,
) -> Result<()> {
    branch_scope::assert_branch_belongs_to_project(connection, parent_branch_id, project_id)?;
    branch_scope::assert_branch_belongs_to_project(connection, new_branch_id, project_id)?;

    let mut statement = connection.prepare(
        r#"
        SELECT graph_type, layout_data
        FROM graph_layouts
        WHERE project_id = ?1 AND branch_id = ?2
        "#,
    )?;

    let rows = statement
        .query_map(params![project_id, parent_branch_id], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    if rows.is_empty() {
        return Ok(());
    }

    for (graph_type, layout_data) in rows {
        let parsed = parse_layout_data(Some(layout_data));
        let copy = normalize_layout_data(parsed);
        upsert(
            connection,
            &UpsertGraphLayoutInput {
                project_id,
                graph_type,
                layout_data: copy,
                branch_id: Some(new_branch_id),
            },
        )?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::branch::CreateBranchInput;
    use crate::models::graph_layout::GraphLayoutNodeState;
    use crate::repositories::branches::create_branch;
    use rusqlite::Connection;

    fn setup_connection() -> Connection {
        let connection = Connection::open_in_memory().expect("in-memory db");
        connection
            .execute_batch(
                r#"
                CREATE TABLE projects (
                  id INTEGER PRIMARY KEY,
                  name TEXT NOT NULL,
                  description TEXT DEFAULT '',
                  status TEXT DEFAULT 'active',
                  map_image_path TEXT DEFAULT '',
                  created_at TEXT DEFAULT (datetime('now')),
                  updated_at TEXT DEFAULT (datetime('now'))
                );

                CREATE TABLE scenario_branches (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  project_id INTEGER NOT NULL,
                  name TEXT NOT NULL,
                  parent_branch_id INTEGER,
                  base_revision INTEGER DEFAULT 0,
                  is_main INTEGER NOT NULL DEFAULT 0,
                  created_at TEXT DEFAULT (datetime('now')),
                  updated_at TEXT DEFAULT (datetime('now'))
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
            .expect("schema");

        connection
            .execute("INSERT INTO projects (id, name) VALUES (1, 'P1')", [])
            .expect("project");
        connection
            .execute(
                r#"
                INSERT INTO scenario_branches (id, project_id, name, parent_branch_id, base_revision, is_main)
                VALUES (1, 1, 'main', NULL, 0, 1)
                "#,
                [],
            )
            .expect("main branch");

        connection
    }

    #[test]
    fn fork_branch_copies_parent_graph_layouts() {
        let connection = setup_connection();

        upsert(
            &connection,
            &UpsertGraphLayoutInput {
                project_id: 1,
                graph_type: "project-graph".to_string(),
                layout_data: GraphLayoutDataV1 {
                    version: 1,
                    viewport: None,
                    nodes: [(
                        "node-a".to_string(),
                        GraphLayoutNodeState {
                            x: 42.0,
                            y: 17.0,
                            pinned: Some(true),
                        },
                    )]
                    .into_iter()
                    .collect(),
                },
                branch_id: Some(1),
            },
        )
        .expect("seed parent layout");

        let child = create_branch(
            &connection,
            &CreateBranchInput {
                project_id: 1,
                name: "child".to_string(),
                parent_branch_id: Some(1),
                base_revision: None,
            },
        )
        .expect("fork branch");

        let child_layout = get_parsed(
            &connection,
            &GetGraphLayoutInput {
                project_id: 1,
                graph_type: "project-graph".to_string(),
                branch_id: Some(child.id),
            },
        )
        .expect("read child layout");

        let node = child_layout
            .layout_data
            .nodes
            .get("node-a")
            .expect("copied node position");
        assert_eq!(node.x, 42.0);
        assert_eq!(node.y, 17.0);
        assert_eq!(node.pinned, Some(true));

        let main_layout = get_parsed(
            &connection,
            &GetGraphLayoutInput {
                project_id: 1,
                graph_type: "project-graph".to_string(),
                branch_id: Some(1),
            },
        )
        .expect("read main layout");
        assert!(main_layout.layout_data.nodes.contains_key("node-a"));
    }
}
