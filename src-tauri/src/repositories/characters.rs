use std::collections::{HashMap, HashSet};

use rusqlite::{params, params_from_iter, types::Value as SqlValue, Connection, OptionalExtension};

use crate::error::{AppError, Result};
use crate::models::character::{
    Character, CharacterGraph, CharacterGraphEdge, CharacterGraphNode, CharacterRelationship,
    CharactersListInput, CharactersListResult, CreateCharacterInput, CreateRelationshipInput,
    DeleteCharacterInput, DeleteRelationshipInput, GetCharacterInput, RelationshipsListInput,
    SetCharacterTagsInput, UpdateCharacterInput, UpdateRelationshipInput,
};
use crate::models::tag::Tag;
use crate::models::tag_association::{EntityTagsInput, SetEntityTagsInput};
use crate::services::branch_scope;
use crate::services::tag_associations;

const DEFAULT_PAGE: i32 = 1;
const DEFAULT_LIMIT: i32 = 20;
const MAX_LIMIT: i32 = 200;

#[derive(Debug, Clone)]
struct CharacterRow {
    id: i32,
    project_id: i32,
    state_id: Option<i32>,
    name: String,
    title: String,
    race: String,
    character_class: String,
    level: Option<i32>,
    status: String,
    bio: String,
    appearance: String,
    personality: String,
    backstory: String,
    notes: String,
    image_path: Option<String>,
    created_at: String,
    updated_at: String,
    created_branch_id: Option<i32>,
}

#[derive(Debug, Clone)]
struct RelationshipRow {
    id: i32,
    project_id: i32,
    source_character_id: i32,
    target_character_id: i32,
    relationship_type: String,
    custom_label: String,
    description: String,
    is_bidirectional: i32,
    created_at: String,
    created_branch_id: Option<i32>,
    source_character_name: Option<String>,
    target_character_name: Option<String>,
}

pub fn list_characters(
    connection: &Connection,
    input: &CharactersListInput,
) -> Result<CharactersListResult> {
    let page = input.page.unwrap_or(DEFAULT_PAGE).max(1);
    let limit = input.limit.unwrap_or(DEFAULT_LIMIT).clamp(1, MAX_LIMIT);
    let offset = (page - 1) * limit;

    let mut where_clause = String::from("WHERE project_id = ?");
    let mut where_params = vec![SqlValue::Integer(i64::from(input.project_id))];

    if let Some(search) = input.search.as_deref().filter(|value| !value.is_empty()) {
        let like = format!("%{search}%");
        where_clause.push_str(
            " AND (name LIKE ? OR title LIKE ? OR race LIKE ? OR character_class LIKE ?)",
        );
        where_params.push(SqlValue::Text(like.clone()));
        where_params.push(SqlValue::Text(like.clone()));
        where_params.push(SqlValue::Text(like.clone()));
        where_params.push(SqlValue::Text(like));
    }

    let sort_column = match input.sort_by.as_deref() {
        Some("createdAt") => "created_at",
        Some("updatedAt") => "updated_at",
        Some("status") => "status",
        Some("race") => "race",
        Some("level") => "level",
        _ => "name",
    };
    let sort_order = if input.sort_order.as_deref() == Some("desc") {
        "DESC"
    } else {
        "ASC"
    };

    let query = format!(
        r#"
        SELECT
            id,
            project_id,
            state_id,
            name,
            title,
            race,
            character_class,
            level,
            status,
            bio,
            appearance,
            personality,
            backstory,
            notes,
            image_path,
            created_at,
            updated_at,
            created_branch_id
        FROM characters
        {where_clause}
        ORDER BY {sort_column} {sort_order}
        "#
    );

    let mut statement = connection.prepare(&query)?;
    let rows = statement.query_map(params_from_iter(where_params.iter()), map_character_row)?;
    let all_rows = rows.collect::<std::result::Result<Vec<_>, _>>()?;

    let mut visible_rows = Vec::new();
    let view_branch_id =
        branch_scope::effective_branch_id_for_read(connection, input.project_id, input.branch_id)?;
    for row in all_rows {
        if branch_scope::is_entity_visible_in_branch(
            connection,
            row.project_id,
            view_branch_id,
            row.created_branch_id,
            Some(row.created_at.as_str()),
        )? {
            visible_rows.push(row);
        }
    }

    let total = i32::try_from(visible_rows.len()).map_err(|_| {
        AppError::internal(
            "CHARACTERS_TOTAL_RANGE_ERROR",
            "Characters total is out of range",
        )
    })?;
    let start = usize::try_from(offset).unwrap_or(0);
    let end = usize::try_from(offset + limit).unwrap_or(start);
    let page_rows = visible_rows
        .into_iter()
        .skip(start)
        .take(end.saturating_sub(start))
        .collect::<Vec<_>>();

    let mut items = page_rows.into_iter().map(map_character).collect::<Vec<_>>();
    attach_tags_and_factions(connection, &mut items)?;

    let total_pages = if total == 0 {
        0
    } else {
        ((total as f64) / (limit as f64)).ceil() as i32
    };

    Ok(CharactersListResult {
        items,
        total,
        page,
        limit,
        total_pages,
    })
}

pub fn get_character_by_id(
    connection: &Connection,
    input: &GetCharacterInput,
) -> Result<Character> {
    let row = connection
        .query_row(
            r#"
            SELECT
                id,
                project_id,
                state_id,
                name,
                title,
                race,
                character_class,
                level,
                status,
                bio,
                appearance,
                personality,
                backstory,
                notes,
                image_path,
                created_at,
                updated_at,
                created_branch_id
            FROM characters
            WHERE id = ?1
            "#,
            params![input.id],
            map_character_row,
        )
        .optional()?
        .ok_or_else(|| AppError::internal("CHARACTER_NOT_FOUND", "Character not found"))?;

    let view_branch_id =
        branch_scope::effective_branch_id_for_read(connection, row.project_id, input.branch_id)?;
    if !branch_scope::is_entity_visible_in_branch(
        connection,
        row.project_id,
        view_branch_id,
        row.created_branch_id,
        Some(row.created_at.as_str()),
    )? {
        return Err(AppError::internal(
            "CHARACTER_NOT_FOUND",
            "Character not found",
        ));
    }

    let mut character = map_character(row);
    attach_tags_and_factions(connection, std::slice::from_mut(&mut character))?;
    Ok(character)
}

pub fn create_character(
    connection: &Connection,
    input: &CreateCharacterInput,
) -> Result<Character> {
    if let Some(branch_id) = input.branch_id {
        branch_scope::assert_branch_belongs_to_project(connection, branch_id, input.project_id)?;
    }
    let created_branch_id =
        branch_scope::resolve_created_branch_id(connection, input.project_id, input.branch_id)?;

    connection.execute(
        r#"
        INSERT INTO characters (
            project_id,
            state_id,
            name,
            title,
            race,
            character_class,
            level,
            status,
            bio,
            appearance,
            personality,
            backstory,
            notes,
            created_branch_id
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)
        "#,
        params![
            input.project_id,
            input.state_id,
            input.name,
            input.title.clone().unwrap_or_default(),
            input.race.clone().unwrap_or_default(),
            input.character_class.clone().unwrap_or_default(),
            input.level,
            input.status.clone().unwrap_or_else(|| "alive".to_string()),
            input.bio.clone().unwrap_or_default(),
            input.appearance.clone().unwrap_or_default(),
            input.personality.clone().unwrap_or_default(),
            input.backstory.clone().unwrap_or_default(),
            input.notes.clone().unwrap_or_default(),
            created_branch_id
        ],
    )?;

    let id = i32::try_from(connection.last_insert_rowid()).map_err(|_| {
        AppError::internal(
            "CHARACTER_ID_RANGE_ERROR",
            "Created character id is out of range",
        )
    })?;
    if let Some(faction_ids) = input.faction_ids.as_ref() {
        replace_character_factions(connection, id, faction_ids)?;
    }

    get_character_by_id(
        connection,
        &GetCharacterInput {
            id,
            branch_id: input.branch_id,
        },
    )
}

pub fn update_character(
    connection: &Connection,
    input: &UpdateCharacterInput,
) -> Result<Character> {
    let _ = get_character_by_id(
        connection,
        &GetCharacterInput {
            id: input.id,
            branch_id: input.branch_id,
        },
    )?;

    if let Some(name) = input.name.as_ref() {
        connection.execute(
            "UPDATE characters SET name = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![name, input.id],
        )?;
    }
    if let Some(title) = input.title.as_ref() {
        connection.execute(
            "UPDATE characters SET title = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![title, input.id],
        )?;
    }
    if let Some(race) = input.race.as_ref() {
        connection.execute(
            "UPDATE characters SET race = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![race, input.id],
        )?;
    }
    if let Some(character_class) = input.character_class.as_ref() {
        connection.execute(
            "UPDATE characters SET character_class = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![character_class, input.id],
        )?;
    }
    if let Some(level) = input.level {
        connection.execute(
            "UPDATE characters SET level = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![level, input.id],
        )?;
    }
    if let Some(status) = input.status.as_ref() {
        connection.execute(
            "UPDATE characters SET status = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![status, input.id],
        )?;
    }
    if let Some(bio) = input.bio.as_ref() {
        connection.execute(
            "UPDATE characters SET bio = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![bio, input.id],
        )?;
    }
    if let Some(appearance) = input.appearance.as_ref() {
        connection.execute(
            "UPDATE characters SET appearance = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![appearance, input.id],
        )?;
    }
    if let Some(personality) = input.personality.as_ref() {
        connection.execute(
            "UPDATE characters SET personality = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![personality, input.id],
        )?;
    }
    if let Some(backstory) = input.backstory.as_ref() {
        connection.execute(
            "UPDATE characters SET backstory = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![backstory, input.id],
        )?;
    }
    if let Some(notes) = input.notes.as_ref() {
        connection.execute(
            "UPDATE characters SET notes = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![notes, input.id],
        )?;
    }
    if let Some(state_id) = input.state_id {
        connection.execute(
            "UPDATE characters SET state_id = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![state_id, input.id],
        )?;
    }
    if let Some(faction_ids) = input.faction_ids.as_ref() {
        replace_character_factions(connection, input.id, faction_ids)?;
    }

    get_character_by_id(
        connection,
        &GetCharacterInput {
            id: input.id,
            branch_id: input.branch_id,
        },
    )
}

pub fn delete_character(connection: &Connection, input: &DeleteCharacterInput) -> Result<()> {
    let _ = get_character_by_id(
        connection,
        &GetCharacterInput {
            id: input.id,
            branch_id: input.branch_id,
        },
    )?;
    connection.execute("DELETE FROM characters WHERE id = ?1", params![input.id])?;
    Ok(())
}

pub fn set_character_tags(
    connection: &Connection,
    input: &SetCharacterTagsInput,
) -> Result<Vec<Tag>> {
    let character = get_character_by_id(
        connection,
        &GetCharacterInput {
            id: input.id,
            branch_id: input.branch_id,
        },
    )?;

    tag_associations::set_tags_for_entity(
        connection,
        &SetEntityTagsInput {
            project_id: character.project_id,
            entity_type: "character".to_string(),
            entity_id: input.id,
            tag_ids: input.tag_ids.clone(),
        },
    )
}

pub fn list_relationships(
    connection: &Connection,
    input: &RelationshipsListInput,
) -> Result<Vec<CharacterRelationship>> {
    let view_branch_id =
        branch_scope::effective_branch_id_for_read(connection, input.project_id, input.branch_id)?;

    let mut statement = connection.prepare(
        r#"
        SELECT
            cr.id,
            cr.project_id,
            cr.source_character_id,
            cr.target_character_id,
            cr.relationship_type,
            cr.custom_label,
            cr.description,
            cr.is_bidirectional,
            cr.created_at,
            cr.created_branch_id,
            sc.name AS source_character_name,
            tc.name AS target_character_name
        FROM character_relationships cr
        LEFT JOIN characters sc ON sc.id = cr.source_character_id
        LEFT JOIN characters tc ON tc.id = cr.target_character_id
        WHERE cr.project_id = ?1
        "#,
    )?;

    let rows = statement.query_map(params![input.project_id], map_relationship_row)?;
    let raw = rows.collect::<std::result::Result<Vec<_>, _>>()?;

    let mut result = Vec::new();
    for row in raw {
        if !branch_scope::is_entity_visible_in_branch(
            connection,
            row.project_id,
            view_branch_id,
            row.created_branch_id,
            Some(row.created_at.as_str()),
        )? {
            continue;
        }
        if !is_character_visible(connection, row.source_character_id, view_branch_id)?
            || !is_character_visible(connection, row.target_character_id, view_branch_id)?
        {
            continue;
        }
        result.push(map_relationship(row));
    }
    Ok(result)
}

pub fn create_relationship(
    connection: &Connection,
    input: &CreateRelationshipInput,
) -> Result<CharacterRelationship> {
    let _ = get_character_by_id(
        connection,
        &GetCharacterInput {
            id: input.source_character_id,
            branch_id: input.branch_id,
        },
    )?;
    let _ = get_character_by_id(
        connection,
        &GetCharacterInput {
            id: input.target_character_id,
            branch_id: input.branch_id,
        },
    )?;

    let created_branch_id =
        branch_scope::resolve_created_branch_id(connection, input.project_id, input.branch_id)?;

    connection.execute(
        r#"
        INSERT INTO character_relationships (
            project_id,
            source_character_id,
            target_character_id,
            relationship_type,
            custom_label,
            description,
            is_bidirectional,
            created_branch_id
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
        "#,
        params![
            input.project_id,
            input.source_character_id,
            input.target_character_id,
            input.relationship_type,
            input.custom_label.clone().unwrap_or_default(),
            input.description.clone().unwrap_or_default(),
            if input.is_bidirectional.unwrap_or(true) {
                1
            } else {
                0
            },
            created_branch_id
        ],
    )?;

    let id = i32::try_from(connection.last_insert_rowid()).map_err(|_| {
        AppError::internal(
            "RELATIONSHIP_ID_RANGE_ERROR",
            "Created relationship id is out of range",
        )
    })?;
    get_relationship_by_id(connection, id, input.branch_id)
}

pub fn update_relationship(
    connection: &Connection,
    input: &UpdateRelationshipInput,
) -> Result<CharacterRelationship> {
    let _ = get_relationship_by_id(connection, input.id, input.branch_id)?;

    if let Some(relationship_type) = input.relationship_type.as_ref() {
        connection.execute(
            "UPDATE character_relationships SET relationship_type = ?1 WHERE id = ?2",
            params![relationship_type, input.id],
        )?;
    }
    if let Some(custom_label) = input.custom_label.as_ref() {
        connection.execute(
            "UPDATE character_relationships SET custom_label = ?1 WHERE id = ?2",
            params![custom_label, input.id],
        )?;
    }
    if let Some(description) = input.description.as_ref() {
        connection.execute(
            "UPDATE character_relationships SET description = ?1 WHERE id = ?2",
            params![description, input.id],
        )?;
    }
    if let Some(is_bidirectional) = input.is_bidirectional {
        connection.execute(
            "UPDATE character_relationships SET is_bidirectional = ?1 WHERE id = ?2",
            params![if is_bidirectional { 1 } else { 0 }, input.id],
        )?;
    }

    get_relationship_by_id(connection, input.id, input.branch_id)
}

pub fn delete_relationship(connection: &Connection, input: &DeleteRelationshipInput) -> Result<()> {
    let _ = get_relationship_by_id(connection, input.id, input.branch_id)?;
    connection.execute(
        "DELETE FROM character_relationships WHERE id = ?1",
        params![input.id],
    )?;
    Ok(())
}

pub fn get_graph(
    connection: &Connection,
    input: &RelationshipsListInput,
) -> Result<CharacterGraph> {
    let view_branch_id =
        branch_scope::effective_branch_id_for_read(connection, input.project_id, input.branch_id)?;

    let mut character_statement = connection.prepare(
        r#"
        SELECT
            id,
            project_id,
            state_id,
            name,
            title,
            race,
            character_class,
            level,
            status,
            bio,
            appearance,
            personality,
            backstory,
            notes,
            image_path,
            created_at,
            updated_at,
            created_branch_id
        FROM characters
        WHERE project_id = ?1
        "#,
    )?;
    let characters = character_statement
        .query_map(params![input.project_id], map_character_row)?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    let mut nodes = Vec::new();
    for row in characters {
        if !branch_scope::is_entity_visible_in_branch(
            connection,
            row.project_id,
            view_branch_id,
            row.created_branch_id,
            Some(row.created_at.as_str()),
        )? {
            continue;
        }
        nodes.push(CharacterGraphNode {
            id: row.id,
            name: row.name,
            title: row.title,
            status: row.status,
            image_path: row.image_path,
        });
    }
    let node_ids = nodes.iter().map(|node| node.id).collect::<HashSet<_>>();

    let relationships = list_relationships(connection, input)?;
    let edges = relationships
        .into_iter()
        .filter(|relationship| {
            node_ids.contains(&relationship.source_character_id)
                && node_ids.contains(&relationship.target_character_id)
        })
        .map(|relationship| CharacterGraphEdge {
            id: relationship.id,
            source: relationship.source_character_id,
            target: relationship.target_character_id,
            relationship_type: relationship.relationship_type,
            custom_label: relationship.custom_label,
            is_bidirectional: relationship.is_bidirectional,
        })
        .collect::<Vec<_>>();

    Ok(CharacterGraph { nodes, edges })
}

fn get_relationship_by_id(
    connection: &Connection,
    id: i32,
    branch_id: Option<i32>,
) -> Result<CharacterRelationship> {
    let row = connection
        .query_row(
            r#"
            SELECT
                cr.id,
                cr.project_id,
                cr.source_character_id,
                cr.target_character_id,
                cr.relationship_type,
                cr.custom_label,
                cr.description,
                cr.is_bidirectional,
                cr.created_at,
                cr.created_branch_id,
                sc.name AS source_character_name,
                tc.name AS target_character_name
            FROM character_relationships cr
            LEFT JOIN characters sc ON sc.id = cr.source_character_id
            LEFT JOIN characters tc ON tc.id = cr.target_character_id
            WHERE cr.id = ?1
            "#,
            params![id],
            map_relationship_row,
        )
        .optional()?
        .ok_or_else(|| AppError::internal("RELATIONSHIP_NOT_FOUND", "Relationship not found"))?;

    let view_branch_id =
        branch_scope::effective_branch_id_for_read(connection, row.project_id, branch_id)?;
    if !branch_scope::is_entity_visible_in_branch(
        connection,
        row.project_id,
        view_branch_id,
        row.created_branch_id,
        Some(row.created_at.as_str()),
    )? {
        return Err(AppError::internal(
            "RELATIONSHIP_NOT_FOUND",
            "Relationship not found",
        ));
    }
    if !is_character_visible(connection, row.source_character_id, view_branch_id)?
        || !is_character_visible(connection, row.target_character_id, view_branch_id)?
    {
        return Err(AppError::internal(
            "RELATIONSHIP_NOT_FOUND",
            "Relationship not found",
        ));
    }

    Ok(map_relationship(row))
}

fn attach_tags_and_factions(connection: &Connection, characters: &mut [Character]) -> Result<()> {
    if characters.is_empty() {
        return Ok(());
    }

    let mut tags_map: HashMap<i32, Vec<Tag>> = HashMap::new();
    for character in characters.iter() {
        let tags = tag_associations::get_tags_for_entity(
            connection,
            &EntityTagsInput {
                project_id: character.project_id,
                entity_type: "character".to_string(),
                entity_id: character.id,
            },
        )?;
        tags_map.insert(character.id, tags);
    }

    let mut faction_map: HashMap<i32, Vec<i32>> = HashMap::new();
    let mut statement = connection.prepare(
        r#"
        SELECT character_id, faction_id
        FROM character_factions
        WHERE character_id = ?1
        ORDER BY faction_id ASC
        "#,
    )?;
    for character in characters.iter() {
        let ids = statement
            .query_map(params![character.id], |row| row.get::<_, i32>(1))?
            .collect::<std::result::Result<Vec<_>, _>>()?;
        faction_map.insert(character.id, ids);
    }

    for character in characters.iter_mut() {
        character.tags = tags_map.remove(&character.id).unwrap_or_default();
        character.faction_ids = faction_map.remove(&character.id).unwrap_or_default();
    }

    Ok(())
}

fn replace_character_factions(
    connection: &Connection,
    character_id: i32,
    faction_ids: &[i32],
) -> Result<()> {
    let mut deduped = Vec::new();
    for faction_id in faction_ids {
        if *faction_id > 0 && !deduped.contains(faction_id) {
            deduped.push(*faction_id);
        }
    }

    connection.execute(
        "DELETE FROM character_factions WHERE character_id = ?1",
        params![character_id],
    )?;

    for faction_id in deduped {
        connection.execute(
            "INSERT INTO character_factions (character_id, faction_id) VALUES (?1, ?2)",
            params![character_id, faction_id],
        )?;
    }

    Ok(())
}

fn is_character_visible(connection: &Connection, id: i32, branch_id: Option<i32>) -> Result<bool> {
    let row = connection
        .query_row(
            "SELECT project_id, created_branch_id, created_at FROM characters WHERE id = ?1",
            params![id],
            |row| {
                Ok((
                    row.get::<_, i32>(0)?,
                    row.get::<_, Option<i32>>(1)?,
                    row.get::<_, String>(2)?,
                ))
            },
        )
        .optional()?;

    let Some((project_id, created_branch_id, created_at)) = row else {
        return Ok(false);
    };
    branch_scope::is_entity_visible_in_branch(
        connection,
        project_id,
        branch_id,
        created_branch_id,
        Some(created_at.as_str()),
    )
}

fn map_character_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<CharacterRow> {
    Ok(CharacterRow {
        id: row.get("id")?,
        project_id: row.get("project_id")?,
        state_id: row.get("state_id")?,
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
        image_path: row.get("image_path")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        created_branch_id: row.get("created_branch_id")?,
    })
}

fn map_character(row: CharacterRow) -> Character {
    Character {
        id: row.id,
        project_id: row.project_id,
        state_id: row.state_id,
        name: row.name,
        title: row.title,
        race: row.race,
        character_class: row.character_class,
        level: row.level,
        status: row.status,
        bio: row.bio,
        appearance: row.appearance,
        personality: row.personality,
        backstory: row.backstory,
        notes: row.notes,
        image_path: row.image_path,
        created_at: row.created_at,
        updated_at: row.updated_at,
        tags: Vec::new(),
        faction_ids: Vec::new(),
    }
}

fn map_relationship_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<RelationshipRow> {
    Ok(RelationshipRow {
        id: row.get("id")?,
        project_id: row.get("project_id")?,
        source_character_id: row.get("source_character_id")?,
        target_character_id: row.get("target_character_id")?,
        relationship_type: row.get("relationship_type")?,
        custom_label: row.get("custom_label")?,
        description: row.get("description")?,
        is_bidirectional: row.get("is_bidirectional")?,
        created_at: row.get("created_at")?,
        created_branch_id: row.get("created_branch_id")?,
        source_character_name: row.get("source_character_name")?,
        target_character_name: row.get("target_character_name")?,
    })
}

fn map_relationship(row: RelationshipRow) -> CharacterRelationship {
    CharacterRelationship {
        id: row.id,
        project_id: row.project_id,
        source_character_id: row.source_character_id,
        target_character_id: row.target_character_id,
        relationship_type: row.relationship_type,
        custom_label: row.custom_label,
        description: row.description,
        is_bidirectional: row.is_bidirectional != 0,
        created_at: row.created_at,
        source_character_name: row.source_character_name,
        target_character_name: row.target_character_name,
    }
}

pub fn update_character_image_path(
    connection: &Connection,
    id: i32,
    image_path: &str,
) -> Result<()> {
    let updated = connection.execute(
        "UPDATE characters SET image_path = ?1, updated_at = datetime('now') WHERE id = ?2",
        params![image_path, id],
    )?;

    if updated == 0 {
        return Err(AppError::internal(
            "CHARACTER_NOT_FOUND",
            "Character not found",
        ));
    }

    Ok(())
}
