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
