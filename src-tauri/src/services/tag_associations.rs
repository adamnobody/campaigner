use rusqlite::Connection;

use crate::error::{AppError, Result};
use crate::models::tag::Tag;
use crate::models::tag_association::{
    EntityTagsInput, SetEntityTagsInput, TagAssociationEntityType,
};
use crate::repositories::tag_associations;

pub fn get_tags_for_entity(connection: &Connection, input: &EntityTagsInput) -> Result<Vec<Tag>> {
    ensure_supported_entity_type(&input.entity_type)?;
    tag_associations::list_tags_for_entity(connection, input)
}

pub fn set_tags_for_entity(
    connection: &Connection,
    input: &SetEntityTagsInput,
) -> Result<Vec<Tag>> {
    ensure_supported_entity_type(&input.entity_type)?;

    let normalized_tag_ids = normalize_tag_ids(&input.tag_ids);

    tag_associations::replace_tags_for_entity(
        connection,
        &SetEntityTagsInput {
            project_id: input.project_id,
            entity_type: input.entity_type.clone(),
            entity_id: input.entity_id,
            tag_ids: normalized_tag_ids,
        },
    )?;

    tag_associations::list_tags_for_entity(
        connection,
        &EntityTagsInput {
            project_id: input.project_id,
            entity_type: input.entity_type.clone(),
            entity_id: input.entity_id,
        },
    )
}

pub fn clear_tags_for_entity(connection: &Connection, input: &EntityTagsInput) -> Result<()> {
    ensure_supported_entity_type(&input.entity_type)?;
    tag_associations::clear_tags_for_entity(connection, input)
}

pub fn ensure_supported_entity_type(entity_type: &str) -> Result<()> {
    if TagAssociationEntityType::parse(entity_type).is_some() {
        return Ok(());
    }

    Err(AppError::internal(
        "INVALID_TAG_ENTITY_TYPE",
        format!("Unsupported tag association entity type: {entity_type}"),
    ))
}

fn normalize_tag_ids(tag_ids: &[i32]) -> Vec<i32> {
    let mut deduped = Vec::new();
    for tag_id in tag_ids {
        if !deduped.contains(tag_id) {
            deduped.push(*tag_id);
        }
    }
    deduped
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
                CREATE TABLE tags (
                  id INTEGER PRIMARY KEY,
                  project_id INTEGER NOT NULL,
                  name TEXT NOT NULL,
                  color TEXT NOT NULL
                );
                CREATE TABLE tag_associations (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  tag_id INTEGER NOT NULL,
                  entity_type TEXT NOT NULL,
                  entity_id INTEGER NOT NULL,
                  UNIQUE(tag_id, entity_type, entity_id)
                );
                "#,
            )
            .expect("schema created");

        connection
            .execute(
                "INSERT INTO tags (id, project_id, name, color) VALUES (?1, ?2, ?3, ?4)",
                params![1, 1, "alpha", "#111111"],
            )
            .expect("tag 1");
        connection
            .execute(
                "INSERT INTO tags (id, project_id, name, color) VALUES (?1, ?2, ?3, ?4)",
                params![2, 1, "beta", "#222222"],
            )
            .expect("tag 2");

        connection
    }

    #[test]
    fn rejects_unknown_entity_type() {
        let connection = setup_connection();
        let result = get_tags_for_entity(
            &connection,
            &EntityTagsInput {
                project_id: 1,
                entity_type: "unknown".to_string(),
                entity_id: 9,
            },
        );

        assert!(result.is_err());
    }

    #[test]
    fn set_tags_and_get_tags_follow_legacy_replacement_semantics() {
        let connection = setup_connection();
        let first = set_tags_for_entity(
            &connection,
            &SetEntityTagsInput {
                project_id: 1,
                entity_type: "note".to_string(),
                entity_id: 5,
                tag_ids: vec![2, 1, 1],
            },
        )
        .unwrap();
        assert_eq!(first.len(), 2);
        assert_eq!(first[0].name, "alpha");

        let second = set_tags_for_entity(
            &connection,
            &SetEntityTagsInput {
                project_id: 1,
                entity_type: "note".to_string(),
                entity_id: 5,
                tag_ids: vec![2],
            },
        )
        .unwrap();

        assert_eq!(second.len(), 1);
        assert_eq!(second[0].id, 2);
    }
}
