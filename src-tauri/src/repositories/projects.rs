use rusqlite::{params, Connection, OptionalExtension};

use crate::error::{AppError, Result};
use crate::models::note::CreateNoteInput;
use crate::models::project::{
    CreateProjectInput, DeleteProjectInput, GetProjectInput, Project, UpdateProjectInput,
};
use crate::models::timeline::CreateTimelineEventInput;
use crate::repositories::{character_traits_seed, maps, notes, timeline};

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

    let main_branch_name = input
        .main_branch_name
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or("Canon branch");

    connection.execute(
        r#"
        INSERT INTO scenario_branches (project_id, name, is_main, created_at, updated_at)
        VALUES (?1, ?2, 1, datetime('now'), datetime('now'))
        "#,
        params![id, main_branch_name],
    )?;

    let main_branch_id = i32::try_from(connection.last_insert_rowid()).map_err(|_| {
        AppError::internal(
            "BRANCH_ID_RANGE_ERROR",
            "Created main branch id is out of supported range",
        )
    })?;

    maps::create_root_map_for_project(connection, id, None, Some(main_branch_id))?;

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

pub fn create_demo_project(connection: &Connection, locale: &str) -> Result<Project> {
    let is_ru = locale == "ru";
    let project = create_project(
        connection,
        &CreateProjectInput {
            name: if is_ru {
                "Обучающая кампания".to_string()
            } else {
                "Tutorial campaign".to_string()
            },
            description: Some(if is_ru {
                "Интерактивное обучение базовым механикам Campaigner".to_string()
            } else {
                "Hands-on introduction to Campaigner: maps, notes, wiki, and timeline.".to_string()
            }),
            status: Some("active".to_string()),
            main_branch_name: Some(if is_ru {
                "Каноничная ветвь".to_string()
            } else {
                "Canonical branch".to_string()
            }),
        },
    )?;

    character_traits_seed::seed_predefined(connection, project.id)?;

    let main_branch_id: i32 = connection.query_row(
        "SELECT id FROM scenario_branches WHERE project_id = ?1 AND is_main = 1 LIMIT 1",
        params![project.id],
        |row| row.get(0),
    )?;

    let welcome_note = notes::create_note(
        connection,
        &CreateNoteInput {
            project_id: project.id,
            folder_id: None,
            title: if is_ru {
                "Добро пожаловать".to_string()
            } else {
                "Welcome".to_string()
            },
            content: Some(if is_ru {
                "Это обучающая кампания. Пройдите шаги, чтобы освоить карты, заметки, вики и таймлайн.".to_string()
            } else {
                "This is a tutorial project. Follow the tour to learn maps, notes, wiki pages, and the timeline.".to_string()
            }),
            format: Some("md".to_string()),
            note_type: Some("wiki".to_string()),
            is_pinned: Some(true),
            branch_id: Some(main_branch_id),
        },
    )?;

    notes::create_note(
        connection,
        &CreateNoteInput {
            project_id: project.id,
            folder_id: None,
            title: if is_ru {
                "Краткие подсказки".to_string()
            } else {
                "Quick tips".to_string()
            },
            content: Some(if is_ru {
                "Откройте карту, создайте маркеры и привяжите к ним заметки. События таймлайна можно связать со страницами вики — так проще держать хронологию и лор в одном месте.".to_string()
            } else {
                "Open the map, add markers, and link them to notes. Timeline events can link to wiki pages so chronology and lore stay connected.".to_string()
            }),
            format: Some("md".to_string()),
            note_type: Some("note".to_string()),
            is_pinned: Some(false),
            branch_id: Some(main_branch_id),
        },
    )?;

    timeline::create_timeline_event(
        connection,
        &CreateTimelineEventInput {
            project_id: project.id,
            title: if is_ru {
                "Начало обучения".to_string()
            } else {
                "Start of tutorial".to_string()
            },
            description: Some(if is_ru {
                "Первый шаг в Campaigner".to_string()
            } else {
                "Your first step in Campaigner".to_string()
            }),
            event_date: "0001-01-01".to_string(),
            sort_order: Some(0),
            era: Some(if is_ru {
                "Обучение".to_string()
            } else {
                "Tutorial".to_string()
            }),
            era_color: Some("#4CAF93".to_string()),
            linked_note_id: Some(welcome_note.id),
            branch_id: Some(main_branch_id),
        },
    )?;

    Ok(project)
}

pub fn delete_project(connection: &Connection, input: &DeleteProjectInput) -> Result<()> {
    let _ = get_project(connection, &GetProjectInput { id: input.id })?;
    connection.execute("DELETE FROM projects WHERE id = ?1", params![input.id])?;
    Ok(())
}

pub fn update_project_map_image_path(
    connection: &Connection,
    project_id: i32,
    map_image_path: &str,
) -> Result<()> {
    let updated = connection.execute(
        "UPDATE projects SET map_image_path = ?1, updated_at = datetime('now') WHERE id = ?2",
        params![map_image_path, project_id],
    )?;

    if updated == 0 {
        return Err(AppError::internal("PROJECT_NOT_FOUND", "Project not found"));
    }

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
