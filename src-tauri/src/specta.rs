use std::path::Path;

use specta_typescript::Typescript;
use tauri_specta::{collect_commands, Builder};

use crate::models::app::AppHealthResponse;
use crate::models::project::{
    CreateProjectInput, DeleteProjectInput, GetProjectInput, Project, UpdateProjectInput,
};
use crate::models::tag::{CreateTagInput, DeleteTagInput, Tag, TagsListInput};

mod codegen_commands {
    use super::{
        AppHealthResponse, CreateProjectInput, CreateTagInput, DeleteProjectInput, DeleteTagInput,
        GetProjectInput, Project, Tag, TagsListInput, UpdateProjectInput,
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
        .typ::<Tag>()
        .typ::<TagsListInput>()
        .typ::<CreateTagInput>()
        .typ::<DeleteTagInput>()
        .export(Typescript::default(), path)
}
