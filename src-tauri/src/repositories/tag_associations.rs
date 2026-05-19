use rusqlite::{params, Connection};

use crate::error::Result;
use crate::models::tag::Tag;
use crate::models::tag_association::{EntityTagsInput, SetEntityTagsInput, TagAssociation};

pub fn list_tags_for_entity(connection: &Connection, input: &EntityTagsInput) -> Result<Vec<Tag>> {
    let mut statement = connection.prepare(
        r#"
        SELECT t.id, t.name, t.color
        FROM tags t
        JOIN tag_associations ta ON t.id = ta.tag_id
        WHERE ta.entity_type = ?1 AND ta.entity_id = ?2 AND t.project_id = ?3
        ORDER BY t.name ASC
        "#,
    )?;

    let rows = statement.query_map(
        params![input.entity_type, input.entity_id, input.project_id],
        |row| {
            Ok(Tag {
                id: row.get("id")?,
                name: row.get("name")?,
                color: row.get("color")?,
            })
        },
    )?;

    rows.collect::<std::result::Result<Vec<_>, _>>()
        .map_err(Into::into)
}

pub fn list_associations_for_entity(
    connection: &Connection,
    input: &EntityTagsInput,
) -> Result<Vec<TagAssociation>> {
    let mut statement = connection.prepare(
        r#"
        SELECT id, tag_id, entity_type, entity_id
        FROM tag_associations
        WHERE entity_type = ?1 AND entity_id = ?2
        ORDER BY id ASC
        "#,
    )?;

    let rows = statement.query_map(params![input.entity_type, input.entity_id], |row| {
        Ok(TagAssociation {
            id: row.get("id")?,
            tag_id: row.get("tag_id")?,
            entity_type: row.get("entity_type")?,
            entity_id: row.get("entity_id")?,
        })
    })?;

    rows.collect::<std::result::Result<Vec<_>, _>>()
        .map_err(Into::into)
}

pub fn clear_tags_for_entity(connection: &Connection, input: &EntityTagsInput) -> Result<()> {
    connection.execute(
        "DELETE FROM tag_associations WHERE entity_type = ?1 AND entity_id = ?2",
        params![input.entity_type, input.entity_id],
    )?;
    Ok(())
}

pub fn replace_tags_for_entity(connection: &Connection, input: &SetEntityTagsInput) -> Result<()> {
    let transaction = connection.unchecked_transaction()?;

    transaction.execute(
        "DELETE FROM tag_associations WHERE entity_type = ?1 AND entity_id = ?2",
        params![input.entity_type, input.entity_id],
    )?;

    let mut insert_statement = transaction.prepare(
        r#"
        INSERT OR IGNORE INTO tag_associations (tag_id, entity_type, entity_id)
        VALUES (?1, ?2, ?3)
        "#,
    )?;

    for tag_id in &input.tag_ids {
        insert_statement.execute(params![tag_id, input.entity_type, input.entity_id])?;
    }

    drop(insert_statement);
    transaction.commit()?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::tag_association::{EntityTagsInput, SetEntityTagsInput};
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
            .execute(
                "INSERT INTO tags (id, project_id, name, color) VALUES (?1, ?2, ?3, ?4)",
                params![3, 2, "other-project", "#333333"],
            )
            .expect("tag 3");

        connection
    }

    #[test]
    fn replace_tags_replaces_old_associations() {
        let connection = setup_connection();
        let input = SetEntityTagsInput {
            project_id: 1,
            entity_type: "note".to_string(),
            entity_id: 77,
            tag_ids: vec![1, 2],
        };
        replace_tags_for_entity(&connection, &input).unwrap();

        let replace_with_single = SetEntityTagsInput {
            project_id: 1,
            entity_type: "note".to_string(),
            entity_id: 77,
            tag_ids: vec![2],
        };
        replace_tags_for_entity(&connection, &replace_with_single).unwrap();

        let associations = list_associations_for_entity(
            &connection,
            &EntityTagsInput {
                project_id: 1,
                entity_type: "note".to_string(),
                entity_id: 77,
            },
        )
        .unwrap();

        assert_eq!(associations.len(), 1);
        assert_eq!(associations[0].tag_id, 2);
    }

    #[test]
    fn replace_tags_deduplicates_same_tag_id_like_legacy() {
        let connection = setup_connection();
        let input = SetEntityTagsInput {
            project_id: 1,
            entity_type: "note".to_string(),
            entity_id: 55,
            tag_ids: vec![1, 1, 2, 2],
        };

        replace_tags_for_entity(&connection, &input).unwrap();

        let associations = list_associations_for_entity(
            &connection,
            &EntityTagsInput {
                project_id: 1,
                entity_type: "note".to_string(),
                entity_id: 55,
            },
        )
        .unwrap();

        assert_eq!(associations.len(), 2);
    }

    #[test]
    fn list_tags_for_entity_returns_name_order_and_project_scoped_rows() {
        let connection = setup_connection();
        let input = SetEntityTagsInput {
            project_id: 1,
            entity_type: "character".to_string(),
            entity_id: 9,
            tag_ids: vec![2, 1, 3],
        };
        replace_tags_for_entity(&connection, &input).unwrap();

        let tags = list_tags_for_entity(
            &connection,
            &EntityTagsInput {
                project_id: 1,
                entity_type: "character".to_string(),
                entity_id: 9,
            },
        )
        .unwrap();

        assert_eq!(tags.len(), 2);
        assert_eq!(tags[0].name, "alpha");
        assert_eq!(tags[1].name, "beta");
    }

    #[test]
    fn clear_tags_removes_all_associations_for_entity_only() {
        let connection = setup_connection();

        replace_tags_for_entity(
            &connection,
            &SetEntityTagsInput {
                project_id: 1,
                entity_type: "note".to_string(),
                entity_id: 7,
                tag_ids: vec![1, 2],
            },
        )
        .unwrap();
        replace_tags_for_entity(
            &connection,
            &SetEntityTagsInput {
                project_id: 1,
                entity_type: "note".to_string(),
                entity_id: 8,
                tag_ids: vec![1],
            },
        )
        .unwrap();

        clear_tags_for_entity(
            &connection,
            &EntityTagsInput {
                project_id: 1,
                entity_type: "note".to_string(),
                entity_id: 7,
            },
        )
        .unwrap();

        let cleared = list_associations_for_entity(
            &connection,
            &EntityTagsInput {
                project_id: 1,
                entity_type: "note".to_string(),
                entity_id: 7,
            },
        )
        .unwrap();
        let untouched = list_associations_for_entity(
            &connection,
            &EntityTagsInput {
                project_id: 1,
                entity_type: "note".to_string(),
                entity_id: 8,
            },
        )
        .unwrap();

        assert!(cleared.is_empty());
        assert_eq!(untouched.len(), 1);
    }
}
