use serde::{de::DeserializeOwned, Serialize};
use serde_json::Value;

use crate::error::{AppError, Result};
use crate::models::branch::{BranchOverride, OverlayOperation};

pub fn is_entity_hidden_by_override(override_row: Option<&BranchOverride>) -> bool {
    matches!(
        override_row.map(|row| row.op),
        Some(OverlayOperation::Delete)
    )
}

pub fn apply_item_overlay<T>(
    item: Option<T>,
    override_row: Option<&BranchOverride>,
) -> Result<Option<T>>
where
    T: Serialize + DeserializeOwned + Clone,
{
    let Some(item) = item else {
        return Ok(None);
    };

    let Some(override_row) = override_row else {
        return Ok(Some(item));
    };

    if matches!(override_row.op, OverlayOperation::Delete) {
        return Ok(None);
    }

    let mut base_value = serde_json::to_value(item.clone())
        .map_err(|err| AppError::internal("OVERLAY_SERIALIZE_ERROR", err.to_string()))?;
    let patch_value: Value = serde_json::from_str(&override_row.patch_json)
        .map_err(|err| AppError::internal("OVERLAY_PATCH_PARSE_ERROR", err.to_string()))?;

    if let (Value::Object(base), Value::Object(patch)) = (&mut base_value, patch_value) {
        for (key, value) in patch {
            base.insert(key, value);
        }
    }

    serde_json::from_value(base_value)
        .map(Some)
        .map_err(|err| AppError::internal("OVERLAY_DESERIALIZE_ERROR", err.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::branch::BranchOverride;
    use crate::models::branch::OverlayOperation;

    #[derive(Debug, Clone, serde::Serialize, serde::Deserialize, PartialEq, Eq)]
    struct DemoEntity {
        id: i32,
        title: String,
        content: String,
    }

    fn make_override(op: OverlayOperation, patch_json: &str) -> BranchOverride {
        BranchOverride {
            id: 1,
            branch_id: 2,
            entity_type: "note".to_string(),
            entity_id: 99,
            op,
            patch_json: patch_json.to_string(),
            created_at: "2025-01-01 00:00:00".to_string(),
            updated_at: "2025-01-01 00:00:00".to_string(),
        }
    }

    #[test]
    fn delete_override_hides_entity() {
        let entity = DemoEntity {
            id: 99,
            title: "A".to_string(),
            content: "B".to_string(),
        };
        let override_row = make_override(OverlayOperation::Delete, "{}");

        let result = apply_item_overlay(Some(entity), Some(&override_row)).unwrap();

        assert!(result.is_none());
        assert!(is_entity_hidden_by_override(Some(&override_row)));
    }

    #[test]
    fn upsert_override_merges_patch_fields() {
        let entity = DemoEntity {
            id: 99,
            title: "Old".to_string(),
            content: "Old content".to_string(),
        };
        let override_row = make_override(
            OverlayOperation::Upsert,
            r#"{"title":"New title","content":"Updated"}"#,
        );

        let result = apply_item_overlay(Some(entity), Some(&override_row))
            .unwrap()
            .expect("entity should stay visible");

        assert_eq!(result.title, "New title");
        assert_eq!(result.content, "Updated");
    }
}
