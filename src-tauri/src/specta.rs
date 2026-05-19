use std::path::Path;

use specta_typescript::Typescript;
use tauri_specta::{collect_commands, Builder};

use crate::models::ambition::{
    Ambition, AssignFactionAmbitionInput, CreateAmbitionInput, DeleteAmbitionInput,
    GetAmbitionsCatalogInput, GetFactionAmbitionsInput, UnassignFactionAmbitionInput,
    UpdateAmbitionExclusionsInput, UpdateAmbitionInput,
};
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
use crate::models::character_trait::{
    AssignCharacterTraitInput, CharacterTrait, CreateCharacterTraitInput,
    DeleteCharacterTraitInput, GetAssignedCharacterTraitsInput, ListCharacterTraitsInput,
    UnassignCharacterTraitInput, UpdateCharacterTraitExclusionsInput,
};
use crate::models::dogma::{
    CreateDogmaInput, DeleteDogmaInput, Dogma, DogmasListInput, DogmasListResult, GetDogmaInput,
    ReorderDogmasInput, SetDogmaTagsInput, UpdateDogmaInput,
};
use crate::models::dynasty::{
    AddDynastyEventInput, AddDynastyFamilyLinkInput, AddDynastyMemberInput, CreateDynastyInput,
    DeleteDynastyEventInput, DeleteDynastyFamilyLinkInput, DeleteDynastyInput, DynastiesListInput,
    DynastiesListResult, Dynasty, DynastyEvent, DynastyFamilyLink, DynastyMember, GetDynastyInput,
    RemoveDynastyMemberInput, ReorderDynastyEventsInput, SaveDynastyGraphPositionsInput,
    SetDynastyTagsInput, UpdateDynastyEventInput, UpdateDynastyInput, UpdateDynastyMemberInput,
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
use crate::models::graph_layout::{
    DeleteGraphLayoutInput, GetGraphLayoutInput, GraphLayoutDataV1, GraphLayoutNodeState,
    GraphLayoutResponse, GraphLayoutViewport, UpsertGraphLayoutInput,
};
use crate::models::map::{
    CreateMapInput, CreateMapMarkerInput, CreateMapTerritoryInput, DeleteMapInput,
    DeleteMapMarkerInput, DeleteMapTerritoryInput, GetMapInput, GetMapTreeInput, GetRootMapInput,
    ListMapMarkersInput, ListMapTerritoriesInput, ListTerritorySummariesInput, MapMarker,
    MapRecord, MapTerritory, MapTerritoryPoint, MapTerritorySummary, UpdateMapInput,
    UpdateMapMarkerInput, UpdateMapTerritoryInput,
};
use crate::models::note::{
    CreateNoteInput, DeleteNoteInput, GetNoteInput, Note, NotesListInput, NotesListResult,
    SetNoteTagsInput, UpdateNoteInput,
};
use crate::models::political_scale::{
    CreatePoliticalScaleInput, DeletePoliticalScaleAssignmentInput, DeletePoliticalScaleInput,
    ListPoliticalScaleAssignmentsInput, ListPoliticalScalesInput, PoliticalScale,
    PoliticalScaleAssignment, PoliticalScaleAssignmentUpsertRow,
    ReplacePoliticalScaleAssignmentsInput, ScaleZone, UpdatePoliticalScaleInput,
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
        AddDynastyEventInput, AddDynastyFamilyLinkInput, AddDynastyMemberInput, Ambition,
        AppHealthResponse, AssignCharacterTraitInput, AssignFactionAmbitionInput, Character,
        CharacterGraph, CharacterRelationship, CharacterTrait, CharactersListInput,
        CharactersListResult, CompareFactionsInput, CreateAmbitionInput, CreateBranchInput,
        CreateCharacterInput, CreateCharacterTraitInput, CreateDogmaInput, CreateDynastyInput,
        CreateFactionInput, CreateFactionMemberInput, CreateFactionPolicyInput,
        CreateFactionRankInput, CreateFactionRelationInput, CreateMapInput, CreateMapMarkerInput,
        CreateMapTerritoryInput, CreateNoteInput, CreatePoliticalScaleInput, CreateProjectInput,
        CreateRelationshipInput, CreateTagInput, CreateTimelineEventInput, DeleteAmbitionInput,
        DeleteBranchInput, DeleteCharacterInput, DeleteCharacterTraitInput, DeleteDogmaInput,
        DeleteDynastyEventInput, DeleteDynastyFamilyLinkInput, DeleteDynastyInput,
        DeleteFactionInput, DeleteFactionMemberInput, DeleteFactionPolicyInput,
        DeleteFactionRankInput, DeleteFactionRelationInput, DeleteGraphLayoutInput, DeleteMapInput,
        DeleteMapMarkerInput, DeleteMapTerritoryInput, DeleteNoteInput,
        DeletePoliticalScaleAssignmentInput, DeletePoliticalScaleInput, DeleteProjectInput,
        DeleteRelationshipInput, DeleteTagInput, DeleteTimelineEventInput, Dogma, DogmasListInput,
        DogmasListResult, DynastiesListInput, DynastiesListResult, Dynasty, DynastyEvent,
        DynastyFamilyLink, DynastyMember, Faction, FactionCompareResult, FactionCustomMetric,
        FactionGraph, FactionMember, FactionPolicy, FactionRank, FactionRelation,
        FactionsListInput, FactionsListResult, FactionsRelationsListInput,
        GetAmbitionsCatalogInput, GetAssignedCharacterTraitsInput, GetCharacterInput,
        GetDogmaInput, GetDynastyInput, GetFactionAmbitionsInput, GetFactionInput,
        GetGraphLayoutInput, GetMapInput, GetMapTreeInput, GetNoteInput, GetProjectInput,
        GetRootMapInput, GetTimelineEventInput, GraphLayoutDataV1, GraphLayoutResponse,
        ListBranchesInput, ListCharacterTraitsInput, ListFactionMembersInput,
        ListFactionPoliciesInput, ListFactionRanksInput, ListMapMarkersInput,
        ListMapTerritoriesInput, ListPoliticalScaleAssignmentsInput, ListPoliticalScalesInput,
        ListTerritorySummariesInput, MapMarker, MapRecord, MapTerritory, MapTerritorySummary, Note,
        NotesListInput, NotesListResult, PoliticalScale, PoliticalScaleAssignment, Project,
        RelationshipsListInput, RemoveDynastyMemberInput, ReorderDogmasInput,
        ReorderDynastyEventsInput, ReorderTimelineInput, ReplaceFactionCustomMetricsInput,
        ReplacePoliticalScaleAssignmentsInput, SaveDynastyGraphPositionsInput, ScenarioBranch,
        SetCharacterTagsInput, SetDogmaTagsInput, SetDynastyTagsInput, SetFactionTagsInput,
        SetNoteTagsInput, SetTimelineTagsInput, Tag, TagsListInput, TimelineEvent,
        TimelineListInput, UnassignCharacterTraitInput, UnassignFactionAmbitionInput,
        UpdateAmbitionExclusionsInput, UpdateAmbitionInput, UpdateBranchInput,
        UpdateCharacterInput, UpdateCharacterTraitExclusionsInput, UpdateDogmaInput,
        UpdateDynastyEventInput, UpdateDynastyInput, UpdateDynastyMemberInput, UpdateFactionInput,
        UpdateFactionMemberInput, UpdateFactionPolicyInput, UpdateFactionRankInput,
        UpdateFactionRelationInput, UpdateMapInput, UpdateMapMarkerInput, UpdateMapTerritoryInput,
        UpdateNoteInput, UpdatePoliticalScaleInput, UpdateProjectInput, UpdateRelationshipInput,
        UpdateTimelineEventInput, UpsertGraphLayoutInput,
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
    pub fn dogmas_list(_input: DogmasListInput) -> DogmasListResult {
        DogmasListResult {
            items: Vec::new(),
            total: 0,
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn dogmas_get(_input: GetDogmaInput) -> Dogma {
        Dogma {
            id: 0,
            project_id: 0,
            title: String::new(),
            category: "other".to_string(),
            description: String::new(),
            impact: String::new(),
            exceptions: String::new(),
            is_public: true,
            importance: "major".to_string(),
            status: "active".to_string(),
            sort_order: 0,
            icon: String::new(),
            color: String::new(),
            tags: Vec::new(),
            created_at: String::new(),
            updated_at: String::new(),
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn dogmas_create(_input: CreateDogmaInput) -> Dogma {
        dogmas_get(GetDogmaInput {
            id: 0,
            branch_id: None,
        })
    }

    #[tauri::command]
    #[specta::specta]
    pub fn dogmas_update(_input: UpdateDogmaInput) -> Dogma {
        dogmas_get(GetDogmaInput {
            id: 0,
            branch_id: None,
        })
    }

    #[tauri::command]
    #[specta::specta]
    pub fn dogmas_delete(_input: DeleteDogmaInput) {}

    #[tauri::command]
    #[specta::specta]
    pub fn dogmas_reorder(_input: ReorderDogmasInput) -> DogmasListResult {
        DogmasListResult {
            items: Vec::new(),
            total: 0,
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn dogmas_set_tags(_input: SetDogmaTagsInput) -> Vec<Tag> {
        Vec::new()
    }

    fn empty_dynasty() -> Dynasty {
        Dynasty {
            id: 0,
            project_id: 0,
            name: String::new(),
            motto: String::new(),
            description: String::new(),
            history: String::new(),
            status: "active".to_string(),
            color: String::new(),
            secondary_color: String::new(),
            image_path: None,
            founded_date: String::new(),
            extinct_date: String::new(),
            founder_id: None,
            current_leader_id: None,
            heir_id: None,
            linked_faction_id: None,
            sort_order: 0,
            created_at: String::new(),
            updated_at: String::new(),
            member_count: None,
            tags: None,
            members: None,
            family_links: None,
            events: None,
            founder_name: None,
            current_leader_name: None,
            heir_name: None,
            linked_faction_name: None,
        }
    }

    fn empty_dynasty_member() -> DynastyMember {
        DynastyMember {
            id: 0,
            dynasty_id: 0,
            character_id: 0,
            generation: 0,
            role: String::new(),
            birth_date: String::new(),
            death_date: String::new(),
            is_main_line: true,
            notes: String::new(),
            graph_x: None,
            graph_y: None,
            character_name: None,
            character_image_path: None,
            character_status: None,
        }
    }

    fn empty_dynasty_family_link() -> DynastyFamilyLink {
        DynastyFamilyLink {
            id: 0,
            dynasty_id: 0,
            source_character_id: 0,
            target_character_id: 0,
            relation_type: "parent".to_string(),
            custom_label: String::new(),
            source_character_name: None,
            target_character_name: None,
        }
    }

    fn empty_dynasty_event() -> DynastyEvent {
        DynastyEvent {
            id: 0,
            dynasty_id: 0,
            title: String::new(),
            description: String::new(),
            event_date: String::new(),
            importance: "normal".to_string(),
            sort_order: 0,
            created_at: String::new(),
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn dynasties_list(_input: DynastiesListInput) -> DynastiesListResult {
        DynastiesListResult {
            items: Vec::new(),
            total: 0,
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn dynasties_get(_input: GetDynastyInput) -> Dynasty {
        empty_dynasty()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn dynasties_create(_input: CreateDynastyInput) -> Dynasty {
        empty_dynasty()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn dynasties_update(_input: UpdateDynastyInput) -> Dynasty {
        empty_dynasty()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn dynasties_delete(_input: DeleteDynastyInput) {}

    #[tauri::command]
    #[specta::specta]
    pub fn dynasties_set_tags(_input: SetDynastyTagsInput) -> Dynasty {
        empty_dynasty()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn dynasties_add_member(_input: AddDynastyMemberInput) -> DynastyMember {
        empty_dynasty_member()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn dynasties_update_member(_input: UpdateDynastyMemberInput) -> DynastyMember {
        empty_dynasty_member()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn dynasties_remove_member(_input: RemoveDynastyMemberInput) {}

    #[tauri::command]
    #[specta::specta]
    pub fn dynasties_save_graph_positions(_input: SaveDynastyGraphPositionsInput) {}

    #[tauri::command]
    #[specta::specta]
    pub fn dynasties_add_family_link(_input: AddDynastyFamilyLinkInput) -> DynastyFamilyLink {
        empty_dynasty_family_link()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn dynasties_delete_family_link(_input: DeleteDynastyFamilyLinkInput) {}

    #[tauri::command]
    #[specta::specta]
    pub fn dynasties_add_event(_input: AddDynastyEventInput) -> DynastyEvent {
        empty_dynasty_event()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn dynasties_update_event(_input: UpdateDynastyEventInput) -> DynastyEvent {
        empty_dynasty_event()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn dynasties_delete_event(_input: DeleteDynastyEventInput) {}

    #[tauri::command]
    #[specta::specta]
    pub fn dynasties_reorder_events(_input: ReorderDynastyEventsInput) -> Dynasty {
        empty_dynasty()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn ambitions_get_catalog(_input: GetAmbitionsCatalogInput) -> Vec<Ambition> {
        Vec::new()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn ambitions_create(_input: CreateAmbitionInput) -> Ambition {
        Ambition {
            id: 0,
            name: String::new(),
            description: String::new(),
            icon_path: String::new(),
            is_custom: true,
            exclusions: Vec::new(),
            project_id: Some(0),
            created_at: None,
            updated_at: None,
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn ambitions_update(_input: UpdateAmbitionInput) -> Ambition {
        ambitions_create(CreateAmbitionInput {
            project_id: 0,
            name: String::new(),
            description: None,
            icon_path: None,
            excluded_ids: None,
        })
    }

    #[tauri::command]
    #[specta::specta]
    pub fn ambitions_update_exclusions(_input: UpdateAmbitionExclusionsInput) -> Ambition {
        ambitions_create(CreateAmbitionInput {
            project_id: 0,
            name: String::new(),
            description: None,
            icon_path: None,
            excluded_ids: None,
        })
    }

    #[tauri::command]
    #[specta::specta]
    pub fn ambitions_delete(_input: DeleteAmbitionInput) {}

    #[tauri::command]
    #[specta::specta]
    pub fn ambitions_get_faction_ambitions(_input: GetFactionAmbitionsInput) -> Vec<Ambition> {
        Vec::new()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn ambitions_assign_faction_ambition(_input: AssignFactionAmbitionInput) {}

    #[tauri::command]
    #[specta::specta]
    pub fn ambitions_unassign_faction_ambition(_input: UnassignFactionAmbitionInput) {}

    #[tauri::command]
    #[specta::specta]
    pub fn character_traits_list(_input: ListCharacterTraitsInput) -> Vec<CharacterTrait> {
        Vec::new()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn character_traits_get_assigned(_input: GetAssignedCharacterTraitsInput) -> Vec<i32> {
        Vec::new()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn character_traits_assign(_input: AssignCharacterTraitInput) {}

    #[tauri::command]
    #[specta::specta]
    pub fn character_traits_unassign(_input: UnassignCharacterTraitInput) {}

    #[tauri::command]
    #[specta::specta]
    pub fn character_traits_create(_input: CreateCharacterTraitInput) -> CharacterTrait {
        CharacterTrait {
            id: 0,
            project_id: 0,
            name: String::new(),
            description: String::new(),
            image_path: String::new(),
            is_predefined: false,
            exclusions: Vec::new(),
            sort_order: 0,
            created_at: None,
            updated_at: None,
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn character_traits_update_exclusions(
        _input: UpdateCharacterTraitExclusionsInput,
    ) -> CharacterTrait {
        character_traits_create(CreateCharacterTraitInput {
            project_id: 0,
            name: String::new(),
            description: None,
            image_path: None,
            excluded_ids: None,
        })
    }

    #[tauri::command]
    #[specta::specta]
    pub fn character_traits_delete(_input: DeleteCharacterTraitInput) {}

    #[tauri::command]
    #[specta::specta]
    pub fn political_scales_list(_input: ListPoliticalScalesInput) -> Vec<PoliticalScale> {
        Vec::new()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn political_scales_create(_input: CreatePoliticalScaleInput) -> PoliticalScale {
        PoliticalScale {
            id: 0,
            code: String::new(),
            entity_type: "faction".to_string(),
            category: String::new(),
            name: String::new(),
            left_pole_label: String::new(),
            right_pole_label: String::new(),
            left_pole_description: String::new(),
            right_pole_description: String::new(),
            icon: None,
            zones: None,
            is_system: false,
            world_id: Some(0),
            order: 0,
            created_at: String::new(),
            updated_at: String::new(),
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn political_scales_update(_input: UpdatePoliticalScaleInput) -> PoliticalScale {
        political_scales_create(CreatePoliticalScaleInput {
            world_id: 0,
            code: "custom".to_string(),
            entity_type: "faction".to_string(),
            category: "other".to_string(),
            name: String::new(),
            left_pole_label: String::new(),
            right_pole_label: String::new(),
            left_pole_description: None,
            right_pole_description: None,
            icon: None,
            zones: None,
            order: None,
        })
    }

    #[tauri::command]
    #[specta::specta]
    pub fn political_scales_delete(_input: DeletePoliticalScaleInput) {}

    #[tauri::command]
    #[specta::specta]
    pub fn political_scale_assignments_list(
        _input: ListPoliticalScaleAssignmentsInput,
    ) -> Vec<PoliticalScaleAssignment> {
        Vec::new()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn political_scale_assignments_replace(
        _input: ReplacePoliticalScaleAssignmentsInput,
    ) -> Vec<PoliticalScaleAssignment> {
        Vec::new()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn political_scale_assignments_delete(_input: DeletePoliticalScaleAssignmentInput) {}

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
    pub fn graph_layout_get(_input: GetGraphLayoutInput) -> GraphLayoutResponse {
        GraphLayoutResponse {
            layout_data: GraphLayoutDataV1 {
                version: 1,
                viewport: None,
                nodes: std::collections::HashMap::new(),
            },
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn graph_layout_upsert(input: UpsertGraphLayoutInput) -> GraphLayoutResponse {
        graph_layout_get(GetGraphLayoutInput {
            project_id: input.project_id,
            graph_type: input.graph_type,
            branch_id: input.branch_id,
        })
    }

    #[tauri::command]
    #[specta::specta]
    pub fn graph_layout_delete(_input: DeleteGraphLayoutInput) {}

    fn empty_map_record() -> MapRecord {
        MapRecord {
            id: 0,
            project_id: 0,
            parent_map_id: None,
            parent_marker_id: None,
            name: String::new(),
            image_path: None,
            created_at: String::new(),
            updated_at: String::new(),
        }
    }

    fn empty_map_marker() -> MapMarker {
        MapMarker {
            id: 0,
            map_id: 0,
            title: String::new(),
            description: String::new(),
            position_x: 0.0,
            position_y: 0.0,
            color: "#FF6B6B".to_string(),
            icon: "custom".to_string(),
            linked_note_id: None,
            child_map_id: None,
            created_at: String::new(),
            updated_at: String::new(),
        }
    }

    fn empty_map_territory() -> MapTerritory {
        MapTerritory {
            id: 0,
            map_id: 0,
            name: String::new(),
            description: String::new(),
            color: "#4ECDC4".to_string(),
            opacity: 0.25,
            border_color: "#4ECDC4".to_string(),
            border_width: 2.0,
            smoothing: 0.0,
            rings: Vec::new(),
            faction_id: None,
            sort_order: 0,
            created_at: String::new(),
            updated_at: String::new(),
        }
    }

    #[tauri::command]
    #[specta::specta]
    pub fn maps_get_root(_input: GetRootMapInput) -> Option<MapRecord> {
        None
    }

    #[tauri::command]
    #[specta::specta]
    pub fn maps_get_tree(_input: GetMapTreeInput) -> Vec<MapRecord> {
        Vec::new()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn maps_get(_input: GetMapInput) -> MapRecord {
        empty_map_record()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn maps_create(_input: CreateMapInput) -> MapRecord {
        empty_map_record()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn maps_update(_input: UpdateMapInput) -> MapRecord {
        empty_map_record()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn maps_delete(_input: DeleteMapInput) {}

    #[tauri::command]
    #[specta::specta]
    pub fn maps_markers_list(_input: ListMapMarkersInput) -> Vec<MapMarker> {
        Vec::new()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn maps_markers_create(_input: CreateMapMarkerInput) -> MapMarker {
        empty_map_marker()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn maps_markers_update(_input: UpdateMapMarkerInput) -> MapMarker {
        empty_map_marker()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn maps_markers_delete(_input: DeleteMapMarkerInput) {}

    #[tauri::command]
    #[specta::specta]
    pub fn maps_territories_list(_input: ListMapTerritoriesInput) -> Vec<MapTerritory> {
        Vec::new()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn maps_territories_create(_input: CreateMapTerritoryInput) -> MapTerritory {
        empty_map_territory()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn maps_territories_update(_input: UpdateMapTerritoryInput) -> MapTerritory {
        empty_map_territory()
    }

    #[tauri::command]
    #[specta::specta]
    pub fn maps_territories_delete(_input: DeleteMapTerritoryInput) {}

    #[tauri::command]
    #[specta::specta]
    pub fn maps_territory_summaries_list(
        _input: ListTerritorySummariesInput,
    ) -> Vec<MapTerritorySummary> {
        Vec::new()
    }

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
            codegen_commands::dogmas_list,
            codegen_commands::dogmas_get,
            codegen_commands::dogmas_create,
            codegen_commands::dogmas_update,
            codegen_commands::dogmas_delete,
            codegen_commands::dogmas_reorder,
            codegen_commands::dogmas_set_tags,
            codegen_commands::dynasties_list,
            codegen_commands::dynasties_get,
            codegen_commands::dynasties_create,
            codegen_commands::dynasties_update,
            codegen_commands::dynasties_delete,
            codegen_commands::dynasties_set_tags,
            codegen_commands::dynasties_add_member,
            codegen_commands::dynasties_update_member,
            codegen_commands::dynasties_remove_member,
            codegen_commands::dynasties_save_graph_positions,
            codegen_commands::dynasties_add_family_link,
            codegen_commands::dynasties_delete_family_link,
            codegen_commands::dynasties_add_event,
            codegen_commands::dynasties_update_event,
            codegen_commands::dynasties_delete_event,
            codegen_commands::dynasties_reorder_events,
            codegen_commands::ambitions_get_catalog,
            codegen_commands::ambitions_create,
            codegen_commands::ambitions_update,
            codegen_commands::ambitions_update_exclusions,
            codegen_commands::ambitions_delete,
            codegen_commands::ambitions_get_faction_ambitions,
            codegen_commands::ambitions_assign_faction_ambition,
            codegen_commands::ambitions_unassign_faction_ambition,
            codegen_commands::character_traits_list,
            codegen_commands::character_traits_get_assigned,
            codegen_commands::character_traits_assign,
            codegen_commands::character_traits_unassign,
            codegen_commands::character_traits_create,
            codegen_commands::character_traits_update_exclusions,
            codegen_commands::character_traits_delete,
            codegen_commands::political_scales_list,
            codegen_commands::political_scales_create,
            codegen_commands::political_scales_update,
            codegen_commands::political_scales_delete,
            codegen_commands::political_scale_assignments_list,
            codegen_commands::political_scale_assignments_replace,
            codegen_commands::political_scale_assignments_delete,
            codegen_commands::graph_layout_get,
            codegen_commands::graph_layout_upsert,
            codegen_commands::graph_layout_delete,
            codegen_commands::maps_get_root,
            codegen_commands::maps_get_tree,
            codegen_commands::maps_get,
            codegen_commands::maps_create,
            codegen_commands::maps_update,
            codegen_commands::maps_delete,
            codegen_commands::maps_markers_list,
            codegen_commands::maps_markers_create,
            codegen_commands::maps_markers_update,
            codegen_commands::maps_markers_delete,
            codegen_commands::maps_territories_list,
            codegen_commands::maps_territories_create,
            codegen_commands::maps_territories_update,
            codegen_commands::maps_territories_delete,
            codegen_commands::maps_territory_summaries_list,
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
        .typ::<Dogma>()
        .typ::<DogmasListInput>()
        .typ::<DogmasListResult>()
        .typ::<GetDogmaInput>()
        .typ::<CreateDogmaInput>()
        .typ::<UpdateDogmaInput>()
        .typ::<DeleteDogmaInput>()
        .typ::<ReorderDogmasInput>()
        .typ::<SetDogmaTagsInput>()
        .typ::<Dynasty>()
        .typ::<DynastyMember>()
        .typ::<DynastyFamilyLink>()
        .typ::<DynastyEvent>()
        .typ::<DynastiesListInput>()
        .typ::<DynastiesListResult>()
        .typ::<GetDynastyInput>()
        .typ::<CreateDynastyInput>()
        .typ::<UpdateDynastyInput>()
        .typ::<DeleteDynastyInput>()
        .typ::<SetDynastyTagsInput>()
        .typ::<AddDynastyMemberInput>()
        .typ::<UpdateDynastyMemberInput>()
        .typ::<RemoveDynastyMemberInput>()
        .typ::<SaveDynastyGraphPositionsInput>()
        .typ::<AddDynastyFamilyLinkInput>()
        .typ::<DeleteDynastyFamilyLinkInput>()
        .typ::<AddDynastyEventInput>()
        .typ::<UpdateDynastyEventInput>()
        .typ::<DeleteDynastyEventInput>()
        .typ::<ReorderDynastyEventsInput>()
        .typ::<Ambition>()
        .typ::<GetAmbitionsCatalogInput>()
        .typ::<CreateAmbitionInput>()
        .typ::<UpdateAmbitionInput>()
        .typ::<UpdateAmbitionExclusionsInput>()
        .typ::<DeleteAmbitionInput>()
        .typ::<GetFactionAmbitionsInput>()
        .typ::<AssignFactionAmbitionInput>()
        .typ::<UnassignFactionAmbitionInput>()
        .typ::<CharacterTrait>()
        .typ::<ListCharacterTraitsInput>()
        .typ::<GetAssignedCharacterTraitsInput>()
        .typ::<AssignCharacterTraitInput>()
        .typ::<UnassignCharacterTraitInput>()
        .typ::<CreateCharacterTraitInput>()
        .typ::<UpdateCharacterTraitExclusionsInput>()
        .typ::<DeleteCharacterTraitInput>()
        .typ::<ScaleZone>()
        .typ::<PoliticalScale>()
        .typ::<PoliticalScaleAssignment>()
        .typ::<ListPoliticalScalesInput>()
        .typ::<CreatePoliticalScaleInput>()
        .typ::<UpdatePoliticalScaleInput>()
        .typ::<DeletePoliticalScaleInput>()
        .typ::<ListPoliticalScaleAssignmentsInput>()
        .typ::<PoliticalScaleAssignmentUpsertRow>()
        .typ::<ReplacePoliticalScaleAssignmentsInput>()
        .typ::<DeletePoliticalScaleAssignmentInput>()
        .typ::<GraphLayoutViewport>()
        .typ::<GraphLayoutNodeState>()
        .typ::<GraphLayoutDataV1>()
        .typ::<GetGraphLayoutInput>()
        .typ::<UpsertGraphLayoutInput>()
        .typ::<DeleteGraphLayoutInput>()
        .typ::<GraphLayoutResponse>()
        .typ::<MapRecord>()
        .typ::<MapMarker>()
        .typ::<MapTerritory>()
        .typ::<MapTerritoryPoint>()
        .typ::<MapTerritorySummary>()
        .typ::<GetRootMapInput>()
        .typ::<GetMapTreeInput>()
        .typ::<GetMapInput>()
        .typ::<CreateMapInput>()
        .typ::<UpdateMapInput>()
        .typ::<DeleteMapInput>()
        .typ::<ListMapMarkersInput>()
        .typ::<CreateMapMarkerInput>()
        .typ::<UpdateMapMarkerInput>()
        .typ::<DeleteMapMarkerInput>()
        .typ::<ListMapTerritoriesInput>()
        .typ::<CreateMapTerritoryInput>()
        .typ::<UpdateMapTerritoryInput>()
        .typ::<DeleteMapTerritoryInput>()
        .typ::<ListTerritorySummariesInput>()
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
