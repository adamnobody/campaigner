import axios from 'axios';

export const api = axios.create({
  baseURL: '/api'
});

export type GameSystemType = 'generic' | 'dnd5e' | 'vtm' | 'cyberpunk' | 'wh40k_rt';

export interface ProjectDTO {
  id: string;
  name: string;
  path: string;
  system: GameSystemType;
  created_at: string;
}

export type MapDTO = {
  id: string;
  project_id: string;
  parent_map_id: string | null;
  title: string;
  filename: string;
  created_at: string;
  updated_at: string;
};

export type MarkerType = 'location' | 'event' | 'character' | 'area';

export type MarkerLinkType = null | 'note' | 'map';

export type MarkerDTO = {
  id: string;
  map_id: string;
  title: string;
  description: string;
  x: number;
  y: number;

  points?: { x: number; y: number }[];
  style?: any;

  marker_type: MarkerType;
  color: string; // #RRGGBB

  link_type: MarkerLinkType;
  link_note_id: string | null;
  link_map_id: string | null;

  created_at: string;
  updated_at: string;
};

export type NoteType = 'md' | 'txt';

export type NoteDTO = {
  id: string;
  project_id: string;
  title: string;
  path: string;
  type: NoteType;
  created_at: string;
  updated_at: string;
};
