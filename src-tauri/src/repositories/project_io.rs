//! Project export/import (format 2.1). Mirrors Express `projectExport` / `projectImport` services.

use std::collections::HashMap;

use chrono::Utc;
use rusqlite::{params, Connection, Row};
use tauri::{AppHandle, Runtime};

use crate::error::{AppError, Result};
use crate::models::graph_layout::{GraphLayoutDataV1, UpsertGraphLayoutInput};
use crate::models::project::{GetProjectInput, Project};
use crate::models::project_io::{
    ExportCharacterRow, ExportDogmaRow, ExportDynastyEventRow, ExportDynastyFamilyLinkRow,
    ExportDynastyMemberRow, ExportDynastyRow, ExportFactionCustomMetricRow, ExportFactionMemberRow,
    ExportFactionRankRow, ExportFactionRelationRow, ExportFactionRow, ExportGraphLayoutRow,
    ExportMapRow, ExportMarkerRow, ExportNoteRow, ExportProjectMeta, ExportRelationshipRow,
    ExportScenarioBranchRow, ExportTagAssociationRow, ExportTagRow, ExportTerritoryRow,
    ExportTimelineEventRow, ExportWikiLinkRow, ImportedProjectPayload,
};
use crate::paths::UploadSubdir;
use crate::repositories::graph_layouts;
use crate::repositories::maps;
use crate::repositories::projects::get_project;
use crate::uploads::storage::{read_web_path_as_data_url, save_base64_data_url};

const EXPORT_VERSION: &str = "2.1";
const IMPORT_SUFFIX: &str = " (импорт)";

struct GraphLayoutEntityIdMaps<'a> {
    character_id_map: &'a HashMap<i32, i32>,
    faction_id_map: &'a HashMap<i32, i32>,
    dynasty_id_map: &'a HashMap<i32, i32>,
    dogma_id_map: &'a HashMap<i32, i32>,
    timeline_event_id_map: &'a HashMap<i32, i32>,
    note_id_map: &'a HashMap<i32, i32>,
}

pub fn export_project<R: Runtime>(
    app: &AppHandle<R>,
    connection: &Connection,
    project_id: i32,
) -> Result<ImportedProjectPayload> {
    export_project_inner::<R>(Some(app), connection, project_id)
}

fn export_project_inner<R: Runtime>(
    app: Option<&AppHandle<R>>,
    connection: &Connection,
    project_id: i32,
) -> Result<ImportedProjectPayload> {
    let project = get_project(connection, &GetProjectInput { id: project_id })?;

    let mut characters = load_characters(connection, project_id)?;
    let faction_ids_by_character = load_character_faction_ids(connection, project_id)?;
    for character in &mut characters {
        character.faction_ids = faction_ids_by_character
            .get(&character.id)
            .cloned()
            .unwrap_or_default();
        character.image_base64 =
            read_optional_web_path_as_data_url(app, character.image_path.as_deref().unwrap_or(""))?;
    }

    let relationships = load_relationships(connection, project_id)?;
    let notes = load_notes(connection, project_id)?;

    let mut maps = load_maps(connection, project_id)?;
    for map in &mut maps {
        map.image_base64 =
            read_optional_web_path_as_data_url(app, map.image_path.as_deref().unwrap_or(""))?;
    }

    let markers = load_markers(connection, project_id)?;
    let territories = load_territories(connection, project_id)?;
    let timeline_events = load_timeline_events(connection, project_id)?;
    let tags = load_tags(connection, project_id)?;
    let tag_associations = load_tag_associations(connection, project_id)?;
    let wiki_links = load_wiki_links(connection, project_id)?;
    let dogmas = load_dogmas(connection, project_id)?;

    let factions = load_factions(connection, project_id)?;
    let faction_custom_metrics = load_faction_custom_metrics(connection, project_id)?;
    let custom_metric_map = group_custom_metrics_by_faction(&faction_custom_metrics);
    let factions: Vec<ExportFactionRow> = factions
        .into_iter()
        .map(|mut faction| {
            faction.custom_metrics = custom_metric_map
                .get(&faction.id)
                .cloned()
                .unwrap_or_default();
            faction
        })
        .collect();

    let faction_ranks = load_faction_ranks(connection, project_id)?;
    let faction_members = load_faction_members(connection, project_id)?;
    let faction_relations = load_faction_relations(connection, project_id)?;
    let dynasties = load_dynasties(connection, project_id)?;
    let dynasty_members = load_dynasty_members(connection, project_id)?;
    let dynasty_family_links = load_dynasty_family_links(connection, project_id)?;
    let dynasty_events = load_dynasty_events(connection, project_id)?;
    let scenario_branches = load_scenario_branches(connection, project_id)?;
    let graph_layouts = load_graph_layouts(connection, project_id)?;

    let map_image_base64 =
        read_optional_web_path_as_data_url(app, project.map_image_path.as_deref().unwrap_or(""))?;

    Ok(ImportedProjectPayload {
        version: EXPORT_VERSION.to_string(),
        exported_at: Some(Utc::now().to_rfc3339()),
        project: ExportProjectMeta {
            name: project.name,
            description: Some(project.description).filter(|s| !s.is_empty()),
            status: Some(project.status).filter(|s| !s.is_empty()),
            map_image_base64,
        },
        characters,
        relationships,
        notes,
        folders: Vec::new(),
        maps,
        markers,
        territories,
        timeline_events,
        tags,
        tag_associations,
        wiki_links,
        dogmas,
        factions,
        faction_custom_metrics,
        faction_ranks,
        faction_members,
        faction_relations,
        dynasties,
        dynasty_members,
        dynasty_family_links,
        dynasty_events,
        scenario_branches,
        graph_layouts,
    })
}

pub fn import_project<R: Runtime>(
    app: &AppHandle<R>,
    connection: &Connection,
    payload: &ImportedProjectPayload,
    locale: &str,
    append_import_name_suffix: bool,
) -> Result<Project> {
    import_project_inner::<R>(
        Some(app),
        connection,
        payload,
        locale,
        append_import_name_suffix,
    )
}

fn import_project_inner<R: Runtime>(
    app: Option<&AppHandle<R>>,
    connection: &Connection,
    payload: &ImportedProjectPayload,
    locale: &str,
    append_import_name_suffix: bool,
) -> Result<Project> {
    tracing::info!("project import started");
    validate_import_payload(payload)?;

    let project_name = if append_import_name_suffix {
        format!("{}{IMPORT_SUFFIX}", payload.project.name)
    } else {
        payload.project.name.clone()
    };

    let main_branch_name = if locale == "ru" {
        "Каноничная ветвь"
    } else {
        "Canonical branch"
    };

    let tx = connection.unchecked_transaction()?;
    let import_result =
        import_project_in_transaction(app, &tx, payload, &project_name, main_branch_name);

    match import_result {
        Ok(project_id) => {
            tx.commit()?;
            tracing::info!(project_id, "project import finished");
            get_project(connection, &GetProjectInput { id: project_id })
        }
        Err(error) => {
            tracing::warn!(?error, "project import failed, rolling back");
            Err(error)
        }
    }
}

fn validate_import_payload(payload: &ImportedProjectPayload) -> Result<()> {
    if payload.version != EXPORT_VERSION {
        tracing::warn!(
            version = %payload.version,
            "project import rejected: unsupported export version"
        );
        return Err(AppError::internal(
            "VALIDATION_ERROR",
            format!("Unsupported export version: expected {EXPORT_VERSION}"),
        ));
    }

    if payload.project.name.trim().is_empty() {
        tracing::warn!("project import rejected: empty project name");
        return Err(AppError::internal(
            "VALIDATION_ERROR",
            "Invalid export file format: project name is required",
        ));
    }

    Ok(())
}

fn read_optional_web_path_as_data_url<R: Runtime>(
    app: Option<&AppHandle<R>>,
    web_path: &str,
) -> Result<Option<String>> {
    match app {
        Some(handle) => read_web_path_as_data_url(handle, web_path),
        None => Ok(None),
    }
}

fn save_optional_base64_data_url<R: Runtime>(
    app: Option<&AppHandle<R>>,
    subdir: UploadSubdir,
    data_url: &str,
) -> Result<Option<String>> {
    match app {
        Some(handle) => save_base64_data_url(handle, subdir, data_url),
        None => Ok(None),
    }
}

fn import_project_in_transaction<R: Runtime>(
    app: Option<&AppHandle<R>>,
    connection: &Connection,
    data: &ImportedProjectPayload,
    project_name: &str,
    main_branch_name: &str,
) -> Result<i32> {
    let description = data.project.description.as_deref().unwrap_or("");
    let status = data.project.status.as_deref().unwrap_or("active");

    connection.execute(
        "INSERT INTO projects (name, description, status) VALUES (?1, ?2, ?3)",
        params![project_name, description, status],
    )?;
    let project_id = last_insert_id(connection)?;

    let mut branch_id_map = HashMap::new();
    let main_branch_id = import_scenario_branches(
        connection,
        project_id,
        &data.scenario_branches,
        main_branch_name,
        &mut branch_id_map,
    )?;

    if data.maps.is_empty() {
        maps::create_root_map_for_project(connection, project_id, None, Some(main_branch_id))?;
    }

    if let Some(ref map_image_base64) = data.project.map_image_base64 {
        if let Some(map_path) =
            save_optional_base64_data_url(app, UploadSubdir::Maps, map_image_base64)?
        {
            connection.execute(
                "UPDATE projects SET map_image_path = ?1 WHERE id = ?2",
                params![map_path, project_id],
            )?;
        }
    }

    let mut character_id_map = HashMap::new();
    let mut note_id_map = HashMap::new();
    let mut tag_id_map = HashMap::new();
    let mut map_id_map = HashMap::new();
    let mut marker_id_map = HashMap::new();
    let mut timeline_event_id_map = HashMap::new();
    let mut dogma_id_map = HashMap::new();
    let mut faction_id_map = HashMap::new();
    let mut imported_faction_kind_map = HashMap::new();
    let mut faction_rank_id_map = HashMap::new();
    let mut dynasty_id_map = HashMap::new();

    import_maps(
        app,
        connection,
        project_id,
        main_branch_id,
        &data.maps,
        &mut map_id_map,
    )?;
    import_tags(connection, project_id, &data.tags, &mut tag_id_map)?;
    import_characters(
        app,
        connection,
        project_id,
        main_branch_id,
        &data.characters,
        &mut character_id_map,
    )?;
    import_notes(
        connection,
        project_id,
        main_branch_id,
        &data.notes,
        &mut note_id_map,
    )?;
    import_relationships(
        connection,
        project_id,
        main_branch_id,
        &data.relationships,
        &character_id_map,
    )?;
    import_markers_and_parent_links(
        connection,
        main_branch_id,
        &data.markers,
        &data.maps,
        &map_id_map,
        &note_id_map,
        &mut marker_id_map,
    )?;
    import_timeline_events(
        connection,
        project_id,
        main_branch_id,
        &data.timeline_events,
        &note_id_map,
        &mut timeline_event_id_map,
    )?;
    import_wiki_links(
        connection,
        project_id,
        main_branch_id,
        &data.wiki_links,
        &note_id_map,
    )?;
    import_dogmas(
        connection,
        project_id,
        main_branch_id,
        &data.dogmas,
        &mut dogma_id_map,
    )?;
    import_factions(
        connection,
        project_id,
        main_branch_id,
        &data.factions,
        &mut faction_id_map,
        &mut imported_faction_kind_map,
    )?;
    import_legacy_faction_custom_metrics(
        connection,
        &data.faction_custom_metrics,
        &faction_id_map,
    )?;
    import_character_state_and_factions(
        connection,
        &data.characters,
        &character_id_map,
        &faction_id_map,
        &imported_faction_kind_map,
    )?;
    import_faction_ranks(
        connection,
        &data.faction_ranks,
        &faction_id_map,
        &mut faction_rank_id_map,
    )?;
    import_faction_members(
        connection,
        &data.faction_members,
        &faction_id_map,
        &character_id_map,
        &faction_rank_id_map,
    )?;
    import_faction_relations(
        connection,
        project_id,
        &data.faction_relations,
        &faction_id_map,
    )?;
    import_territories(
        connection,
        main_branch_id,
        &data.territories,
        &map_id_map,
        &faction_id_map,
    )?;
    import_dynasties(
        connection,
        project_id,
        main_branch_id,
        &data.dynasties,
        &character_id_map,
        &faction_id_map,
        &mut dynasty_id_map,
    )?;
    import_dynasty_members(
        connection,
        &data.dynasty_members,
        &dynasty_id_map,
        &character_id_map,
    )?;
    import_dynasty_family_links(
        connection,
        &data.dynasty_family_links,
        &dynasty_id_map,
        &character_id_map,
    )?;
    import_dynasty_events(connection, &data.dynasty_events, &dynasty_id_map)?;
    import_tag_associations(
        connection,
        &data.tag_associations,
        &tag_id_map,
        &character_id_map,
        &note_id_map,
        &timeline_event_id_map,
        &dogma_id_map,
        &faction_id_map,
        &dynasty_id_map,
    )?;
    import_graph_layouts(
        connection,
        project_id,
        &data.graph_layouts,
        &branch_id_map,
        GraphLayoutEntityIdMaps {
            character_id_map: &character_id_map,
            faction_id_map: &faction_id_map,
            dynasty_id_map: &dynasty_id_map,
            dogma_id_map: &dogma_id_map,
            timeline_event_id_map: &timeline_event_id_map,
            note_id_map: &note_id_map,
        },
    )?;

    Ok(project_id)
}

fn last_insert_id(connection: &Connection) -> Result<i32> {
    i32::try_from(connection.last_insert_rowid()).map_err(|_| {
        AppError::internal(
            "ID_RANGE_ERROR",
            "Last insert row id is out of supported range",
        )
    })
}

fn collect_rows<T, F>(rows: rusqlite::MappedRows<'_, F>) -> Result<Vec<T>>
where
    F: FnMut(&Row<'_>) -> rusqlite::Result<T>,
{
    let mut results = Vec::new();
    for row in rows {
        results.push(row?);
    }
    Ok(results)
}

fn group_custom_metrics_by_faction(
    metrics: &[ExportFactionCustomMetricRow],
) -> HashMap<i32, Vec<ExportFactionCustomMetricRow>> {
    let mut map: HashMap<i32, Vec<ExportFactionCustomMetricRow>> = HashMap::new();
    for metric in metrics {
        map.entry(metric.faction_id)
            .or_default()
            .push(metric.clone());
    }
    map
}

fn parse_layout_data(raw: &str) -> GraphLayoutDataV1 {
    match serde_json::from_str::<GraphLayoutDataV1>(raw) {
        Ok(parsed) if parsed.version == 1 => parsed,
        _ => graph_layouts::empty_graph_layout_data(),
    }
}

fn sort_scenario_branches_for_import(
    branches: &[ExportScenarioBranchRow],
) -> Result<Vec<ExportScenarioBranchRow>> {
    let by_id: HashMap<i32, &ExportScenarioBranchRow> =
        branches.iter().map(|b| (b.id, b)).collect();
    let mains: Vec<&ExportScenarioBranchRow> = branches.iter().filter(|b| b.is_main).collect();
    if mains.len() != 1 {
        return Err(AppError::internal(
            "VALIDATION_ERROR",
            "scenarioBranches must include exactly one main branch",
        ));
    }

    let mut result = vec![(*mains[0]).clone()];
    let mut remaining: std::collections::HashSet<i32> = branches
        .iter()
        .filter(|b| !b.is_main)
        .map(|b| b.id)
        .collect();

    while !remaining.is_empty() {
        let mut progressed = false;
        for id in remaining.clone() {
            let branch = by_id.get(&id).ok_or_else(|| {
                AppError::internal("VALIDATION_ERROR", "Invalid scenarioBranches hierarchy")
            })?;
            let parent_id = branch.parent_branch_id.ok_or_else(|| {
                AppError::internal(
                    "VALIDATION_ERROR",
                    "Non-main scenario branch must have parentBranchId",
                )
            })?;
            if !result.iter().any(|r| r.id == parent_id) {
                continue;
            }
            result.push((*branch).clone());
            remaining.remove(&id);
            progressed = true;
        }
        if !progressed {
            return Err(AppError::internal(
                "VALIDATION_ERROR",
                "Invalid scenarioBranches hierarchy",
            ));
        }
    }

    Ok(result)
}

fn import_scenario_branches(
    connection: &Connection,
    project_id: i32,
    branches: &[ExportScenarioBranchRow],
    main_branch_name: &str,
    branch_id_map: &mut HashMap<i32, i32>,
) -> Result<i32> {
    if branches.is_empty() {
        connection.execute(
            r#"
            INSERT INTO scenario_branches (project_id, name, is_main, created_at, updated_at)
            VALUES (?1, ?2, 1, datetime('now'), datetime('now'))
            "#,
            params![project_id, main_branch_name],
        )?;
        return last_insert_id(connection);
    }

    let sorted = sort_scenario_branches_for_import(branches)?;
    let mut main_branch_id = 0;

    for branch in sorted {
        let new_parent_id = branch
            .parent_branch_id
            .and_then(|parent_id| branch_id_map.get(&parent_id).copied());
        connection.execute(
            r#"
            INSERT INTO scenario_branches (project_id, name, parent_branch_id, base_revision, is_main, created_at, updated_at)
            VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'), datetime('now'))
            "#,
            params![
                project_id,
                branch.name,
                new_parent_id,
                branch.base_revision,
                if branch.is_main { 1 } else { 0 },
            ],
        )?;
        let new_branch_id = last_insert_id(connection)?;
        branch_id_map.insert(branch.id, new_branch_id);
        if branch.is_main {
            main_branch_id = new_branch_id;
        }
    }

    if main_branch_id == 0 {
        return Err(AppError::internal(
            "VALIDATION_ERROR",
            "scenarioBranches must define a main branch",
        ));
    }

    Ok(main_branch_id)
}

fn remap_graph_layout_data_for_import(
    layout_data: &GraphLayoutDataV1,
    maps: &GraphLayoutEntityIdMaps<'_>,
) -> GraphLayoutDataV1 {
    let mut nodes = HashMap::new();
    for (key, pos) in &layout_data.nodes {
        if let Some(next_key) = remap_graph_layout_node_key(key, maps) {
            nodes.insert(next_key, pos.clone());
        }
    }
    GraphLayoutDataV1 {
        version: 1,
        viewport: layout_data.viewport.clone(),
        nodes,
    }
}

fn remap_graph_layout_node_key(key: &str, maps: &GraphLayoutEntityIdMaps<'_>) -> Option<String> {
    let colon = key.find(':')?;
    if colon < 1 {
        return None;
    }
    let entity_type = &key[..colon];
    let id_str = &key[colon + 1..];
    let old_id: i32 = id_str.parse().ok()?;

    let normalized_type = if entity_type == "event" {
        "timeline"
    } else {
        entity_type
    };

    let (new_id, out_type) = match normalized_type {
        "character" => (maps.character_id_map.get(&old_id).copied(), normalized_type),
        "faction" | "state" => (maps.faction_id_map.get(&old_id).copied(), normalized_type),
        "dynasty" => (maps.dynasty_id_map.get(&old_id).copied(), normalized_type),
        "dogma" => (maps.dogma_id_map.get(&old_id).copied(), normalized_type),
        "timeline" => (
            maps.timeline_event_id_map.get(&old_id).copied(),
            normalized_type,
        ),
        "note" | "wiki" => (maps.note_id_map.get(&old_id).copied(), normalized_type),
        _ => return None,
    };

    let new_id = new_id?;
    Some(format!("{out_type}:{new_id}"))
}

// --- Export loaders ---

fn load_characters(connection: &Connection, project_id: i32) -> Result<Vec<ExportCharacterRow>> {
    let mut statement = connection.prepare(
        r#"
        SELECT
            id,
            name,
            title,
            race,
            character_class AS character_class,
            level,
            status,
            bio,
            appearance,
            personality,
            backstory,
            notes,
            state_id AS state_id,
            image_path AS image_path,
            created_at AS created_at,
            updated_at AS updated_at
        FROM characters
        WHERE project_id = ?1
        "#,
    )?;
    let rows = statement.query_map(params![project_id], map_character_row)?;
    collect_rows(rows)
}

fn map_character_row(row: &Row<'_>) -> rusqlite::Result<ExportCharacterRow> {
    Ok(ExportCharacterRow {
        id: row.get("id")?,
        name: row.get("name")?,
        title: row.get("title")?,
        race: row.get("race")?,
        character_class: row.get("character_class")?,
        level: row.get("level")?,
        status: row.get("status")?,
        bio: row.get("bio")?,
        appearance: row.get("appearance")?,
        personality: row.get("personality")?,
        backstory: row.get("backstory")?,
        notes: row.get("notes")?,
        state_id: row.get("state_id")?,
        faction_ids: Vec::new(),
        image_path: row.get("image_path")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        image_base64: None,
    })
}

fn load_character_faction_ids(
    connection: &Connection,
    project_id: i32,
) -> Result<HashMap<i32, Vec<i32>>> {
    let mut statement = connection.prepare(
        r#"
        SELECT cf.character_id AS character_id, cf.faction_id AS faction_id
        FROM character_factions cf
        JOIN characters c ON c.id = cf.character_id
        WHERE c.project_id = ?1
        "#,
    )?;
    let rows = statement
        .query_map(params![project_id], |row| {
            Ok((
                row.get::<_, i32>("character_id")?,
                row.get::<_, i32>("faction_id")?,
            ))
        })?
        .collect::<rusqlite::Result<Vec<_>>>()?;

    let mut map: HashMap<i32, Vec<i32>> = HashMap::new();
    for (character_id, faction_id) in rows {
        map.entry(character_id).or_default().push(faction_id);
    }
    Ok(map)
}

fn load_relationships(
    connection: &Connection,
    project_id: i32,
) -> Result<Vec<ExportRelationshipRow>> {
    let mut statement = connection.prepare(
        r#"
        SELECT
            id,
            source_character_id AS source_character_id,
            target_character_id AS target_character_id,
            relationship_type AS relationship_type,
            custom_label AS custom_label,
            description,
            is_bidirectional AS is_bidirectional,
            created_at AS created_at
        FROM character_relationships
        WHERE project_id = ?1
        "#,
    )?;
    let rows = statement.query_map(params![project_id], |row| {
        Ok(ExportRelationshipRow {
            id: row.get("id")?,
            source_character_id: row.get("source_character_id")?,
            target_character_id: row.get("target_character_id")?,
            relationship_type: row.get("relationship_type")?,
            custom_label: row.get("custom_label")?,
            description: row.get("description")?,
            is_bidirectional: row.get::<_, i32>("is_bidirectional")? != 0,
            created_at: row.get("created_at")?,
        })
    })?;
    collect_rows(rows)
}

fn load_notes(connection: &Connection, project_id: i32) -> Result<Vec<ExportNoteRow>> {
    let mut statement = connection.prepare(
        r#"
        SELECT
            id,
            folder_id AS folder_id,
            title,
            content,
            format,
            note_type AS note_type,
            is_pinned AS is_pinned,
            created_at AS created_at,
            updated_at AS updated_at
        FROM notes
        WHERE project_id = ?1
        "#,
    )?;
    let rows = statement.query_map(params![project_id], |row| {
        Ok(ExportNoteRow {
            id: row.get("id")?,
            folder_id: row.get("folder_id")?,
            title: row.get("title")?,
            content: row.get("content")?,
            format: row.get("format")?,
            note_type: row.get("note_type")?,
            is_pinned: row.get::<_, i32>("is_pinned")? != 0,
            created_at: row.get("created_at")?,
            updated_at: row.get("updated_at")?,
        })
    })?;
    collect_rows(rows)
}

fn load_maps(connection: &Connection, project_id: i32) -> Result<Vec<ExportMapRow>> {
    let mut statement = connection.prepare(
        r#"
        SELECT
            id,
            project_id AS project_id,
            parent_map_id AS parent_map_id,
            parent_marker_id AS parent_marker_id,
            name,
            image_path AS image_path,
            created_at AS created_at,
            updated_at AS updated_at
        FROM maps
        WHERE project_id = ?1
        "#,
    )?;
    let rows = statement.query_map(params![project_id], |row| {
        Ok(ExportMapRow {
            id: row.get("id")?,
            project_id: row.get("project_id")?,
            parent_map_id: row.get("parent_map_id")?,
            parent_marker_id: row.get("parent_marker_id")?,
            name: row.get("name")?,
            image_path: row.get("image_path")?,
            created_at: row.get("created_at")?,
            updated_at: row.get("updated_at")?,
            image_base64: None,
        })
    })?;
    collect_rows(rows)
}

fn load_markers(connection: &Connection, project_id: i32) -> Result<Vec<ExportMarkerRow>> {
    let mut statement = connection.prepare(
        r#"
        SELECT
            mm.id AS id,
            mm.map_id AS map_id,
            mm.title AS title,
            mm.description AS description,
            mm.position_x AS position_x,
            mm.position_y AS position_y,
            mm.color AS color,
            mm.icon AS icon,
            mm.linked_note_id AS linked_note_id,
            mm.child_map_id AS child_map_id,
            mm.created_at AS created_at,
            mm.updated_at AS updated_at
        FROM map_markers mm
        JOIN maps m ON mm.map_id = m.id
        WHERE m.project_id = ?1
        "#,
    )?;
    let rows = statement.query_map(params![project_id], |row| {
        Ok(ExportMarkerRow {
            id: row.get("id")?,
            map_id: row.get("map_id")?,
            title: row.get("title")?,
            description: row.get("description")?,
            position_x: row.get("position_x")?,
            position_y: row.get("position_y")?,
            color: row.get("color")?,
            icon: row.get("icon")?,
            linked_note_id: row.get("linked_note_id")?,
            child_map_id: row.get("child_map_id")?,
            created_at: row.get("created_at")?,
            updated_at: row.get("updated_at")?,
        })
    })?;
    collect_rows(rows)
}

fn load_territories(connection: &Connection, project_id: i32) -> Result<Vec<ExportTerritoryRow>> {
    let mut statement = connection.prepare(
        r#"
        SELECT
            mt.id AS id,
            mt.map_id AS map_id,
            mt.name AS name,
            mt.description AS description,
            mt.color AS color,
            mt.opacity AS opacity,
            mt.border_color AS border_color,
            mt.border_width AS border_width,
            mt.points AS points,
            mt.faction_id AS faction_id,
            mt.smoothing AS smoothing,
            mt.sort_order AS sort_order,
            mt.created_at AS created_at,
            mt.updated_at AS updated_at
        FROM map_territories mt
        JOIN maps m ON mt.map_id = m.id
        WHERE m.project_id = ?1
        "#,
    )?;
    let rows = statement.query_map(params![project_id], |row| {
        Ok(ExportTerritoryRow {
            id: row.get("id")?,
            map_id: row.get("map_id")?,
            name: row.get("name")?,
            description: row.get("description")?,
            color: row.get("color")?,
            opacity: row.get("opacity")?,
            border_color: row.get("border_color")?,
            border_width: row.get("border_width")?,
            points: row.get("points")?,
            faction_id: row.get("faction_id")?,
            smoothing: row.get("smoothing")?,
            sort_order: row.get("sort_order")?,
            created_at: row.get("created_at")?,
            updated_at: row.get("updated_at")?,
        })
    })?;
    collect_rows(rows)
}

fn load_timeline_events(
    connection: &Connection,
    project_id: i32,
) -> Result<Vec<ExportTimelineEventRow>> {
    let mut statement = connection.prepare(
        r#"
        SELECT
            id,
            title,
            description,
            event_date AS event_date,
            sort_order AS sort_order,
            era,
            COALESCE(era_color, '') AS era_color,
            linked_note_id AS linked_note_id,
            created_at AS created_at,
            updated_at AS updated_at
        FROM timeline_events
        WHERE project_id = ?1
        "#,
    )?;
    let rows = statement.query_map(params![project_id], |row| {
        let era_color: String = row.get("era_color")?;
        Ok(ExportTimelineEventRow {
            id: row.get("id")?,
            title: row.get("title")?,
            description: row.get("description")?,
            event_date: row.get("event_date")?,
            sort_order: row.get("sort_order")?,
            era: row.get("era")?,
            era_color: if era_color.is_empty() {
                None
            } else {
                Some(era_color)
            },
            linked_note_id: row.get("linked_note_id")?,
            created_at: row.get("created_at")?,
            updated_at: row.get("updated_at")?,
        })
    })?;
    collect_rows(rows)
}

fn load_tags(connection: &Connection, project_id: i32) -> Result<Vec<ExportTagRow>> {
    let mut statement =
        connection.prepare("SELECT id, name, color FROM tags WHERE project_id = ?1")?;
    let rows = statement.query_map(params![project_id], |row| {
        Ok(ExportTagRow {
            id: row.get("id")?,
            name: row.get("name")?,
            color: row.get("color")?,
        })
    })?;
    collect_rows(rows)
}

fn load_tag_associations(
    connection: &Connection,
    project_id: i32,
) -> Result<Vec<ExportTagAssociationRow>> {
    let mut statement = connection.prepare(
        r#"
        SELECT ta.tag_id AS tag_id, ta.entity_type AS entity_type, ta.entity_id AS entity_id
        FROM tag_associations ta
        JOIN tags t ON ta.tag_id = t.id
        WHERE t.project_id = ?1
        "#,
    )?;
    let rows = statement.query_map(params![project_id], |row| {
        Ok(ExportTagAssociationRow {
            tag_id: row.get("tag_id")?,
            entity_type: row.get("entity_type")?,
            entity_id: row.get("entity_id")?,
        })
    })?;
    collect_rows(rows)
}

fn load_wiki_links(connection: &Connection, project_id: i32) -> Result<Vec<ExportWikiLinkRow>> {
    let mut statement = connection.prepare(
        r#"
        SELECT id, source_note_id AS source_note_id, target_note_id AS target_note_id,
               label, created_at AS created_at
        FROM wiki_links
        WHERE project_id = ?1
        "#,
    )?;
    let rows = statement.query_map(params![project_id], |row| {
        Ok(ExportWikiLinkRow {
            id: row.get("id")?,
            source_note_id: row.get("source_note_id")?,
            target_note_id: row.get("target_note_id")?,
            label: row.get("label")?,
            created_at: row.get("created_at")?,
        })
    })?;
    collect_rows(rows)
}

fn load_dogmas(connection: &Connection, project_id: i32) -> Result<Vec<ExportDogmaRow>> {
    let mut statement = connection.prepare(
        r#"
        SELECT
            id, title, category, description, impact, exceptions,
            is_public AS is_public, importance, status, sort_order AS sort_order,
            icon, color, created_at AS created_at, updated_at AS updated_at
        FROM dogmas
        WHERE project_id = ?1
        "#,
    )?;
    let rows = statement.query_map(params![project_id], |row| {
        Ok(ExportDogmaRow {
            id: row.get("id")?,
            title: row.get("title")?,
            category: row.get("category")?,
            description: row.get("description")?,
            impact: row.get("impact")?,
            exceptions: row.get("exceptions")?,
            is_public: row.get::<_, i32>("is_public")? != 0,
            importance: row.get("importance")?,
            status: row.get("status")?,
            sort_order: row.get("sort_order")?,
            icon: row.get("icon")?,
            color: row.get("color")?,
            created_at: row.get("created_at")?,
            updated_at: row.get("updated_at")?,
        })
    })?;
    collect_rows(rows)
}

fn load_factions(connection: &Connection, project_id: i32) -> Result<Vec<ExportFactionRow>> {
    let mut statement = connection.prepare(
        r#"
        SELECT
            id, name, kind, type AS type, motto, description, history,
            goals, headquarters, territory, treasury, population,
            army_size AS army_size, navy_size AS navy_size,
            territory_km2 AS territory_km2, annual_income AS annual_income,
            annual_expenses AS annual_expenses, members_count AS members_count,
            influence, status, color,
            secondary_color AS secondary_color, image_path AS image_path,
            banner_path AS banner_path, founded_date AS founded_date,
            disbanded_date AS disbanded_date, parent_faction_id AS parent_faction_id,
            sort_order AS sort_order, created_at AS created_at, updated_at AS updated_at
        FROM factions
        WHERE project_id = ?1
        "#,
    )?;
    let rows = statement.query_map(params![project_id], |row| {
        Ok(ExportFactionRow {
            id: row.get("id")?,
            name: row.get("name")?,
            kind: row.get("kind")?,
            r#type: row.get("type")?,
            motto: row.get("motto")?,
            description: row.get("description")?,
            history: row.get("history")?,
            goals: row.get("goals")?,
            headquarters: row.get("headquarters")?,
            territory: row.get("territory")?,
            treasury: row.get("treasury")?,
            population: row.get("population")?,
            army_size: row.get("army_size")?,
            navy_size: row.get("navy_size")?,
            territory_km2: row.get("territory_km2")?,
            annual_income: row.get("annual_income")?,
            annual_expenses: row.get("annual_expenses")?,
            members_count: row.get("members_count")?,
            influence: row.get("influence")?,
            custom_metrics: Vec::new(),
            status: row.get("status")?,
            color: row.get("color")?,
            secondary_color: row.get("secondary_color")?,
            image_path: row.get("image_path")?,
            banner_path: row.get("banner_path")?,
            founded_date: row.get("founded_date")?,
            disbanded_date: row.get("disbanded_date")?,
            parent_faction_id: row.get("parent_faction_id")?,
            sort_order: row.get("sort_order")?,
            created_at: row.get("created_at")?,
            updated_at: row.get("updated_at")?,
        })
    })?;
    collect_rows(rows)
}

fn load_faction_custom_metrics(
    connection: &Connection,
    project_id: i32,
) -> Result<Vec<ExportFactionCustomMetricRow>> {
    let mut statement = connection.prepare(
        r#"
        SELECT id, faction_id AS faction_id, name, value, unit, sort_order AS sort_order,
               created_at AS created_at, updated_at AS updated_at
        FROM faction_custom_metrics
        WHERE faction_id IN (SELECT id FROM factions WHERE project_id = ?1)
        ORDER BY sort_order ASC, id ASC
        "#,
    )?;
    let rows = statement.query_map(params![project_id], |row| {
        Ok(ExportFactionCustomMetricRow {
            id: row.get("id")?,
            faction_id: row.get("faction_id")?,
            name: row.get("name")?,
            value: row.get("value")?,
            unit: row.get("unit")?,
            sort_order: row.get("sort_order")?,
            created_at: row.get("created_at")?,
            updated_at: row.get("updated_at")?,
        })
    })?;
    collect_rows(rows)
}

fn load_faction_ranks(
    connection: &Connection,
    project_id: i32,
) -> Result<Vec<ExportFactionRankRow>> {
    let mut statement = connection.prepare(
        r#"
        SELECT fr.id AS id, fr.faction_id AS faction_id, fr.name AS name, fr.level AS level,
               fr.description AS description, fr.permissions AS permissions,
               fr.icon AS icon, fr.color AS color
        FROM faction_ranks fr
        JOIN factions f ON fr.faction_id = f.id
        WHERE f.project_id = ?1
        "#,
    )?;
    let rows = statement.query_map(params![project_id], |row| {
        Ok(ExportFactionRankRow {
            id: row.get("id")?,
            faction_id: row.get("faction_id")?,
            name: row.get("name")?,
            level: row.get("level")?,
            description: row.get("description")?,
            permissions: row.get("permissions")?,
            icon: row.get("icon")?,
            color: row.get("color")?,
        })
    })?;
    collect_rows(rows)
}

fn load_faction_members(
    connection: &Connection,
    project_id: i32,
) -> Result<Vec<ExportFactionMemberRow>> {
    let mut statement = connection.prepare(
        r#"
        SELECT fm.id AS id, fm.faction_id AS faction_id, fm.character_id AS character_id,
               fm.rank_id AS rank_id, fm.role AS role, fm.joined_date AS joined_date,
               fm.left_date AS left_date, fm.is_active AS is_active, fm.notes AS notes
        FROM faction_members fm
        JOIN factions f ON fm.faction_id = f.id
        WHERE f.project_id = ?1
        "#,
    )?;
    let rows = statement.query_map(params![project_id], |row| {
        Ok(ExportFactionMemberRow {
            id: row.get("id")?,
            faction_id: row.get("faction_id")?,
            character_id: row.get("character_id")?,
            rank_id: row.get("rank_id")?,
            role: row.get("role")?,
            joined_date: row.get("joined_date")?,
            left_date: row.get("left_date")?,
            is_active: row.get::<_, i32>("is_active")? != 0,
            notes: row.get("notes")?,
        })
    })?;
    collect_rows(rows)
}

fn load_faction_relations(
    connection: &Connection,
    project_id: i32,
) -> Result<Vec<ExportFactionRelationRow>> {
    let mut statement = connection.prepare(
        r#"
        SELECT fr.id AS id, fr.source_faction_id AS source_faction_id,
               fr.target_faction_id AS target_faction_id, fr.relation_type AS relation_type,
               fr.custom_label AS custom_label, fr.description AS description,
               fr.started_date AS started_date, fr.is_bidirectional AS is_bidirectional,
               fr.created_at AS created_at
        FROM faction_relations fr
        WHERE fr.project_id = ?1
        "#,
    )?;
    let rows = statement.query_map(params![project_id], |row| {
        Ok(ExportFactionRelationRow {
            id: row.get("id")?,
            source_faction_id: row.get("source_faction_id")?,
            target_faction_id: row.get("target_faction_id")?,
            relation_type: row.get("relation_type")?,
            custom_label: row.get("custom_label")?,
            description: row.get("description")?,
            started_date: row.get("started_date")?,
            is_bidirectional: row.get::<_, i32>("is_bidirectional")? != 0,
            created_at: row.get("created_at")?,
        })
    })?;
    collect_rows(rows)
}

fn load_dynasties(connection: &Connection, project_id: i32) -> Result<Vec<ExportDynastyRow>> {
    let mut statement = connection.prepare(
        r#"
        SELECT
            id, name, motto, description, history, status, color,
            secondary_color AS secondary_color, image_path AS image_path,
            founded_date AS founded_date, extinct_date AS extinct_date,
            founder_id AS founder_id, current_leader_id AS current_leader_id,
            heir_id AS heir_id, linked_faction_id AS linked_faction_id,
            sort_order AS sort_order, created_at AS created_at, updated_at AS updated_at
        FROM dynasties
        WHERE project_id = ?1
        "#,
    )?;
    let rows = statement.query_map(params![project_id], |row| {
        Ok(ExportDynastyRow {
            id: row.get("id")?,
            name: row.get("name")?,
            motto: row.get("motto")?,
            description: row.get("description")?,
            history: row.get("history")?,
            status: row.get("status")?,
            color: row.get("color")?,
            secondary_color: row.get("secondary_color")?,
            image_path: row.get("image_path")?,
            founded_date: row.get("founded_date")?,
            extinct_date: row.get("extinct_date")?,
            founder_id: row.get("founder_id")?,
            current_leader_id: row.get("current_leader_id")?,
            heir_id: row.get("heir_id")?,
            linked_faction_id: row.get("linked_faction_id")?,
            sort_order: row.get("sort_order")?,
            created_at: row.get("created_at")?,
            updated_at: row.get("updated_at")?,
        })
    })?;
    collect_rows(rows)
}

fn load_dynasty_members(
    connection: &Connection,
    project_id: i32,
) -> Result<Vec<ExportDynastyMemberRow>> {
    let mut statement = connection.prepare(
        r#"
        SELECT dm.id AS id, dm.dynasty_id AS dynasty_id, dm.character_id AS character_id,
               dm.generation AS generation, dm.role AS role, dm.birth_date AS birth_date,
               dm.death_date AS death_date, dm.is_main_line AS is_main_line, dm.notes AS notes
        FROM dynasty_members dm
        JOIN dynasties d ON dm.dynasty_id = d.id
        WHERE d.project_id = ?1
        "#,
    )?;
    let rows = statement.query_map(params![project_id], |row| {
        Ok(ExportDynastyMemberRow {
            id: row.get("id")?,
            dynasty_id: row.get("dynasty_id")?,
            character_id: row.get("character_id")?,
            generation: row.get("generation")?,
            role: row.get("role")?,
            birth_date: row.get("birth_date")?,
            death_date: row.get("death_date")?,
            is_main_line: row.get::<_, i32>("is_main_line")? != 0,
            notes: row.get("notes")?,
        })
    })?;
    collect_rows(rows)
}

fn load_dynasty_family_links(
    connection: &Connection,
    project_id: i32,
) -> Result<Vec<ExportDynastyFamilyLinkRow>> {
    let mut statement = connection.prepare(
        r#"
        SELECT dfl.id AS id, dfl.dynasty_id AS dynasty_id,
               dfl.source_character_id AS source_character_id,
               dfl.target_character_id AS target_character_id,
               dfl.relation_type AS relation_type, dfl.custom_label AS custom_label
        FROM dynasty_family_links dfl
        JOIN dynasties d ON dfl.dynasty_id = d.id
        WHERE d.project_id = ?1
        "#,
    )?;
    let rows = statement.query_map(params![project_id], |row| {
        Ok(ExportDynastyFamilyLinkRow {
            id: row.get("id")?,
            dynasty_id: row.get("dynasty_id")?,
            source_character_id: row.get("source_character_id")?,
            target_character_id: row.get("target_character_id")?,
            relation_type: row.get("relation_type")?,
            custom_label: row.get("custom_label")?,
        })
    })?;
    collect_rows(rows)
}

fn load_dynasty_events(
    connection: &Connection,
    project_id: i32,
) -> Result<Vec<ExportDynastyEventRow>> {
    let mut statement = connection.prepare(
        r#"
        SELECT de.id AS id, de.dynasty_id AS dynasty_id, de.title AS title,
               de.description AS description, de.event_date AS event_date,
               de.importance AS importance, de.sort_order AS sort_order,
               de.created_at AS created_at
        FROM dynasty_events de
        JOIN dynasties d ON de.dynasty_id = d.id
        WHERE d.project_id = ?1
        "#,
    )?;
    let rows = statement.query_map(params![project_id], |row| {
        Ok(ExportDynastyEventRow {
            id: row.get("id")?,
            dynasty_id: row.get("dynasty_id")?,
            title: row.get("title")?,
            description: row.get("description")?,
            event_date: row.get("event_date")?,
            importance: row.get("importance")?,
            sort_order: row.get("sort_order")?,
            created_at: row.get("created_at")?,
        })
    })?;
    collect_rows(rows)
}

fn load_scenario_branches(
    connection: &Connection,
    project_id: i32,
) -> Result<Vec<ExportScenarioBranchRow>> {
    let mut statement = connection.prepare(
        r#"
        SELECT
            id,
            project_id AS project_id,
            name,
            parent_branch_id AS parent_branch_id,
            base_revision AS base_revision,
            is_main AS is_main,
            created_at AS created_at,
            updated_at AS updated_at
        FROM scenario_branches
        WHERE project_id = ?1
        ORDER BY is_main DESC, id ASC
        "#,
    )?;
    let rows = statement.query_map(params![project_id], |row| {
        Ok(ExportScenarioBranchRow {
            id: row.get("id")?,
            project_id: row.get("project_id")?,
            name: row.get("name")?,
            parent_branch_id: row.get("parent_branch_id")?,
            base_revision: row.get("base_revision")?,
            is_main: row.get::<_, i32>("is_main")? != 0,
            created_at: row.get("created_at")?,
            updated_at: row.get("updated_at")?,
        })
    })?;
    collect_rows(rows)
}

fn load_graph_layouts(
    connection: &Connection,
    project_id: i32,
) -> Result<Vec<ExportGraphLayoutRow>> {
    let mut statement = connection.prepare(
        r#"
        SELECT branch_id AS branch_id, graph_type AS graph_type, layout_data AS layout_data
        FROM graph_layouts
        WHERE project_id = ?1
        "#,
    )?;
    let rows = statement.query_map(params![project_id], |row| {
        let raw: String = row.get("layout_data")?;
        Ok(ExportGraphLayoutRow {
            branch_id: row.get("branch_id")?,
            graph_type: row.get("graph_type")?,
            layout_data: parse_layout_data(&raw),
        })
    })?;
    collect_rows(rows)
}

// --- Import inserters ---

fn import_maps<R: Runtime>(
    app: Option<&AppHandle<R>>,
    connection: &Connection,
    project_id: i32,
    main_branch_id: i32,
    maps: &[ExportMapRow],
    map_id_map: &mut HashMap<i32, i32>,
) -> Result<()> {
    for map in maps {
        let new_parent_map_id = map
            .parent_map_id
            .and_then(|parent_id| map_id_map.get(&parent_id).copied());
        let imported_map_image_path = if let Some(ref image_base64) = map.image_base64 {
            save_optional_base64_data_url(app, UploadSubdir::Maps, image_base64)?
        } else {
            map.image_path.clone()
        };

        connection.execute(
            r#"
            INSERT INTO maps (project_id, parent_map_id, parent_marker_id, name, image_path, created_branch_id)
            VALUES (?1, ?2, NULL, ?3, ?4, ?5)
            "#,
            params![
                project_id,
                new_parent_map_id,
                map.name,
                imported_map_image_path,
                main_branch_id
            ],
        )?;
        map_id_map.insert(map.id, last_insert_id(connection)?);
    }
    Ok(())
}

fn import_tags(
    connection: &Connection,
    project_id: i32,
    tags: &[ExportTagRow],
    tag_id_map: &mut HashMap<i32, i32>,
) -> Result<()> {
    for tag in tags {
        connection.execute(
            "INSERT INTO tags (project_id, name, color) VALUES (?1, ?2, ?3)",
            params![project_id, tag.name, tag.color.as_str()],
        )?;
        tag_id_map.insert(tag.id, last_insert_id(connection)?);
    }
    Ok(())
}

fn import_characters<R: Runtime>(
    app: Option<&AppHandle<R>>,
    connection: &Connection,
    project_id: i32,
    main_branch_id: i32,
    characters: &[ExportCharacterRow],
    character_id_map: &mut HashMap<i32, i32>,
) -> Result<()> {
    for character in characters {
        let new_image_path = if let Some(ref image_base64) = character.image_base64 {
            save_optional_base64_data_url(app, UploadSubdir::Characters, image_base64)?
        } else {
            None
        };

        connection.execute(
            r#"
            INSERT INTO characters (
                project_id, name, title, race, character_class,
                level, status, bio, appearance, personality, backstory, notes, image_path, state_id, created_branch_id
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, NULL, ?14)
            "#,
            params![
                project_id,
                character.name,
                character.title,
                character.race,
                character.character_class,
                character.level,
                character.status,
                character.bio,
                character.appearance,
                character.personality,
                character.backstory,
                character.notes,
                new_image_path,
                main_branch_id,
            ],
        )?;
        character_id_map.insert(character.id, last_insert_id(connection)?);
    }
    Ok(())
}

fn import_notes(
    connection: &Connection,
    project_id: i32,
    main_branch_id: i32,
    notes: &[ExportNoteRow],
    note_id_map: &mut HashMap<i32, i32>,
) -> Result<()> {
    for note in notes {
        connection.execute(
            r#"
            INSERT INTO notes (project_id, folder_id, title, content, format, note_type, is_pinned, created_branch_id)
            VALUES (?1, NULL, ?2, ?3, ?4, ?5, ?6, ?7)
            "#,
            params![
                project_id,
                note.title,
                note.content,
                note.format,
                note.note_type,
                if note.is_pinned { 1 } else { 0 },
                main_branch_id,
            ],
        )?;
        note_id_map.insert(note.id, last_insert_id(connection)?);
    }
    Ok(())
}

fn import_relationships(
    connection: &Connection,
    project_id: i32,
    main_branch_id: i32,
    relationships: &[ExportRelationshipRow],
    character_id_map: &HashMap<i32, i32>,
) -> Result<()> {
    for rel in relationships {
        let Some(new_source) = character_id_map.get(&rel.source_character_id) else {
            continue;
        };
        let Some(new_target) = character_id_map.get(&rel.target_character_id) else {
            continue;
        };
        connection.execute(
            r#"
            INSERT INTO character_relationships (
                project_id, source_character_id, target_character_id,
                relationship_type, custom_label, description, is_bidirectional, created_branch_id
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
            "#,
            params![
                project_id,
                new_source,
                new_target,
                rel.relationship_type,
                rel.custom_label,
                rel.description,
                if rel.is_bidirectional { 1 } else { 0 },
                main_branch_id,
            ],
        )?;
    }
    Ok(())
}

fn import_markers_and_parent_links(
    connection: &Connection,
    main_branch_id: i32,
    markers: &[ExportMarkerRow],
    maps: &[ExportMapRow],
    map_id_map: &HashMap<i32, i32>,
    note_id_map: &HashMap<i32, i32>,
    marker_id_map: &mut HashMap<i32, i32>,
) -> Result<()> {
    for marker in markers {
        let new_linked_note_id = marker
            .linked_note_id
            .and_then(|note_id| note_id_map.get(&note_id).copied());
        let new_child_map_id = marker
            .child_map_id
            .and_then(|map_id| map_id_map.get(&map_id).copied());
        let Some(new_map_id) = map_id_map.get(&marker.map_id).copied() else {
            continue;
        };

        connection.execute(
            r#"
            INSERT INTO map_markers (
                map_id, title, description, position_x, position_y,
                color, icon, linked_note_id, child_map_id, created_branch_id
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
            "#,
            params![
                new_map_id,
                marker.title,
                marker.description,
                marker.position_x,
                marker.position_y,
                marker.color,
                marker.icon,
                new_linked_note_id,
                new_child_map_id,
                main_branch_id,
            ],
        )?;
        marker_id_map.insert(marker.id, last_insert_id(connection)?);
    }

    for map in maps {
        let Some(parent_marker_id) = map.parent_marker_id else {
            continue;
        };
        let Some(new_map_id) = map_id_map.get(&map.id).copied() else {
            continue;
        };
        let Some(new_parent_marker_id) = marker_id_map.get(&parent_marker_id).copied() else {
            continue;
        };
        connection.execute(
            "UPDATE maps SET parent_marker_id = ?1 WHERE id = ?2",
            params![new_parent_marker_id, new_map_id],
        )?;
    }

    Ok(())
}

fn import_timeline_events(
    connection: &Connection,
    project_id: i32,
    main_branch_id: i32,
    events: &[ExportTimelineEventRow],
    note_id_map: &HashMap<i32, i32>,
    timeline_event_id_map: &mut HashMap<i32, i32>,
) -> Result<()> {
    for event in events {
        let new_linked_note_id = event
            .linked_note_id
            .and_then(|note_id| note_id_map.get(&note_id).copied());
        connection.execute(
            r#"
            INSERT INTO timeline_events (
                project_id, title, description, event_date,
                sort_order, era, era_color, linked_note_id, created_branch_id
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
            "#,
            params![
                project_id,
                event.title,
                event.description,
                event.event_date,
                event.sort_order,
                event.era,
                event.era_color.as_deref().unwrap_or(""),
                new_linked_note_id,
                main_branch_id,
            ],
        )?;
        timeline_event_id_map.insert(event.id, last_insert_id(connection)?);
    }
    Ok(())
}

fn import_wiki_links(
    connection: &Connection,
    project_id: i32,
    main_branch_id: i32,
    wiki_links: &[ExportWikiLinkRow],
    note_id_map: &HashMap<i32, i32>,
) -> Result<()> {
    for link in wiki_links {
        let Some(new_source) = note_id_map.get(&link.source_note_id) else {
            continue;
        };
        let Some(new_target) = note_id_map.get(&link.target_note_id) else {
            continue;
        };
        connection.execute(
            r#"
            INSERT OR IGNORE INTO wiki_links (
                project_id, source_note_id, target_note_id, label, created_branch_id
            ) VALUES (?1, ?2, ?3, ?4, ?5)
            "#,
            params![
                project_id,
                new_source,
                new_target,
                link.label,
                main_branch_id
            ],
        )?;
    }
    Ok(())
}

fn import_dogmas(
    connection: &Connection,
    project_id: i32,
    main_branch_id: i32,
    dogmas: &[ExportDogmaRow],
    dogma_id_map: &mut HashMap<i32, i32>,
) -> Result<()> {
    for dogma in dogmas {
        connection.execute(
            r#"
            INSERT INTO dogmas (
                project_id, title, category, description, impact, exceptions,
                is_public, importance, status, sort_order, icon, color, created_branch_id
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
            "#,
            params![
                project_id,
                dogma.title,
                dogma.category,
                dogma.description,
                dogma.impact,
                dogma.exceptions,
                if dogma.is_public { 1 } else { 0 },
                dogma.importance,
                dogma.status,
                dogma.sort_order,
                dogma.icon,
                dogma.color,
                main_branch_id,
            ],
        )?;
        dogma_id_map.insert(dogma.id, last_insert_id(connection)?);
    }
    Ok(())
}

fn import_factions(
    connection: &Connection,
    project_id: i32,
    main_branch_id: i32,
    factions: &[ExportFactionRow],
    faction_id_map: &mut HashMap<i32, i32>,
    imported_faction_kind_map: &mut HashMap<i32, String>,
) -> Result<()> {
    for faction in factions {
        let legacy_kind = if faction.kind.is_empty() {
            faction
                .r#type
                .as_deref()
                .filter(|t| *t == "state")
                .map(|_| "state")
                .unwrap_or("faction")
        } else {
            faction.kind.as_str()
        };
        let normalized_kind = if legacy_kind == "state" {
            "state"
        } else {
            "faction"
        };
        let semantic_type = if faction.kind.is_empty() {
            None
        } else {
            faction.r#type.clone()
        };

        connection.execute(
            r#"
            INSERT INTO factions (
                project_id, name, kind, type, motto, description, history, goals, headquarters, territory, status,
                treasury, population, army_size, navy_size, territory_km2, annual_income, annual_expenses,
                members_count, influence, color, secondary_color, image_path, banner_path,
                founded_date, disbanded_date, parent_faction_id, sort_order, created_branch_id
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26, NULL, ?27, ?28)
            "#,
            params![
                project_id,
                faction.name,
                normalized_kind,
                semantic_type,
                faction.motto,
                faction.description,
                faction.history,
                faction.goals,
                faction.headquarters,
                faction.territory,
                faction.status,
                faction.treasury,
                faction.population,
                faction.army_size,
                faction.navy_size,
                faction.territory_km2,
                faction.annual_income,
                faction.annual_expenses,
                faction.members_count,
                faction.influence,
                faction.color,
                faction.secondary_color,
                faction.image_path,
                faction.banner_path,
                faction.founded_date,
                faction.disbanded_date,
                faction.sort_order,
                main_branch_id,
            ],
        )?;
        let new_faction_id = last_insert_id(connection)?;
        faction_id_map.insert(faction.id, new_faction_id);
        imported_faction_kind_map.insert(faction.id, normalized_kind.to_string());

        for metric in &faction.custom_metrics {
            connection.execute(
                r#"
                INSERT INTO faction_custom_metrics (faction_id, name, value, unit, sort_order, created_at, updated_at)
                VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'), datetime('now'))
                "#,
                params![
                    new_faction_id,
                    metric.name,
                    metric.value,
                    metric.unit,
                    metric.sort_order,
                ],
            )?;
        }
    }

    for faction in factions {
        let Some(parent_faction_id) = faction.parent_faction_id else {
            continue;
        };
        let Some(new_faction_id) = faction_id_map.get(&faction.id) else {
            continue;
        };
        let Some(new_parent_faction_id) = faction_id_map.get(&parent_faction_id) else {
            continue;
        };
        connection.execute(
            "UPDATE factions SET parent_faction_id = ?1 WHERE id = ?2",
            params![new_parent_faction_id, new_faction_id],
        )?;
    }

    Ok(())
}

fn import_legacy_faction_custom_metrics(
    connection: &Connection,
    metrics: &[ExportFactionCustomMetricRow],
    faction_id_map: &HashMap<i32, i32>,
) -> Result<()> {
    for metric in metrics {
        let Some(new_faction_id) = faction_id_map.get(&metric.faction_id) else {
            continue;
        };
        connection.execute(
            r#"
            INSERT OR IGNORE INTO faction_custom_metrics (faction_id, name, value, unit, sort_order, created_at, updated_at)
            VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'), datetime('now'))
            "#,
            params![
                new_faction_id,
                metric.name,
                metric.value,
                metric.unit,
                metric.sort_order
            ],
        )?;
    }
    Ok(())
}

fn import_character_state_and_factions(
    connection: &Connection,
    characters: &[ExportCharacterRow],
    character_id_map: &HashMap<i32, i32>,
    faction_id_map: &HashMap<i32, i32>,
    imported_faction_kind_map: &HashMap<i32, String>,
) -> Result<()> {
    for character in characters {
        let Some(new_character_id) = character_id_map.get(&character.id) else {
            continue;
        };

        if let Some(state_id) = character.state_id {
            let new_state_id = imported_faction_kind_map
                .get(&state_id)
                .filter(|kind| kind.as_str() == "state")
                .and_then(|_| faction_id_map.get(&state_id).copied());
            connection.execute(
                "UPDATE characters SET state_id = ?1 WHERE id = ?2",
                params![new_state_id, new_character_id],
            )?;
        }

        for source_faction_id in &character.faction_ids {
            if imported_faction_kind_map
                .get(source_faction_id)
                .map(String::as_str)
                != Some("faction")
            {
                continue;
            }
            let Some(new_faction_id) = faction_id_map.get(source_faction_id) else {
                continue;
            };
            connection.execute(
                "INSERT OR IGNORE INTO character_factions (character_id, faction_id) VALUES (?1, ?2)",
                params![new_character_id, new_faction_id],
            )?;
        }
    }
    Ok(())
}

fn import_faction_ranks(
    connection: &Connection,
    ranks: &[ExportFactionRankRow],
    faction_id_map: &HashMap<i32, i32>,
    faction_rank_id_map: &mut HashMap<i32, i32>,
) -> Result<()> {
    for rank in ranks {
        let Some(new_faction_id) = faction_id_map.get(&rank.faction_id) else {
            continue;
        };
        connection.execute(
            r#"
            INSERT INTO faction_ranks (
                faction_id, name, level, description, permissions, icon, color
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
            "#,
            params![
                new_faction_id,
                rank.name,
                rank.level,
                rank.description,
                rank.permissions,
                rank.icon,
                rank.color
            ],
        )?;
        faction_rank_id_map.insert(rank.id, last_insert_id(connection)?);
    }
    Ok(())
}

fn import_faction_members(
    connection: &Connection,
    members: &[ExportFactionMemberRow],
    faction_id_map: &HashMap<i32, i32>,
    character_id_map: &HashMap<i32, i32>,
    faction_rank_id_map: &HashMap<i32, i32>,
) -> Result<()> {
    for member in members {
        let Some(new_faction_id) = faction_id_map.get(&member.faction_id) else {
            continue;
        };
        let Some(new_character_id) = character_id_map.get(&member.character_id) else {
            continue;
        };
        let new_rank_id = member
            .rank_id
            .and_then(|rank_id| faction_rank_id_map.get(&rank_id).copied());
        connection.execute(
            r#"
            INSERT OR IGNORE INTO faction_members (
                faction_id, character_id, rank_id, role, joined_date, left_date, is_active, notes
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
            "#,
            params![
                new_faction_id,
                new_character_id,
                new_rank_id,
                member.role,
                member.joined_date,
                member.left_date,
                if member.is_active { 1 } else { 0 },
                member.notes,
            ],
        )?;
    }
    Ok(())
}

fn import_faction_relations(
    connection: &Connection,
    project_id: i32,
    relations: &[ExportFactionRelationRow],
    faction_id_map: &HashMap<i32, i32>,
) -> Result<()> {
    for relation in relations {
        let Some(new_source) = faction_id_map.get(&relation.source_faction_id) else {
            continue;
        };
        let Some(new_target) = faction_id_map.get(&relation.target_faction_id) else {
            continue;
        };
        connection.execute(
            r#"
            INSERT INTO faction_relations (
                project_id, source_faction_id, target_faction_id,
                relation_type, custom_label, description, started_date, is_bidirectional
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
            "#,
            params![
                project_id,
                new_source,
                new_target,
                relation.relation_type,
                relation.custom_label,
                relation.description,
                relation.started_date,
                if relation.is_bidirectional { 1 } else { 0 },
            ],
        )?;
    }
    Ok(())
}

fn import_territories(
    connection: &Connection,
    main_branch_id: i32,
    territories: &[ExportTerritoryRow],
    map_id_map: &HashMap<i32, i32>,
    faction_id_map: &HashMap<i32, i32>,
) -> Result<()> {
    for territory in territories {
        let Some(new_map_id) = map_id_map.get(&territory.map_id) else {
            continue;
        };
        let new_faction_id = territory
            .faction_id
            .and_then(|faction_id| faction_id_map.get(&faction_id).copied());
        connection.execute(
            r#"
            INSERT INTO map_territories (
                map_id, name, description, color, opacity, border_color, border_width,
                points, faction_id, smoothing, sort_order, created_branch_id
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
            "#,
            params![
                new_map_id,
                territory.name,
                territory.description,
                territory.color,
                territory.opacity,
                territory.border_color,
                territory.border_width,
                territory.points,
                new_faction_id,
                territory.smoothing,
                territory.sort_order,
                main_branch_id,
            ],
        )?;
    }
    Ok(())
}

fn import_dynasties(
    connection: &Connection,
    project_id: i32,
    main_branch_id: i32,
    dynasties: &[ExportDynastyRow],
    character_id_map: &HashMap<i32, i32>,
    faction_id_map: &HashMap<i32, i32>,
    dynasty_id_map: &mut HashMap<i32, i32>,
) -> Result<()> {
    for dynasty in dynasties {
        connection.execute(
            r#"
            INSERT INTO dynasties (
                project_id, name, motto, description, history, status, color, secondary_color,
                image_path, founded_date, extinct_date, founder_id, current_leader_id, heir_id,
                linked_faction_id, sort_order, created_branch_id
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)
            "#,
            params![
                project_id,
                dynasty.name,
                dynasty.motto,
                dynasty.description,
                dynasty.history,
                dynasty.status,
                dynasty.color,
                dynasty.secondary_color,
                dynasty.image_path,
                dynasty.founded_date,
                dynasty.extinct_date,
                dynasty
                    .founder_id
                    .and_then(|id| character_id_map.get(&id).copied()),
                dynasty
                    .current_leader_id
                    .and_then(|id| character_id_map.get(&id).copied()),
                dynasty
                    .heir_id
                    .and_then(|id| character_id_map.get(&id).copied()),
                dynasty
                    .linked_faction_id
                    .and_then(|id| faction_id_map.get(&id).copied()),
                dynasty.sort_order,
                main_branch_id,
            ],
        )?;
        dynasty_id_map.insert(dynasty.id, last_insert_id(connection)?);
    }
    Ok(())
}

fn import_dynasty_members(
    connection: &Connection,
    members: &[ExportDynastyMemberRow],
    dynasty_id_map: &HashMap<i32, i32>,
    character_id_map: &HashMap<i32, i32>,
) -> Result<()> {
    for member in members {
        let Some(new_dynasty_id) = dynasty_id_map.get(&member.dynasty_id) else {
            continue;
        };
        let Some(new_character_id) = character_id_map.get(&member.character_id) else {
            continue;
        };
        connection.execute(
            r#"
            INSERT OR IGNORE INTO dynasty_members (
                dynasty_id, character_id, generation, role, birth_date, death_date, is_main_line, notes
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
            "#,
            params![
                new_dynasty_id,
                new_character_id,
                member.generation,
                member.role,
                member.birth_date,
                member.death_date,
                if member.is_main_line { 1 } else { 0 },
                member.notes,
            ],
        )?;
    }
    Ok(())
}

fn import_dynasty_family_links(
    connection: &Connection,
    links: &[ExportDynastyFamilyLinkRow],
    dynasty_id_map: &HashMap<i32, i32>,
    character_id_map: &HashMap<i32, i32>,
) -> Result<()> {
    for link in links {
        let Some(new_dynasty_id) = dynasty_id_map.get(&link.dynasty_id) else {
            continue;
        };
        let Some(new_source) = character_id_map.get(&link.source_character_id) else {
            continue;
        };
        let Some(new_target) = character_id_map.get(&link.target_character_id) else {
            continue;
        };
        connection.execute(
            r#"
            INSERT INTO dynasty_family_links (
                dynasty_id, source_character_id, target_character_id, relation_type, custom_label
            ) VALUES (?1, ?2, ?3, ?4, ?5)
            "#,
            params![
                new_dynasty_id,
                new_source,
                new_target,
                link.relation_type,
                link.custom_label
            ],
        )?;
    }
    Ok(())
}

fn import_dynasty_events(
    connection: &Connection,
    events: &[ExportDynastyEventRow],
    dynasty_id_map: &HashMap<i32, i32>,
) -> Result<()> {
    for event in events {
        let Some(new_dynasty_id) = dynasty_id_map.get(&event.dynasty_id) else {
            continue;
        };
        connection.execute(
            r#"
            INSERT INTO dynasty_events (
                dynasty_id, title, description, event_date, importance, sort_order
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
            "#,
            params![
                new_dynasty_id,
                event.title,
                event.description,
                event.event_date,
                event.importance,
                event.sort_order
            ],
        )?;
    }
    Ok(())
}

#[allow(clippy::too_many_arguments)]
fn import_tag_associations(
    connection: &Connection,
    associations: &[ExportTagAssociationRow],
    tag_id_map: &HashMap<i32, i32>,
    character_id_map: &HashMap<i32, i32>,
    note_id_map: &HashMap<i32, i32>,
    timeline_event_id_map: &HashMap<i32, i32>,
    dogma_id_map: &HashMap<i32, i32>,
    faction_id_map: &HashMap<i32, i32>,
    dynasty_id_map: &HashMap<i32, i32>,
) -> Result<()> {
    for association in associations {
        let Some(new_tag_id) = tag_id_map.get(&association.tag_id) else {
            continue;
        };
        let new_entity_id = match association.entity_type.as_str() {
            "character" => character_id_map.get(&association.entity_id).copied(),
            "note" => note_id_map.get(&association.entity_id).copied(),
            "timeline_event" => timeline_event_id_map.get(&association.entity_id).copied(),
            "dogma" => dogma_id_map.get(&association.entity_id).copied(),
            "faction" => faction_id_map.get(&association.entity_id).copied(),
            "dynasty" => dynasty_id_map.get(&association.entity_id).copied(),
            _ => None,
        };
        let Some(new_entity_id) = new_entity_id else {
            continue;
        };
        connection.execute(
            "INSERT OR IGNORE INTO tag_associations (tag_id, entity_type, entity_id) VALUES (?1, ?2, ?3)",
            params![new_tag_id, association.entity_type, new_entity_id],
        )?;
    }
    Ok(())
}

fn import_graph_layouts(
    connection: &Connection,
    project_id: i32,
    layouts: &[ExportGraphLayoutRow],
    branch_id_map: &HashMap<i32, i32>,
    entity_maps: GraphLayoutEntityIdMaps<'_>,
) -> Result<()> {
    for layout in layouts {
        let Some(new_branch_id) = branch_id_map.get(&layout.branch_id) else {
            continue;
        };
        let graph_type = layout.graph_type.trim();
        if graph_type.is_empty() {
            continue;
        }
        let remapped = remap_graph_layout_data_for_import(&layout.layout_data, &entity_maps);
        crate::repositories::graph_layouts::upsert(
            connection,
            &UpsertGraphLayoutInput {
                project_id,
                graph_type: graph_type.to_string(),
                layout_data: remapped,
                branch_id: Some(*new_branch_id),
            },
        )?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::migrations::run_migrations;
    use crate::repositories::projects::create_demo_project;
    use rusqlite::Connection;
    use tauri::Wry;

    fn test_connection() -> Connection {
        let connection = Connection::open_in_memory().expect("in-memory db");
        run_migrations(&connection).expect("migrations");
        connection
    }

    fn project_count(connection: &Connection) -> i32 {
        connection
            .query_row("SELECT COUNT(*) FROM projects", [], |row| row.get(0))
            .expect("count")
    }

    fn export_for_test(connection: &Connection, project_id: i32) -> Result<ImportedProjectPayload> {
        export_project_inner::<Wry>(None, connection, project_id)
    }

    fn import_for_test(
        connection: &Connection,
        payload: &ImportedProjectPayload,
        locale: &str,
        append_import_name_suffix: bool,
    ) -> Result<Project> {
        import_project_inner::<Wry>(None, connection, payload, locale, append_import_name_suffix)
    }

    #[test]
    fn roundtrip_demo_project() {
        let connection = test_connection();
        let original = create_demo_project(&connection, "en").expect("demo project");
        let exported = export_for_test(&connection, original.id).expect("export");
        assert_eq!(exported.version, EXPORT_VERSION);
        let imported = import_for_test(&connection, &exported, "en", false).expect("import");
        assert_eq!(imported.name, original.name);
        assert_ne!(imported.id, original.id);
    }

    #[test]
    fn reject_wrong_version() {
        let connection = test_connection();
        let payload = ImportedProjectPayload {
            version: "1.0".to_string(),
            exported_at: None,
            project: ExportProjectMeta {
                name: "Test".to_string(),
                description: None,
                status: None,
                map_image_base64: None,
            },
            characters: Vec::new(),
            relationships: Vec::new(),
            notes: Vec::new(),
            folders: Vec::new(),
            maps: Vec::new(),
            markers: Vec::new(),
            territories: Vec::new(),
            timeline_events: Vec::new(),
            tags: Vec::new(),
            tag_associations: Vec::new(),
            wiki_links: Vec::new(),
            dogmas: Vec::new(),
            factions: Vec::new(),
            faction_custom_metrics: Vec::new(),
            faction_ranks: Vec::new(),
            faction_members: Vec::new(),
            faction_relations: Vec::new(),
            dynasties: Vec::new(),
            dynasty_members: Vec::new(),
            dynasty_family_links: Vec::new(),
            dynasty_events: Vec::new(),
            scenario_branches: Vec::new(),
            graph_layouts: Vec::new(),
        };
        let error = import_for_test(&connection, &payload, "en", true).unwrap_err();
        assert_eq!(error.to_payload().code, "VALIDATION_ERROR");
    }

    #[test]
    fn reject_missing_name() {
        let connection = test_connection();
        let payload = ImportedProjectPayload {
            version: EXPORT_VERSION.to_string(),
            exported_at: None,
            project: ExportProjectMeta {
                name: "   ".to_string(),
                description: None,
                status: None,
                map_image_base64: None,
            },
            characters: Vec::new(),
            relationships: Vec::new(),
            notes: Vec::new(),
            folders: Vec::new(),
            maps: Vec::new(),
            markers: Vec::new(),
            territories: Vec::new(),
            timeline_events: Vec::new(),
            tags: Vec::new(),
            tag_associations: Vec::new(),
            wiki_links: Vec::new(),
            dogmas: Vec::new(),
            factions: Vec::new(),
            faction_custom_metrics: Vec::new(),
            faction_ranks: Vec::new(),
            faction_members: Vec::new(),
            faction_relations: Vec::new(),
            dynasties: Vec::new(),
            dynasty_members: Vec::new(),
            dynasty_family_links: Vec::new(),
            dynasty_events: Vec::new(),
            scenario_branches: Vec::new(),
            graph_layouts: Vec::new(),
        };
        let error = import_for_test(&connection, &payload, "en", true).unwrap_err();
        assert_eq!(error.to_payload().code, "VALIDATION_ERROR");
    }

    #[test]
    fn rollback_on_error() {
        let connection = test_connection();
        let before = project_count(&connection);

        let payload = ImportedProjectPayload {
            version: EXPORT_VERSION.to_string(),
            exported_at: None,
            project: ExportProjectMeta {
                name: "Rollback test".to_string(),
                description: None,
                status: None,
                map_image_base64: None,
            },
            characters: Vec::new(),
            relationships: Vec::new(),
            notes: Vec::new(),
            folders: Vec::new(),
            maps: Vec::new(),
            markers: Vec::new(),
            territories: Vec::new(),
            timeline_events: Vec::new(),
            tags: vec![
                ExportTagRow {
                    id: 1,
                    name: "dup".to_string(),
                    color: "#111111".to_string(),
                },
                ExportTagRow {
                    id: 2,
                    name: "dup".to_string(),
                    color: "#222222".to_string(),
                },
            ],
            tag_associations: Vec::new(),
            wiki_links: Vec::new(),
            dogmas: Vec::new(),
            factions: Vec::new(),
            faction_custom_metrics: Vec::new(),
            faction_ranks: Vec::new(),
            faction_members: Vec::new(),
            faction_relations: Vec::new(),
            dynasties: Vec::new(),
            dynasty_members: Vec::new(),
            dynasty_family_links: Vec::new(),
            dynasty_events: Vec::new(),
            scenario_branches: Vec::new(),
            graph_layouts: Vec::new(),
        };

        assert!(import_for_test(&connection, &payload, "en", false).is_err());
        assert_eq!(project_count(&connection), before);
    }
}
