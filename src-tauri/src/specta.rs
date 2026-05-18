use std::path::Path;

use specta_typescript::Typescript;
use tauri_specta::{collect_commands, Builder};

use crate::models::app::AppHealthResponse;
use crate::models::branch::{
    CreateBranchInput, DeleteBranchInput, ListBranchesInput, ScenarioBranch, UpdateBranchInput,
};
use crate::models::character::{
    Character, CharacterGraph, CharacterRelationship, CharactersListInput, CharactersListResult,
    CreateCharacterInput, CreateRelationshipInput, DeleteCharacterInput, DeleteRelationshipInput,
    GetCharacterInput, RelationshipsListInput, SetCharacterTagsInput, UpdateCharacterInput,
    UpdateRelationshipInput,
};
use crate::models::faction::{
    CompareFactionsInput, CreateFactionInput, CreateFactionMemberInput, CreateFactionPolicyInput,
    CreateFactionRankInput, CreateFactionRelationInput, DeleteFactionInput,
    DeleteFactionMemberInput, DeleteFactionPolicyInput, DeleteFactionRankInput,
    DeleteFactionRelationInput, Faction, FactionCompareResult, FactionCustomMetric, FactionGraph,
    FactionMember, FactionPolicy, FactionRank, FactionRelation, FactionsListInput,
    FactionsListResult, FactionsRelationsListInput, GetFactionInput, ListFactionMembersInput,
    ListFactionPoliciesInput, ListFactionRanksInput, ReplaceFactionCustomMetricsInput,
    SetFactionTagsInput, UpdateFactionInput, UpdateFactionMemberInput, UpdateFactionPolicyInput,
    UpdateFactionRankInput, UpdateFactionRelationInput,
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
        CharactersListResult, CompareFactionsInput, CreateBranchInput, CreateCharacterInput,
        CreateFactionInput, CreateFactionMemberInput, CreateFactionPolicyInput,
        CreateFactionRankInput, CreateFactionRelationInput, CreateNoteInput, CreateProjectInput,
        CreateRelationshipInput, CreateTagInput, CreateTimelineEventInput, DeleteBranchInput,
        DeleteCharacterInput, DeleteFactionInput, DeleteFactionMemberInput,
        DeleteFactionPolicyInput, DeleteFactionRankInput, DeleteFactionRelationInput,
        DeleteNoteInput, DeleteProjectInput, DeleteRelationshipInput, DeleteTagInput,
        DeleteTimelineEventInput, Faction, FactionCompareResult, FactionCustomMetric, FactionGraph,
        FactionMember, FactionPolicy, FactionRank, FactionRelation, FactionsListInput,
        FactionsListResult, FactionsRelationsListInput, GetCharacterInput, GetFactionInput,
        GetNoteInput, GetProjectInput, GetTimelineEventInput, ListBranchesInput,
        ListFactionMembersInput, ListFactionPoliciesInput, ListFactionRanksInput, Note,
        NotesListInput, NotesListResult, Project, RelationshipsListInput, ReorderTimelineInput,
        ReplaceFactionCustomMetricsInput, ScenarioBranch, SetCharacterTagsInput,
        SetFactionTagsInput, SetNoteTagsInput, SetTimelineTagsInput, Tag, TagsListInput,
        TimelineEvent, TimelineListInput, UpdateBranchInput, UpdateCharacterInput,
        UpdateFactionInput, UpdateFactionMemberInput, UpdateFactionPolicyInput,
        UpdateFactionRankInput, UpdateFactionRelationInput, UpdateNoteInput, UpdateProjectInput,
        UpdateRelationshipInput, UpdateTimelineEventInput,
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
    pub fn branches_list(_input: ListBranchesInput) -> Vec<ScenarioBranch> {
        Vec::new()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn branches_create(input: CreateBranchInput) -> ScenarioBranch {
        ScenarioBranch {
            id: 0,
            project_id: input.project_id,
            name: input.name,
            parent_branch_id: input.parent_branch_id,
            base_revision: input.base_revision.unwrap_or(0),
            is_main: false,
            created_at: String::new(),
            updated_at: String::new(),
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn branches_update(input: UpdateBranchInput) -> ScenarioBranch {
        ScenarioBranch {
            id: input.id,
            project_id: 0,
            name: input.name.unwrap_or_default(),
            parent_branch_id: None,
            base_revision: 0,
            is_main: false,
            created_at: String::new(),
            updated_at: String::new(),
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn branches_delete(_input: DeleteBranchInput) {}

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
    pub fn factions_list(_input: FactionsListInput) -> FactionsListResult {
        FactionsListResult {
            items: Vec::new(),
            total: 0,
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn factions_get(_input: GetFactionInput) -> Faction {
        Faction {
            id: 0,
            project_id: 0,
            name: String::new(),
            kind: "faction".to_string(),
            r#type: None,
            motto: String::new(),
            description: String::new(),
            history: String::new(),
            goals: String::new(),
            headquarters: String::new(),
            territory: String::new(),
            ruling_dynasty_id: None,
            ruler_character_id: None,
            treasury: None,
            population: None,
            army_size: None,
            navy_size: None,
            territory_km2: None,
            annual_income: None,
            annual_expenses: None,
            members_count: None,
            influence: None,
            status: "active".to_string(),
            color: String::new(),
            secondary_color: String::new(),
            image_path: String::new(),
            banner_path: String::new(),
            founded_date: String::new(),
            disbanded_date: String::new(),
            parent_faction_id: None,
            sort_order: 0,
            created_at: String::new(),
            updated_at: String::new(),
            tags: Vec::new(),
            custom_metrics: Vec::new(),
            ranks: Vec::new(),
            members: Vec::new(),
            member_count: 0,
            parent_faction: None,
            child_factions: Vec::new(),
            ruling_dynasty: None,
            ruler: None,
            territories: Vec::new(),
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn factions_create(_input: CreateFactionInput) -> Faction {
        factions_get(GetFactionInput {
            id: 0,
            branch_id: None,
        })
    }

    #[tauri::command]
    #[specta::specta]
    pub fn factions_update(_input: UpdateFactionInput) -> Faction {
        factions_get(GetFactionInput {
            id: 0,
            branch_id: None,
        })
    }

    #[tauri::command]
    #[specta::specta]
    pub fn factions_delete(_input: DeleteFactionInput) {}

    #[tauri::command]
    #[specta::specta]
    pub fn factions_set_tags(_input: SetFactionTagsInput) -> Vec<Tag> {
        Vec::new()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn factions_ranks_list(_input: ListFactionRanksInput) -> Vec<FactionRank> {
        Vec::new()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn factions_ranks_create(_input: CreateFactionRankInput) -> FactionRank {
        FactionRank {
            id: 0,
            faction_id: 0,
            name: String::new(),
            level: 0,
            description: String::new(),
            permissions: String::new(),
            icon: String::new(),
            color: String::new(),
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn factions_ranks_update(_input: UpdateFactionRankInput) -> FactionRank {
        factions_ranks_create(CreateFactionRankInput {
            faction_id: 0,
            name: String::new(),
            level: None,
            description: None,
            permissions: None,
            icon: None,
            color: None,
            branch_id: None,
        })
    }

    #[tauri::command]
    #[specta::specta]
    pub fn factions_ranks_delete(_input: DeleteFactionRankInput) {}

    #[tauri::command]
    #[specta::specta]
    pub fn factions_members_list(_input: ListFactionMembersInput) -> Vec<FactionMember> {
        Vec::new()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn factions_members_create(_input: CreateFactionMemberInput) -> FactionMember {
        FactionMember {
            id: 0,
            faction_id: 0,
            character_id: 0,
            rank_id: None,
            role: String::new(),
            joined_date: String::new(),
            left_date: String::new(),
            is_active: true,
            notes: String::new(),
            character_name: String::new(),
            character_image_path: String::new(),
            rank_name: String::new(),
            rank_level: None,
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn factions_members_update(_input: UpdateFactionMemberInput) -> FactionMember {
        factions_members_create(CreateFactionMemberInput {
            faction_id: 0,
            character_id: 0,
            rank_id: None,
            role: None,
            joined_date: None,
            left_date: None,
            is_active: None,
            notes: None,
            branch_id: None,
        })
    }

    #[tauri::command]
    #[specta::specta]
    pub fn factions_members_delete(_input: DeleteFactionMemberInput) {}

    #[tauri::command]
    #[specta::specta]
    pub fn factions_custom_metrics_replace(
        _input: ReplaceFactionCustomMetricsInput,
    ) -> Vec<FactionCustomMetric> {
        Vec::new()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn factions_compare(_input: CompareFactionsInput) -> FactionCompareResult {
        FactionCompareResult {
            factions: Vec::new(),
            metrics: Vec::new(),
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn factions_relations_list(_input: FactionsRelationsListInput) -> Vec<FactionRelation> {
        Vec::new()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn factions_relations_create(_input: CreateFactionRelationInput) -> FactionRelation {
        FactionRelation {
            id: 0,
            project_id: 0,
            source_faction_id: 0,
            target_faction_id: 0,
            relation_type: "neutral".to_string(),
            custom_label: String::new(),
            description: String::new(),
            started_date: String::new(),
            is_bidirectional: true,
            created_at: String::new(),
            source_faction_name: String::new(),
            target_faction_name: String::new(),
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn factions_relations_update(_input: UpdateFactionRelationInput) -> FactionRelation {
        factions_relations_create(CreateFactionRelationInput {
            project_id: 0,
            source_faction_id: 0,
            target_faction_id: 0,
            relation_type: None,
            custom_label: None,
            description: None,
            started_date: None,
            is_bidirectional: None,
            branch_id: None,
        })
    }

    #[tauri::command]
    #[specta::specta]
    pub fn factions_relations_delete(_input: DeleteFactionRelationInput) {}

    #[tauri::command]
    #[specta::specta]
    pub fn factions_graph(_input: FactionsRelationsListInput) -> FactionGraph {
        FactionGraph {
            nodes: Vec::new(),
            edges: Vec::new(),
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn factions_policies_list(_input: ListFactionPoliciesInput) -> Vec<FactionPolicy> {
        Vec::new()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn factions_policies_create(_input: CreateFactionPolicyInput) -> FactionPolicy {
        FactionPolicy {
            id: 0,
            faction_id: 0,
            title: String::new(),
            r#type: "policy".to_string(),
            status: "active".to_string(),
            category: "other".to_string(),
            enacted_date: None,
            description: String::new(),
            sort_order: 0,
            created_at: String::new(),
            updated_at: String::new(),
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn factions_policies_update(_input: UpdateFactionPolicyInput) -> FactionPolicy {
        factions_policies_create(CreateFactionPolicyInput {
            faction_id: 0,
            title: String::new(),
            r#type: "policy".to_string(),
            status: None,
            category: None,
            enacted_date: None,
            description: None,
            sort_order: None,
            branch_id: None,
        })
    }

    #[tauri::command]
    #[specta::specta]
    pub fn factions_policies_delete(_input: DeleteFactionPolicyInput) {}

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
            codegen_commands::branches_list,
            codegen_commands::branches_create,
            codegen_commands::branches_update,
            codegen_commands::branches_delete,
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
            codegen_commands::factions_list,
            codegen_commands::factions_get,
            codegen_commands::factions_create,
            codegen_commands::factions_update,
            codegen_commands::factions_delete,
            codegen_commands::factions_set_tags,
            codegen_commands::factions_ranks_list,
            codegen_commands::factions_ranks_create,
            codegen_commands::factions_ranks_update,
            codegen_commands::factions_ranks_delete,
            codegen_commands::factions_members_list,
            codegen_commands::factions_members_create,
            codegen_commands::factions_members_update,
            codegen_commands::factions_members_delete,
            codegen_commands::factions_custom_metrics_replace,
            codegen_commands::factions_compare,
            codegen_commands::factions_relations_list,
            codegen_commands::factions_relations_create,
            codegen_commands::factions_relations_update,
            codegen_commands::factions_relations_delete,
            codegen_commands::factions_graph,
            codegen_commands::factions_policies_list,
            codegen_commands::factions_policies_create,
            codegen_commands::factions_policies_update,
            codegen_commands::factions_policies_delete,
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
        .typ::<ScenarioBranch>()
        .typ::<ListBranchesInput>()
        .typ::<CreateBranchInput>()
        .typ::<UpdateBranchInput>()
        .typ::<DeleteBranchInput>()
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
        .typ::<Faction>()
        .typ::<FactionsListInput>()
        .typ::<FactionsListResult>()
        .typ::<GetFactionInput>()
        .typ::<CreateFactionInput>()
        .typ::<UpdateFactionInput>()
        .typ::<DeleteFactionInput>()
        .typ::<SetFactionTagsInput>()
        .typ::<FactionRank>()
        .typ::<ListFactionRanksInput>()
        .typ::<CreateFactionRankInput>()
        .typ::<UpdateFactionRankInput>()
        .typ::<DeleteFactionRankInput>()
        .typ::<FactionMember>()
        .typ::<ListFactionMembersInput>()
        .typ::<CreateFactionMemberInput>()
        .typ::<UpdateFactionMemberInput>()
        .typ::<DeleteFactionMemberInput>()
        .typ::<FactionCustomMetric>()
        .typ::<ReplaceFactionCustomMetricsInput>()
        .typ::<CompareFactionsInput>()
        .typ::<FactionCompareResult>()
        .typ::<FactionRelation>()
        .typ::<FactionsRelationsListInput>()
        .typ::<CreateFactionRelationInput>()
        .typ::<UpdateFactionRelationInput>()
        .typ::<DeleteFactionRelationInput>()
        .typ::<FactionGraph>()
        .typ::<FactionPolicy>()
        .typ::<ListFactionPoliciesInput>()
        .typ::<CreateFactionPolicyInput>()
        .typ::<UpdateFactionPolicyInput>()
        .typ::<DeleteFactionPolicyInput>()
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
