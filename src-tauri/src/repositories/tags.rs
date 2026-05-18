use rusqlite::{params, Connection, OptionalExtension};

use crate::error::{AppError, Result};
use crate::models::tag::{CreateTagInput, DeleteTagInput, Tag, TagsListInput};

const DEFAULT_TAG_COLOR: &str = "#808080";

pub fn list_tags(connection: &Connection, input: &TagsListInput) -> Result<Vec<Tag>> {
    let mut statement = connection.prepare(
        r#"
        SELECT id, name, COALESCE(color, '#808080') AS color
        FROM tags
        WHERE project_id = ?1
        ORDER BY name ASC
        "#,
    )?;

    let tags = statement
        .query_map(params![input.project_id], map_tag_row)?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(tags)
}

pub fn create_tag(connection: &Connection, input: &CreateTagInput) -> Result<Tag> {
    let existing = connection
        .query_row(
            "SELECT id FROM tags WHERE project_id = ?1 AND name = ?2",
            params![input.project_id, input.name],
            |row| row.get::<_, i32>(0),
        )
        .optional()?;

    if existing.is_some() {
        return Err(AppError::internal(
            "TAG_CONFLICT",
            format!("Tag \"{}\" already exists in this project", input.name),
        ));
    }

    let color = input
        .color
        .as_deref()
        .filter(|value| !value.is_empty())
        .unwrap_or(DEFAULT_TAG_COLOR);

    let result = connection.execute(
        "INSERT INTO tags (project_id, name, color) VALUES (?1, ?2, ?3)",
        params![input.project_id, input.name, color],
    )?;

    let id = i32::try_from(connection.last_insert_rowid()).map_err(|_| {
        AppError::internal(
            "TAG_ID_RANGE_ERROR",
            "Created tag id is out of supported range",
        )
    })?;
    if result == 0 {
        return Err(AppError::internal(
            "TAG_CREATE_FAILED",
            "Tag was not created",
        ));
    }

    Ok(Tag {
        id,
        name: input.name.clone(),
        color: color.to_string(),
    })
}

pub fn delete_tag(connection: &Connection, input: &DeleteTagInput) -> Result<()> {
    let existing = connection
        .query_row(
            "SELECT id FROM tags WHERE id = ?1",
            params![input.id],
            |row| row.get::<_, i32>(0),
        )
        .optional()?;

    if existing.is_none() {
        return Err(AppError::internal("TAG_NOT_FOUND", "Tag not found"));
    }

    connection.execute("DELETE FROM tags WHERE id = ?1", params![input.id])?;
    Ok(())
}

fn map_tag_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<Tag> {
    Ok(Tag {
        id: row.get("id")?,
        name: row.get("name")?,
        color: row.get("color")?,
    })
}
