import { create } from 'zustand';
import { campaignerLayout } from '@/theme/designSystem';

export type SnackbarSeverity = 'success' | 'error' | 'warning' | 'info';

export type DocumentChromeMoreItem = {
  label: string;
  onClick: () => void;
  danger?: boolean;
};

export type DocumentChrome = {
  saveText: string;
  readMode: boolean;
  focusMode: boolean;
  readIcon?: 'eye' | 'book';
  moreItems: DocumentChromeMoreItem[];
  onToggleRead: () => void;
  onToggleFocus: () => void;
  onDone: () => void;
};

interface UIState {
  sidebarOpen: boolean;
  sidebarWidth: number;
  editorFocus: boolean;
  documentChrome: DocumentChrome | null;

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
  setEditorFocus: (focus: boolean) => void;
  setDocumentChrome: (chrome: DocumentChrome | null) => void;
  setSearchOpen: (open: boolean) => void;
  toggleSearch: () => void;
  showSnackbar: (message: string, severity?: SnackbarSeverity) => void;
  hideSnackbar: () => void;
  showConfirmDialog: (title: string, message: string, onConfirm: () => void) => void;
  hideConfirmDialog: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarWidth: campaignerLayout.sidebarExpanded,
  editorFocus: false,
  documentChrome: null,

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

  toggleSidebar: () => set(state => {
    const sidebarOpen = !state.sidebarOpen;
    return {
      sidebarOpen,
      sidebarWidth: sidebarOpen
        ? campaignerLayout.sidebarExpanded
        : campaignerLayout.sidebarCollapsed,
    };
  }),
  setSidebarOpen: (open) => set({
    sidebarOpen: open,
    sidebarWidth: open
      ? campaignerLayout.sidebarExpanded
      : campaignerLayout.sidebarCollapsed,
  }),
  setEditorFocus: (focus) => set({ editorFocus: focus }),
  setDocumentChrome: (chrome) => set({ documentChrome: chrome, editorFocus: Boolean(chrome?.focusMode) }),
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