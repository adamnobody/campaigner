use rusqlite::{params, Connection, OptionalExtension};

use crate::error::{AppError, Result};
use crate::models::project::{
    CreateProjectInput, DeleteProjectInput, GetProjectInput, Project, UpdateProjectInput,
};

pub fn list_projects(connection: &Connection) -> Result<Vec<Project>> {
    let mut statement = connection.prepare(
        r#"
        SELECT
            id,
            name,
            description,
            status,
            map_image_path,
            created_at,
            updated_at
        FROM projects
        ORDER BY updated_at DESC
        "#,
    )?;

    let projects = statement
        .query_map([], map_project_row)?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(projects)
}

pub fn get_project(connection: &Connection, input: &GetProjectInput) -> Result<Project> {
    connection
        .query_row(
            r#"
            SELECT
                id,
                name,
                description,
                status,
                map_image_path,
                created_at,
                updated_at
            FROM projects
            WHERE id = ?1
            "#,
            params![input.id],
            map_project_row,
        )
        .optional()?
        .ok_or_else(|| AppError::internal("PROJECT_NOT_FOUND", "Project not found"))
}

pub fn create_project(connection: &Connection, input: &CreateProjectInput) -> Result<Project> {
    let description = input.description.as_deref().unwrap_or("");
    let status = input.status.as_deref().unwrap_or("active");

    connection.execute(
        "INSERT INTO projects (name, description, status) VALUES (?1, ?2, ?3)",
        params![input.name, description, status],
    )?;

    let id = i32::try_from(connection.last_insert_rowid()).map_err(|_| {
        AppError::internal(
            "PROJECT_ID_RANGE_ERROR",
            "Created project id is out of supported range",
        )
    })?;

    get_project(connection, &GetProjectInput { id })
}

pub fn update_project(connection: &Connection, input: &UpdateProjectInput) -> Result<Project> {
    let existing = get_project(connection, &GetProjectInput { id: input.id })?;

    let name = input.name.as_deref().unwrap_or(existing.name.as_str());
    let description = input
        .description
        .as_deref()
        .unwrap_or(existing.description.as_str());
    let status = input.status.as_deref().unwrap_or(existing.status.as_str());
    let map_image_path = input
        .map_image_path
        .as_ref()
        .or(existing.map_image_path.as_ref());

    connection.execute(
        r#"
        UPDATE projects
        SET
            name = ?1,
            description = ?2,
            status = ?3,
            map_image_path = ?4,
            updated_at = datetime('now')
        WHERE id = ?5
        "#,
        params![name, description, status, map_image_path, input.id],
    )?;

    get_project(connection, &GetProjectInput { id: input.id })
}

pub fn delete_project(connection: &Connection, input: &DeleteProjectInput) -> Result<()> {
    let _ = get_project(connection, &GetProjectInput { id: input.id })?;
    connection.execute("DELETE FROM projects WHERE id = ?1", params![input.id])?;
    Ok(())
}

fn map_project_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<Project> {
    Ok(Project {
        id: row.get("id")?,
        name: row.get("name")?,
        description: row.get("description")?,
        status: row.get("status")?,
        map_image_path: row.get("map_image_path")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}
