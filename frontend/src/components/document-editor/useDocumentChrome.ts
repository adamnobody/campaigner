import { useEffect } from 'react';
import { useUIStore, type DocumentChrome } from '@/store/useUIStore';

export function useDocumentChrome(chrome: DocumentChrome) {
  const setDocumentChrome = useUIStore((state) => state.setDocumentChrome);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);

  useEffect(() => {
    const wasOpen = useUIStore.getState().sidebarOpen;
    setSidebarOpen(false);
    return () => {
      setDocumentChrome(null);
      setSidebarOpen(wasOpen);
    };
  }, [setDocumentChrome, setSidebarOpen]);

  useEffect(() => {
    setDocumentChrome(chrome);
  }, [
    chrome,
    chrome.saveText,
    chrome.readMode,
    chrome.focusMode,
    chrome.readIcon,
    chrome.moreItems,
    chrome.onToggleRead,
    chrome.onToggleFocus,
    chrome.onDone,
    setDocumentChrome,
  ]);
}
