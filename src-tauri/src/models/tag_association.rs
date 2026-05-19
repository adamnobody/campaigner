use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TagAssociationEntityType {
    Character,
    Note,
    TimelineEvent,
    Dogma,
    Faction,
    Dynasty,
}

impl TagAssociationEntityType {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Character => "character",
            Self::Note => "note",
            Self::TimelineEvent => "timeline_event",
            Self::Dogma => "dogma",
            Self::Faction => "faction",
            Self::Dynasty => "dynasty",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "character" => Some(Self::Character),
            "note" => Some(Self::Note),
            "timeline_event" => Some(Self::TimelineEvent),
            "dogma" => Some(Self::Dogma),
            "faction" => Some(Self::Faction),
            "dynasty" => Some(Self::Dynasty),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct TagAssociation {
    pub id: i32,
    pub tag_id: i32,
    pub entity_type: String,
    pub entity_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct EntityTagsInput {
    pub project_id: i32,
    pub entity_type: String,
    pub entity_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SetEntityTagsInput {
    pub project_id: i32,
    pub entity_type: String,
    pub entity_id: i32,
    pub tag_ids: Vec<i32>,
}
