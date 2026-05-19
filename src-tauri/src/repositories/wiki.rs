use rusqlite::{
    params, params_from_iter, types::Value as SqlValue, Connection, OptionalExtension, Row,
};

use crate::error::{AppError, Result};
use crate::models::wiki_link::{
    CreateWikiLinkInput, DeleteWikiLinkInput, ListWikiCategoriesInput, ListWikiLinksInput,
    WikiCategory, WikiLink,
};
use crate::services::branch_scope;

pub fn list_links(connection: &Connection, input: &ListWikiLinksInput) -> Result<Vec<WikiLink>> {
    if let Some(note_id) = input.note_id {
        return list_links_for_note(connection, note_id, input.branch_id);
    }

    let visibility = branch_scope::visibility_triple(
        connection,
        input.project_id,
        input.branch_id,
        "wl.created_branch_id",
        "wl.created_at",
        "sn.created_branch_id",
        "sn.created_at",
        "tn.created_branch_id",
        "tn.created_at",
    )?;

    let mut sql = String::from(
        r#"
        SELECT
            wl.id,
            wl.project_id,
            wl.source_note_id,
            wl.target_note_id,
            wl.label,
            wl.created_at,
            sn.title AS source_title,
            tn.title AS target_title
        FROM wiki_links wl
        JOIN notes sn ON sn.id = wl.source_note_id
        JOIN notes tn ON tn.id = wl.target_note_id
        WHERE wl.project_id = ?
        "#,
    );
    sql.push_str(&visibility.sql);
    sql.push_str(" ORDER BY wl.created_at DESC");

    let mut query_params: Vec<SqlValue> = vec![SqlValue::Integer(i64::from(input.project_id))];
    query_params.extend(visibility.params);

    let mut statement = connection.prepare(&sql)?;
    let rows = statement.query_map(params_from_iter(query_params.iter()), map_wiki_link_row)?;
    rows.collect::<std::result::Result<Vec<_>, _>>()
        .map_err(AppError::from)
}

fn list_links_for_note(
    connection: &Connection,
    note_id: i32,
    branch_id: Option<i32>,
) -> Result<Vec<WikiLink>> {
    let project_id = connection
        .query_row(
            "SELECT project_id FROM notes WHERE id = ?1",
            params![note_id],
            |row| row.get::<_, i32>(0),
        )
        .optional()?;

    let Some(project_id) = project_id else {
        return Ok(Vec::new());
    };

    let visibility = branch_scope::visibility_triple(
        connection,
        project_id,
        branch_id,
        "wl.created_branch_id",
        "wl.created_at",
        "sn.created_branch_id",
        "sn.created_at",
        "tn.created_branch_id",
        "tn.created_at",
    )?;

    let mut sql = String::from(
        r#"
        SELECT
            wl.id,
            wl.project_id,
            wl.source_note_id,
            wl.target_note_id,
            wl.label,
            wl.created_at,
            sn.title AS source_title,
            tn.title AS target_title
        FROM wiki_links wl
        JOIN notes sn ON sn.id = wl.source_note_id
        JOIN notes tn ON tn.id = wl.target_note_id
        WHERE (wl.source_note_id = ? OR wl.target_note_id = ?)
        "#,
    );
    sql.push_str(&visibility.sql);
    sql.push_str(" ORDER BY wl.created_at DESC");

    let mut query_params: Vec<SqlValue> = vec![
        SqlValue::Integer(i64::from(note_id)),
        SqlValue::Integer(i64::from(note_id)),
    ];
    query_params.extend(visibility.params);

    let mut statement = connection.prepare(&sql)?;
    let rows = statement.query_map(params_from_iter(query_params.iter()), map_wiki_link_row)?;
    rows.collect::<std::result::Result<Vec<_>, _>>()
        .map_err(AppError::from)
}

pub fn create_link(connection: &Connection, input: &CreateWikiLinkInput) -> Result<WikiLink> {
    if input.source_note_id == input.target_note_id {
        return Err(AppError::internal(
            "WIKI_LINK_SELF",
            "Cannot link a note to itself",
        ));
    }

    if let Some(branch_id) = input.branch_id {
        branch_scope::assert_branch_belongs_to_project(connection, branch_id, input.project_id)?;
    }

    let created_branch_id =
        branch_scope::resolve_created_branch_id(connection, input.project_id, input.branch_id)?;

    let (source_id, target_id) = if input.source_note_id < input.target_note_id {
        (input.source_note_id, input.target_note_id)
    } else {
        (input.target_note_id, input.source_note_id)
    };

    let label = input.label.as_deref().unwrap_or("");

    connection
        .execute(
            r#"
            INSERT INTO wiki_links (project_id, source_note_id, target_note_id, label, created_branch_id)
            VALUES (?1, ?2, ?3, ?4, ?5)
            "#,
            params![
                input.project_id,
                source_id,
                target_id,
                label,
                created_branch_id
            ],
        )
        .map_err(map_wiki_link_write_error)?;

    let id = i32::try_from(connection.last_insert_rowid()).map_err(|_| {
        AppError::internal(
            "WIKI_LINK_ID_RANGE_ERROR",
            "Created wiki link id is out of range",
        )
    })?;

    get_link_by_id(connection, id)?.ok_or_else(|| {
        AppError::internal("WIKI_LINK_NOT_FOUND", "Wiki link not found after create")
    })
}

pub fn delete_link(connection: &Connection, input: &DeleteWikiLinkInput) -> Result<()> {
    let existing = get_link_by_id(connection, input.id)?;
    if existing.is_none() {
        return Err(AppError::internal(
            "WIKI_LINK_NOT_FOUND",
            "Wiki link not found",
        ));
    }

    connection
        .execute("DELETE FROM wiki_links WHERE id = ?1", params![input.id])
        .map_err(AppError::from)?;

    Ok(())
}

pub fn list_categories(
    connection: &Connection,
    input: &ListWikiCategoriesInput,
) -> Result<Vec<WikiCategory>> {
    let note_scope = branch_scope::branch_entity_visibility_sql(
        connection,
        input.project_id,
        input.branch_id,
        "n.created_branch_id",
        "n.created_at",
    )?;

    let mut sql = String::from(
        r#"
        SELECT t.name, COUNT(DISTINCT ta.entity_id) AS count
        FROM tags t
        JOIN tag_associations ta ON ta.tag_id = t.id AND ta.entity_type = 'note'
        JOIN notes n ON n.id = ta.entity_id AND n.note_type = 'wiki'
        WHERE t.project_id = ?
        "#,
    );
    sql.push_str(&note_scope.sql);
    sql.push_str(" GROUP BY t.name ORDER BY count DESC");

    let mut query_params: Vec<SqlValue> = vec![SqlValue::Integer(i64::from(input.project_id))];
    query_params.extend(note_scope.params);

    let mut statement = connection.prepare(&sql)?;
    let rows = statement.query_map(params_from_iter(query_params.iter()), |row| {
        Ok(WikiCategory {
            name: row.get(0)?,
            count: row.get(1)?,
        })
    })?;

    rows.collect::<std::result::Result<Vec<_>, _>>()
        .map_err(AppError::from)
}

fn get_link_by_id(connection: &Connection, id: i32) -> Result<Option<WikiLink>> {
    connection
        .query_row(
            r#"
            SELECT
                wl.id,
                wl.project_id,
                wl.source_note_id,
                wl.target_note_id,
                wl.label,
                wl.created_at,
                sn.title AS source_title,
                tn.title AS target_title
            FROM wiki_links wl
            JOIN notes sn ON sn.id = wl.source_note_id
            JOIN notes tn ON tn.id = wl.target_note_id
            WHERE wl.id = ?
            "#,
            params![id],
            map_wiki_link_row,
        )
        .optional()
        .map_err(AppError::from)
}

fn map_wiki_link_row(row: &Row<'_>) -> rusqlite::Result<WikiLink> {
    Ok(WikiLink {
        id: row.get(0)?,
        project_id: row.get(1)?,
        source_note_id: row.get(2)?,
        target_note_id: row.get(3)?,
        label: row.get(4)?,
        created_at: row.get(5)?,
        source_title: row.get(6)?,
        target_title: row.get(7)?,
    })
}

fn map_wiki_link_write_error(error: rusqlite::Error) -> AppError {
    if let rusqlite::Error::SqliteFailure(ref failure, _) = error {
        if failure.code == rusqlite::ErrorCode::ConstraintViolation {
            return AppError::internal(
                "WIKI_LINK_ALREADY_EXISTS",
                "Link between these notes already exists",
            );
        }
    }

    AppError::from(error)
}
