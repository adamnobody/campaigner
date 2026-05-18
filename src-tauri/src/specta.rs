use std::path::Path;

use specta_typescript::Typescript;
use tauri_specta::{collect_commands, Builder};

use crate::models::app::AppHealthResponse;
use crate::models::note::{
    CreateNoteInput, DeleteNoteInput, GetNoteInput, Note, NotesListInput, NotesListResult,
    SetNoteTagsInput, UpdateNoteInput,
};
use crate::models::project::{
    CreateProjectInput, DeleteProjectInput, GetProjectInput, Project, UpdateProjectInput,
};
use crate::models::tag::{CreateTagInput, DeleteTagInput, Tag, TagsListInput};

mod codegen_commands {
    use super::{
        AppHealthResponse, CreateNoteInput, CreateProjectInput, CreateTagInput, DeleteNoteInput,
        DeleteProjectInput, DeleteTagInput, GetNoteInput, GetProjectInput, Note, NotesListInput,
        NotesListResult, Project, SetNoteTagsInput, Tag, TagsListInput, UpdateNoteInput,
        UpdateProjectInput,
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
            codegen_commands::notes_list,
            codegen_commands::notes_get,
            codegen_commands::notes_create,
            codegen_commands::notes_update,
            codegen_commands::notes_delete,
            codegen_commands::notes_set_tags,
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
        .typ::<Note>()
        .typ::<NotesListInput>()
        .typ::<NotesListResult>()
        .typ::<GetNoteInput>()
        .typ::<CreateNoteInput>()
        .typ::<UpdateNoteInput>()
        .typ::<DeleteNoteInput>()
        .typ::<SetNoteTagsInput>()
        .typ::<Tag>()
        .typ::<TagsListInput>()
        .typ::<CreateTagInput>()
        .typ::<DeleteTagInput>()
        .export(Typescript::default(), path)
}
