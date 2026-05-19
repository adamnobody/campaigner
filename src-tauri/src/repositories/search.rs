use rusqlite::{params, params_from_iter, types::Value as SqlValue, Connection};

use crate::error::{AppError, Result};
use crate::models::search::{SearchQueryInput, SearchResult, SearchResultType};
use crate::services::branch_scope;

fn create_snippet(content: &str, query: &str, radius: usize) -> String {
    if content.is_empty() {
        return String::new();
    }

    let lower_content = content.to_lowercase();
    let lower_query = query.to_lowercase();
    let Some(idx) = lower_content.find(&lower_query) else {
        return String::new();
    };

    let start = idx.saturating_sub(radius);
    let end = std::cmp::min(content.len(), idx + query.len() + radius);

    let prefix = if start > 0 { "..." } else { "" };
    let suffix = if end < content.len() { "..." } else { "" };

    format!("{prefix}{}{suffix}", &content[start..end])
}

fn type_priority(result_type: SearchResultType) -> i32 {
    match result_type {
        SearchResultType::Character => 0,
        SearchResultType::Faction => 1,
        SearchResultType::Note => 2,
        SearchResultType::Marker => 3,
        SearchResultType::Event => 4,
        SearchResultType::Dogma => 5,
        SearchResultType::Tag => 6,
    }
}

pub fn search_query(
    connection: &Connection,
    input: &SearchQueryInput,
) -> Result<Vec<SearchResult>> {
    let query = input.q.trim();
    if query.is_empty() || input.project_id <= 0 {
        return Ok(Vec::new());
    }

    let safe_limit = resolve_limit(input.limit)?;
    let like = format!("%{query}%");
    let project_id = input.project_id;
    let mut results = Vec::new();

    let char_scope = branch_scope::branch_entity_visibility_sql(
        connection,
        project_id,
        input.branch_id,
        "characters.created_branch_id",
        "characters.created_at",
    )?;
    let mut char_sql = String::from(
        r#"
        SELECT id, name, title, race, character_class, status
        FROM characters
        WHERE project_id = ? AND (
            name LIKE ? OR title LIKE ? OR race LIKE ? OR
            character_class LIKE ? OR bio LIKE ? OR backstory LIKE ?
        )
        "#,
    );
    char_sql.push_str(&char_scope.sql);
    char_sql.push_str(" LIMIT ?");

    let mut char_params: Vec<SqlValue> = vec![
        SqlValue::Integer(i64::from(project_id)),
        SqlValue::Text(like.clone()),
        SqlValue::Text(like.clone()),
        SqlValue::Text(like.clone()),
        SqlValue::Text(like.clone()),
        SqlValue::Text(like.clone()),
        SqlValue::Text(like.clone()),
    ];
    char_params.extend(char_scope.params);
    char_params.push(SqlValue::Integer(i64::from(safe_limit)));

    let mut char_statement = connection.prepare(&char_sql)?;
    let char_rows = char_statement.query_map(params_from_iter(char_params.iter()), |row| {
        Ok((
            row.get::<_, i32>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, String>(3)?,
            row.get::<_, String>(4)?,
            row.get::<_, String>(5)?,
        ))
    })?;
    for row in char_rows {
        let (id, name, title, race, character_class, status) = row?;
        let parts = [race, character_class, title]
            .into_iter()
            .filter(|part| !part.is_empty())
            .collect::<Vec<_>>();
        let subtitle = if parts.is_empty() {
            status
        } else {
            parts.join(" · ")
        };

        results.push(SearchResult {
            result_type: SearchResultType::Character,
            id,
            title: name,
            subtitle,
            icon: "👤".to_string(),
            url: format!("/project/{project_id}/characters/{id}"),
        });
    }

    let note_scope = branch_scope::branch_entity_visibility_sql(
        connection,
        project_id,
        input.branch_id,
        "notes.created_branch_id",
        "notes.created_at",
    )?;
    let mut note_sql = String::from(
        r#"
        SELECT id, title, content, note_type
        FROM notes
        WHERE project_id = ? AND (title LIKE ? OR content LIKE ?)
        "#,
    );
    note_sql.push_str(&note_scope.sql);
    note_sql.push_str(" LIMIT ?");

    let mut note_params: Vec<SqlValue> = vec![
        SqlValue::Integer(i64::from(project_id)),
        SqlValue::Text(like.clone()),
        SqlValue::Text(like.clone()),
    ];
    note_params.extend(note_scope.params);
    note_params.push(SqlValue::Integer(i64::from(safe_limit)));

    let mut note_statement = connection.prepare(&note_sql)?;
    let note_rows = note_statement.query_map(params_from_iter(note_params.iter()), |row| {
        Ok((
            row.get::<_, i32>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, String>(3)?,
        ))
    })?;
    for row in note_rows {
        let (id, title, content, note_type) = row?;
        let icon = match note_type.as_str() {
            "wiki" => "📖",
            "marker_note" => "📌",
            _ => "📝",
        };
        let snippet = create_snippet(&content, query, 30);
        let subtitle = if snippet.is_empty() {
            note_type
        } else {
            snippet
        };

        results.push(SearchResult {
            result_type: SearchResultType::Note,
            id,
            title,
            subtitle,
            icon: icon.to_string(),
            url: format!("/project/{project_id}/notes/{id}"),
        });
    }

    let marker_scope = branch_scope::branch_entity_visibility_sql(
        connection,
        project_id,
        input.branch_id,
        "mm.created_branch_id",
        "mm.created_at",
    )?;
    let mut marker_sql = String::from(
        r#"
        SELECT mm.id, mm.title, mm.description, mm.icon
        FROM map_markers mm
        JOIN maps m ON mm.map_id = m.id
        WHERE m.project_id = ? AND (mm.title LIKE ? OR mm.description LIKE ?)
        "#,
    );
    marker_sql.push_str(&marker_scope.sql);
    marker_sql.push_str(" LIMIT ?");

    let mut marker_params: Vec<SqlValue> = vec![
        SqlValue::Integer(i64::from(project_id)),
        SqlValue::Text(like.clone()),
        SqlValue::Text(like.clone()),
    ];
    marker_params.extend(marker_scope.params);
    marker_params.push(SqlValue::Integer(i64::from(safe_limit)));

    let mut marker_statement = connection.prepare(&marker_sql)?;
    let marker_rows =
        marker_statement.query_map(params_from_iter(marker_params.iter()), |row| {
            Ok((
                row.get::<_, i32>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
            ))
        })?;
    for row in marker_rows {
        let (id, title, description, _icon) = row?;
        let subtitle = if description.is_empty() {
            "Маркер на карте".to_string()
        } else {
            description
        };

        results.push(SearchResult {
            result_type: SearchResultType::Marker,
            id,
            title,
            subtitle,
            icon: "📍".to_string(),
            url: format!("/project/{project_id}/map"),
        });
    }

    let event_scope = branch_scope::branch_entity_visibility_sql(
        connection,
        project_id,
        input.branch_id,
        "timeline_events.created_branch_id",
        "timeline_events.created_at",
    )?;
    let mut event_sql = String::from(
        r#"
        SELECT id, title, description, event_date, era
        FROM timeline_events
        WHERE project_id = ? AND (title LIKE ? OR description LIKE ? OR era LIKE ?)
        "#,
    );
    event_sql.push_str(&event_scope.sql);
    event_sql.push_str(" LIMIT ?");

    let mut event_params: Vec<SqlValue> = vec![
        SqlValue::Integer(i64::from(project_id)),
        SqlValue::Text(like.clone()),
        SqlValue::Text(like.clone()),
        SqlValue::Text(like.clone()),
    ];
    event_params.extend(event_scope.params);
    event_params.push(SqlValue::Integer(i64::from(safe_limit)));

    let mut event_statement = connection.prepare(&event_sql)?;
    let event_rows = event_statement.query_map(params_from_iter(event_params.iter()), |row| {
        Ok((
            row.get::<_, i32>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, String>(3)?,
            row.get::<_, String>(4)?,
        ))
    })?;
    for row in event_rows {
        let (id, title, _description, event_date, era) = row?;
        let parts = [event_date, era]
            .into_iter()
            .filter(|part| !part.is_empty())
            .collect::<Vec<_>>();
        let subtitle = if parts.is_empty() {
            "Событие".to_string()
        } else {
            parts.join(" · ")
        };

        results.push(SearchResult {
            result_type: SearchResultType::Event,
            id,
            title,
            subtitle,
            icon: "📅".to_string(),
            url: format!("/project/{project_id}/timeline"),
        });
    }

    let dogma_scope = branch_scope::branch_entity_visibility_sql(
        connection,
        project_id,
        input.branch_id,
        "dogmas.created_branch_id",
        "dogmas.created_at",
    )?;
    let mut dogma_sql = String::from(
        r#"
        SELECT id, title, description, category, importance
        FROM dogmas
        WHERE project_id = ? AND (
            title LIKE ? OR description LIKE ? OR impact LIKE ? OR exceptions LIKE ?
        )
        "#,
    );
    dogma_sql.push_str(&dogma_scope.sql);
    dogma_sql.push_str(" LIMIT ?");

    let mut dogma_params: Vec<SqlValue> = vec![
        SqlValue::Integer(i64::from(project_id)),
        SqlValue::Text(like.clone()),
        SqlValue::Text(like.clone()),
        SqlValue::Text(like.clone()),
        SqlValue::Text(like.clone()),
    ];
    dogma_params.extend(dogma_scope.params);
    dogma_params.push(SqlValue::Integer(i64::from(safe_limit)));

    let mut dogma_statement = connection.prepare(&dogma_sql)?;
    let dogma_rows = dogma_statement.query_map(params_from_iter(dogma_params.iter()), |row| {
        Ok((
            row.get::<_, i32>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
        ))
    })?;
    for row in dogma_rows {
        let (id, title, description) = row?;
        let subtitle = if description.is_empty() {
            "Догма".to_string()
        } else {
            description.chars().take(80).collect()
        };

        results.push(SearchResult {
            result_type: SearchResultType::Dogma,
            id,
            title,
            subtitle,
            icon: "⚖️".to_string(),
            url: format!("/project/{project_id}/dogmas"),
        });
    }

    let faction_scope = branch_scope::branch_entity_visibility_sql(
        connection,
        project_id,
        input.branch_id,
        "factions.created_branch_id",
        "factions.created_at",
    )?;
    let mut faction_sql = String::from(
        r#"
        SELECT id, name, kind, type, motto, description, status
        FROM factions
        WHERE project_id = ? AND (
            name LIKE ? OR motto LIKE ? OR description LIKE ? OR headquarters LIKE ?
        )
        "#,
    );
    faction_sql.push_str(&faction_scope.sql);
    faction_sql.push_str(" LIMIT ?");

    let mut faction_params: Vec<SqlValue> = vec![
        SqlValue::Integer(i64::from(project_id)),
        SqlValue::Text(like.clone()),
        SqlValue::Text(like.clone()),
        SqlValue::Text(like.clone()),
        SqlValue::Text(like),
    ];
    faction_params.extend(faction_scope.params);
    faction_params.push(SqlValue::Integer(i64::from(safe_limit)));

    let mut faction_statement = connection.prepare(&faction_sql)?;
    let faction_rows =
        faction_statement.query_map(params_from_iter(faction_params.iter()), |row| {
            Ok((
                row.get::<_, i32>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, Option<String>>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, Option<String>>(5)?,
                row.get::<_, String>(6)?,
            ))
        })?;
    for row in faction_rows {
        let (id, name, kind, _faction_type, motto, description, status) = row?;
        let subtitle = if !motto.is_empty() {
            motto
        } else if let Some(desc) = description.filter(|value| !value.is_empty()) {
            desc.chars().take(80).collect()
        } else {
            status
        };
        let is_state = kind == "state";
        let base_path = if is_state { "states" } else { "factions" };

        results.push(SearchResult {
            result_type: SearchResultType::Faction,
            id,
            title: name,
            subtitle,
            icon: if is_state { "🏰" } else { "👥" }.to_string(),
            url: format!("/project/{project_id}/{base_path}/{id}"),
        });
    }

    let mut tag_statement = connection.prepare(
        r#"
        SELECT id, name, color
        FROM tags
        WHERE project_id = ? AND name LIKE ?
        LIMIT ?
        "#,
    )?;
    let tag_rows = tag_statement.query_map(
        params![project_id, format!("%{query}%"), safe_limit],
        |row| Ok((row.get::<_, i32>(0)?, row.get::<_, String>(1)?)),
    )?;
    for row in tag_rows {
        let (id, name) = row?;
        results.push(SearchResult {
            result_type: SearchResultType::Tag,
            id,
            title: name,
            subtitle: "Тег".to_string(),
            icon: "🏷️".to_string(),
            url: format!("/project/{project_id}/characters"),
        });
    }

    let lower_query = query.to_lowercase();
    results.sort_by(|left, right| {
        let left_exact = i32::from(left.title.to_lowercase() != lower_query);
        let right_exact = i32::from(right.title.to_lowercase() != lower_query);
        if left_exact != right_exact {
            return left_exact.cmp(&right_exact);
        }

        let left_starts = i32::from(!left.title.to_lowercase().starts_with(&lower_query));
        let right_starts = i32::from(!right.title.to_lowercase().starts_with(&lower_query));
        if left_starts != right_starts {
            return left_starts.cmp(&right_starts);
        }

        type_priority(left.result_type).cmp(&type_priority(right.result_type))
    });

    results.truncate(safe_limit as usize);
    Ok(results)
}

fn resolve_limit(limit: Option<i32>) -> Result<i32> {
    let value = limit.unwrap_or(20);
    if !(1..=50).contains(&value) {
        return Err(AppError::internal(
            "VALIDATION_ERROR",
            "Search limit must be between 1 and 50",
        ));
    }
    Ok(value)
}
