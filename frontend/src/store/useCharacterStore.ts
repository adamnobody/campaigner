import { create } from 'zustand';
import {
  Character, CreateCharacter, UpdateCharacter,
  CharacterRelationship, CreateRelationship,
  CharacterGraph
} from '@campaigner/shared';
import { charactersApi } from '@/api/axiosClient';

interface CharacterState {
  characters: Character[];
  currentCharacter: Character | null;
  relationships: CharacterRelationship[];
  graph: CharacterGraph | null;
  total: number;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  fetchCharacters: (projectId: number, params?: any) => Promise<void>;
  fetchCharacter: (id: number) => Promise<void>;
  createCharacter: (data: CreateCharacter) => Promise<Character>;
  updateCharacter: (id: number, data: UpdateCharacter) => Promise<void>;
  deleteCharacter: (id: number) => Promise<void>;
  uploadImage: (id: number, file: File) => Promise<void>;
  setTags: (id: number, tagIds: number[]) => Promise<void>;

  fetchRelationships: (projectId: number) => Promise<void>;
  createRelationship: (data: CreateRelationship) => Promise<void>;
  deleteRelationship: (id: number) => Promise<void>;

  fetchGraph: (projectId: number) => Promise<void>;

  setCurrentCharacter: (character: Character | null) => void;
  clearError: () => void;
}

export const useCharacterStore = create<CharacterState>((set) => ({
  characters: [],
  currentCharacter: null,
  relationships: [],
  graph: null,
  total: 0,
  loading: false,
  initialized: false,
  error: null,

  fetchCharacters: async (projectId, params) => {
    set({ loading: true, error: null });
    try {
      const res = await charactersApi.getAll(projectId, params);
      set({
        characters: res.data.data.items,
        total: res.data.data.total,
        loading: false,
        initialized: true,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false, initialized: true });
    }
  },

  fetchCharacter: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await charactersApi.getById(id);
      set({ currentCharacter: res.data.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createCharacter: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await charactersApi.create(data);
      const character = res.data.data;
      set(state => ({
        characters: [character, ...state.characters],
        total: state.total + 1,
        loading: false,
      }));
      return character;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateCharacter: async (id, data) => {
    set({ error: null });
    try {
      const res = await charactersApi.update(id, data);
      const updated = res.data.data;
      set(state => ({
        characters: state.characters.map(c => c.id === id ? updated : c),
        currentCharacter: state.currentCharacter?.id === id ? updated : state.currentCharacter,
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteCharacter: async (id) => {
    set({ error: null });
    try {
      await charactersApi.delete(id);
      set(state => ({
        characters: state.characters.filter(c => c.id !== id),
        total: state.total - 1,
        currentCharacter: state.currentCharacter?.id === id ? null : state.currentCharacter,
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  uploadImage: async (id, file) => {
    set({ error: null });
    try {
      const res = await charactersApi.uploadImage(id, file);
      const updated = res.data.data;
      set(state => ({
        characters: state.characters.map(c => c.id === id ? updated : c),
        currentCharacter: state.currentCharacter?.id === id ? updated : state.currentCharacter,
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  setTags: async (id, tagIds) => {
    set({ error: null });
    try {
      await charactersApi.setTags(id, tagIds);
      const res = await charactersApi.getById(id);
      const updated = res.data.data;
      set(state => ({
        characters: state.characters.map(c => c.id === id ? updated : c),
        currentCharacter: state.currentCharacter?.id === id ? updated : state.currentCharacter,
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  fetchRelationships: async (projectId) => {
    try {
      const res = await charactersApi.getRelationships(projectId);
      set({ relationships: res.data.data });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  createRelationship: async (data) => {
    set({ error: null });
    try {
      const res = await charactersApi.createRelationship(data);
      set(state => ({
        relationships: [...state.relationships, res.data.data],
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteRelationship: async (id) => {
    set({ error: null });
    try {
      await charactersApi.deleteRelationship(id);
      set(state => ({
        relationships: state.relationships.filter(r => r.id !== id),
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  fetchGraph: async (projectId) => {
    try {
      const res = await charactersApi.getGraph(projectId);
      set({ graph: res.data.data });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  setCurrentCharacter: (character) => set({ currentCharacter: character }),
  clearError: () => set({ error: null }),
}));