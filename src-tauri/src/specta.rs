use std::path::Path;

use specta_typescript::Typescript;
use tauri_specta::{collect_commands, Builder};

use crate::models::app::AppHealthResponse;
use crate::models::character::{
    Character, CharacterGraph, CharacterRelationship, CharactersListInput, CharactersListResult,
    CreateCharacterInput, CreateRelationshipInput, DeleteCharacterInput, DeleteRelationshipInput,
    GetCharacterInput, RelationshipsListInput, SetCharacterTagsInput, UpdateCharacterInput,
    UpdateRelationshipInput,
};
use crate::models::note::{
    CreateNoteInput, DeleteNoteInput, GetNoteInput, Note, NotesListInput, NotesListResult,
    SetNoteTagsInput, UpdateNoteInput,
};
use crate::models::project::{
    CreateProjectInput, DeleteProjectInput, GetProjectInput, Project, UpdateProjectInput,
};
use crate::models::tag::{CreateTagInput, DeleteTagInput, Tag, TagsListInput};
use crate::models::timeline::{
    CreateTimelineEventInput, DeleteTimelineEventInput, GetTimelineEventInput,
    ReorderTimelineInput, SetTimelineTagsInput, TimelineEvent, TimelineListInput,
    UpdateTimelineEventInput,
};

mod codegen_commands {
    use super::{
        AppHealthResponse, Character, CharacterGraph, CharacterRelationship, CharactersListInput,
        CharactersListResult, CreateCharacterInput, CreateNoteInput, CreateProjectInput,
        CreateRelationshipInput, CreateTagInput, CreateTimelineEventInput, DeleteCharacterInput,
        DeleteNoteInput, DeleteProjectInput, DeleteRelationshipInput, DeleteTagInput,
        DeleteTimelineEventInput, GetCharacterInput, GetNoteInput, GetProjectInput,
        GetTimelineEventInput, Note, NotesListInput, NotesListResult, Project,
        RelationshipsListInput, ReorderTimelineInput, SetCharacterTagsInput, SetNoteTagsInput,
        SetTimelineTagsInput, Tag, TagsListInput, TimelineEvent, TimelineListInput,
        UpdateCharacterInput, UpdateNoteInput, UpdateProjectInput, UpdateRelationshipInput,
        UpdateTimelineEventInput,
    };

    #[tauri::command]
    #[specta::specta]
    pub fn app_health() -> AppHealthResponse {
        AppHealthResponse {
            status: String::new(),
            database: String::new(),
            app_version: String::new(),
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn tags_list(_input: TagsListInput) -> Vec<Tag> {
        Vec::new()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn tags_create(input: CreateTagInput) -> Tag {
        Tag {
            id: 0,
            name: input.name,
            color: input.color.unwrap_or_else(|| "#808080".to_string()),
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn tags_delete(_input: DeleteTagInput) {}

    #[tauri::command]
    #[specta::specta]
    pub fn projects_list() -> Vec<Project> {
        Vec::new()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn projects_get(_input: GetProjectInput) -> Project {
        Project {
            id: 0,
            name: String::new(),
            description: String::new(),
            status: "active".to_string(),
            map_image_path: None,
            created_at: String::new(),
            updated_at: String::new(),
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn projects_create(input: CreateProjectInput) -> Project {
        Project {
            id: 0,
            name: input.name,
            description: input.description.unwrap_or_default(),
            status: input.status.unwrap_or_else(|| "active".to_string()),
            map_image_path: None,
            created_at: String::new(),
            updated_at: String::new(),
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn projects_update(input: UpdateProjectInput) -> Project {
        Project {
            id: input.id,
            name: input.name.unwrap_or_default(),
            description: input.description.unwrap_or_default(),
            status: input.status.unwrap_or_else(|| "active".to_string()),
            map_image_path: input.map_image_path,
            created_at: String::new(),
            updated_at: String::new(),
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn projects_delete(_input: DeleteProjectInput) {}

    #[tauri::command]
    #[specta::specta]
    pub fn characters_list(_input: CharactersListInput) -> CharactersListResult {
        CharactersListResult {
            items: Vec::new(),
            total: 0,
            page: 1,
            limit: 20,
            total_pages: 0,
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn characters_get(_input: GetCharacterInput) -> Character {
        Character {
            id: 0,
            project_id: 0,
            state_id: None,
            name: String::new(),
            title: String::new(),
            race: String::new(),
            character_class: String::new(),
            level: None,
            status: "alive".to_string(),
            bio: String::new(),
            appearance: String::new(),
            personality: String::new(),
            backstory: String::new(),
            notes: String::new(),
            image_path: None,
            created_at: String::new(),
            updated_at: String::new(),
            tags: Vec::new(),
            faction_ids: Vec::new(),
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn characters_create(input: CreateCharacterInput) -> Character {
        Character {
            id: 0,
            project_id: input.project_id,
            state_id: input.state_id,
            name: input.name,
            title: input.title.unwrap_or_default(),
            race: input.race.unwrap_or_default(),
            character_class: input.character_class.unwrap_or_default(),
            level: input.level,
            status: input.status.unwrap_or_else(|| "alive".to_string()),
            bio: input.bio.unwrap_or_default(),
            appearance: input.appearance.unwrap_or_default(),
            personality: input.personality.unwrap_or_default(),
            backstory: input.backstory.unwrap_or_default(),
            notes: input.notes.unwrap_or_default(),
            image_path: None,
            created_at: String::new(),
            updated_at: String::new(),
            tags: Vec::new(),
            faction_ids: input.faction_ids.unwrap_or_default(),
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn characters_update(input: UpdateCharacterInput) -> Character {
        Character {
            id: input.id,
            project_id: 0,
            state_id: input.state_id.unwrap_or(None),
            name: input.name.unwrap_or_default(),
            title: input.title.unwrap_or_default(),
            race: input.race.unwrap_or_default(),
            character_class: input.character_class.unwrap_or_default(),
            level: input.level.unwrap_or(None),
            status: input.status.unwrap_or_else(|| "alive".to_string()),
            bio: input.bio.unwrap_or_default(),
            appearance: input.appearance.unwrap_or_default(),
            personality: input.personality.unwrap_or_default(),
            backstory: input.backstory.unwrap_or_default(),
            notes: input.notes.unwrap_or_default(),
            image_path: None,
            created_at: String::new(),
            updated_at: String::new(),
            tags: Vec::new(),
            faction_ids: input.faction_ids.unwrap_or_default(),
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn characters_delete(_input: DeleteCharacterInput) {}

    #[tauri::command]
    #[specta::specta]
    pub fn characters_set_tags(_input: SetCharacterTagsInput) -> Vec<Tag> {
        Vec::new()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn characters_relationships_list(
        _input: RelationshipsListInput,
    ) -> Vec<CharacterRelationship> {
        Vec::new()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn characters_relationships_create(
        input: CreateRelationshipInput,
    ) -> CharacterRelationship {
        CharacterRelationship {
            id: 0,
            project_id: input.project_id,
            source_character_id: input.source_character_id,
            target_character_id: input.target_character_id,
            relationship_type: input.relationship_type,
            custom_label: input.custom_label.unwrap_or_default(),
            description: input.description.unwrap_or_default(),
            is_bidirectional: input.is_bidirectional.unwrap_or(true),
            created_at: String::new(),
            source_character_name: None,
            target_character_name: None,
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn characters_relationships_update(
        input: UpdateRelationshipInput,
    ) -> CharacterRelationship {
        CharacterRelationship {
            id: input.id,
            project_id: 0,
            source_character_id: 0,
            target_character_id: 0,
            relationship_type: input
                .relationship_type
                .unwrap_or_else(|| "custom".to_string()),
            custom_label: input.custom_label.unwrap_or_default(),
            description: input.description.unwrap_or_default(),
            is_bidirectional: input.is_bidirectional.unwrap_or(true),
            created_at: String::new(),
            source_character_name: None,
            target_character_name: None,
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn characters_relationships_delete(_input: DeleteRelationshipInput) {}

    #[tauri::command]
    #[specta::specta]
    pub fn characters_graph(_input: RelationshipsListInput) -> CharacterGraph {
        CharacterGraph {
            nodes: Vec::new(),
            edges: Vec::new(),
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn notes_list(_input: NotesListInput) -> NotesListResult {
        NotesListResult {
            items: Vec::new(),
            total: 0,
            page: 1,
            limit: 50,
            total_pages: 0,
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn notes_get(_input: GetNoteInput) -> Note {
        Note {
            id: 0,
            project_id: 0,
            folder_id: None,
            title: String::new(),
            content: String::new(),
            format: "md".to_string(),
            note_type: "note".to_string(),
            is_pinned: false,
            created_at: String::new(),
            updated_at: String::new(),
            tags: Vec::new(),
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn notes_create(input: CreateNoteInput) -> Note {
        Note {
            id: 0,
            project_id: input.project_id,
            folder_id: input.folder_id,
            title: input.title,
            content: input.content.unwrap_or_default(),
            format: input.format.unwrap_or_else(|| "md".to_string()),
            note_type: input.note_type.unwrap_or_else(|| "note".to_string()),
            is_pinned: input.is_pinned.unwrap_or(false),
            created_at: String::new(),
            updated_at: String::new(),
            tags: Vec::new(),
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn notes_update(input: UpdateNoteInput) -> Note {
        Note {
            id: input.id,
            project_id: 0,
            folder_id: input.folder_id.unwrap_or(None),
            title: input.title.unwrap_or_default(),
            content: input.content.unwrap_or_default(),
            format: input.format.unwrap_or_else(|| "md".to_string()),
            note_type: input.note_type.unwrap_or_else(|| "note".to_string()),
            is_pinned: input.is_pinned.unwrap_or(false),
            created_at: String::new(),
            updated_at: String::new(),
            tags: Vec::new(),
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn notes_delete(_input: DeleteNoteInput) {}

    #[tauri::command]
    #[specta::specta]
    pub fn notes_set_tags(_input: SetNoteTagsInput) -> Vec<Tag> {
        Vec::new()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn timeline_list(_input: TimelineListInput) -> Vec<TimelineEvent> {
        Vec::new()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn timeline_get(_input: GetTimelineEventInput) -> TimelineEvent {
        TimelineEvent {
            id: 0,
            project_id: 0,
            title: String::new(),
            description: String::new(),
            event_date: String::new(),
            sort_order: 0,
            era: String::new(),
            era_color: String::new(),
            linked_note_id: None,
            created_at: String::new(),
            updated_at: String::new(),
            tags: Vec::new(),
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn timeline_create(input: CreateTimelineEventInput) -> TimelineEvent {
        TimelineEvent {
            id: 0,
            project_id: input.project_id,
            title: input.title,
            description: input.description.unwrap_or_default(),
            event_date: input.event_date,
            sort_order: input.sort_order.unwrap_or(0),
            era: input.era.unwrap_or_default(),
            era_color: input.era_color.unwrap_or_default(),
            linked_note_id: input.linked_note_id,
            created_at: String::new(),
            updated_at: String::new(),
            tags: Vec::new(),
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn timeline_update(input: UpdateTimelineEventInput) -> TimelineEvent {
        TimelineEvent {
            id: input.id,
            project_id: 0,
            title: input.title.unwrap_or_default(),
            description: input.description.unwrap_or_default(),
            event_date: input.event_date.unwrap_or_default(),
            sort_order: input.sort_order.unwrap_or(0),
            era: input.era.unwrap_or_default(),
            era_color: input.era_color.unwrap_or_default(),
            linked_note_id: input.linked_note_id.unwrap_or(None),
            created_at: String::new(),
            updated_at: String::new(),
            tags: Vec::new(),
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn timeline_delete(_input: DeleteTimelineEventInput) {}

    #[tauri::command]
    #[specta::specta]
    pub fn timeline_reorder(_input: ReorderTimelineInput) -> Vec<TimelineEvent> {
        Vec::new()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn timeline_set_tags(_input: SetTimelineTagsInput) -> Vec<Tag> {
        Vec::new()
    }
}

pub fn export_bindings(path: &Path) -> Result<(), specta_typescript::Error> {
    Builder::<tauri::Wry>::new()
        .commands(collect_commands![
            codegen_commands::app_health,
            codegen_commands::projects_list,
            codegen_commands::projects_get,
            codegen_commands::projects_create,
            codegen_commands::projects_update,
            codegen_commands::projects_delete,
            codegen_commands::characters_list,
            codegen_commands::characters_get,
            codegen_commands::characters_create,
            codegen_commands::characters_update,
            codegen_commands::characters_delete,
            codegen_commands::characters_set_tags,
            codegen_commands::characters_relationships_list,
            codegen_commands::characters_relationships_create,
            codegen_commands::characters_relationships_update,
            codegen_commands::characters_relationships_delete,
            codegen_commands::characters_graph,
            codegen_commands::notes_list,
            codegen_commands::notes_get,
            codegen_commands::notes_create,
            codegen_commands::notes_update,
            codegen_commands::notes_delete,
            codegen_commands::notes_set_tags,
            codegen_commands::timeline_list,
            codegen_commands::timeline_get,
            codegen_commands::timeline_create,
            codegen_commands::timeline_update,
            codegen_commands::timeline_delete,
            codegen_commands::timeline_reorder,
            codegen_commands::timeline_set_tags,
            codegen_commands::tags_list,
            codegen_commands::tags_create,
            codegen_commands::tags_delete
        ])
        .typ::<AppHealthResponse>()
        .typ::<Project>()
        .typ::<GetProjectInput>()
        .typ::<CreateProjectInput>()
        .typ::<UpdateProjectInput>()
        .typ::<DeleteProjectInput>()
        .typ::<Character>()
        .typ::<CharactersListInput>()
        .typ::<CharactersListResult>()
        .typ::<GetCharacterInput>()
        .typ::<CreateCharacterInput>()
        .typ::<UpdateCharacterInput>()
        .typ::<DeleteCharacterInput>()
        .typ::<SetCharacterTagsInput>()
        .typ::<CharacterRelationship>()
        .typ::<RelationshipsListInput>()
        .typ::<CreateRelationshipInput>()
        .typ::<UpdateRelationshipInput>()
        .typ::<DeleteRelationshipInput>()
        .typ::<CharacterGraph>()
        .typ::<Note>()
        .typ::<NotesListInput>()
        .typ::<NotesListResult>()
        .typ::<GetNoteInput>()
        .typ::<CreateNoteInput>()
        .typ::<UpdateNoteInput>()
        .typ::<DeleteNoteInput>()
        .typ::<SetNoteTagsInput>()
        .typ::<TimelineEvent>()
        .typ::<TimelineListInput>()
        .typ::<GetTimelineEventInput>()
        .typ::<CreateTimelineEventInput>()
        .typ::<UpdateTimelineEventInput>()
        .typ::<DeleteTimelineEventInput>()
        .typ::<ReorderTimelineInput>()
        .typ::<SetTimelineTagsInput>()
        .typ::<Tag>()
        .typ::<TagsListInput>()
        .typ::<CreateTagInput>()
        .typ::<DeleteTagInput>()
        .export(Typescript::default(), path)
}
