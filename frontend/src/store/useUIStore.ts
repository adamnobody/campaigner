import { create } from 'zustand';

export type SnackbarSeverity = 'success' | 'error' | 'warning' | 'info';

interface UIState {
  sidebarOpen: boolean;
  sidebarWidth: number;

  // Search
  searchOpen: boolean;

  // Snackbar
  snackbar: {
    open: boolean;
    message: string;
    severity: SnackbarSeverity;
  };

  // Confirm dialog
  confirmDialog: {
    open: boolean;
    title: string;
    message: string;
    onConfirm: (() => void) | null;
  };

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  toggleSearch: () => void;
  showSnackbar: (message: string, severity?: SnackbarSeverity) => void;
  hideSnackbar: () => void;
  showConfirmDialog: (title: string, message: string, onConfirm: () => void) => void;
  hideConfirmDialog: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarWidth: 280,

  searchOpen: false,

  snackbar: {
    open: false,
    message: '',
    severity: 'info',
  },

  confirmDialog: {
    open: false,
    title: '',
    message: '',
    onConfirm: null,
  },

  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  toggleSearch: () => set(state => ({ searchOpen: !state.searchOpen })),

  showSnackbar: (message, severity = 'info') =>
    set({ snackbar: { open: true, message, severity } }),
  hideSnackbar: () =>
    set(state => ({ snackbar: { ...state.snackbar, open: false } })),

  showConfirmDialog: (title, message, onConfirm) =>
    set({ confirmDialog: { open: true, title, message, onConfirm } }),
  hideConfirmDialog: () =>
    set({ confirmDialog: { open: false, title: '', message: '', onConfirm: null } }),
}));