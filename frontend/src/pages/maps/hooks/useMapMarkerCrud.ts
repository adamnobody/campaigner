import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { mapApi } from '@/api/maps';
import { projectsApi } from '@/api/projects';
import { extractData, normalizeMap, normalizeMarker, DEFAULT_FORM, MARKER_COLORS } from '../components/mapUtils';
import type { MapData, MapMode, Marker } from '../components/mapUtils';
import type { Project } from '@campaigner/shared';

type SnackbarSeverity = 'success' | 'error' | 'warning' | 'info';

type UseMapMarkerCrudArgs = {
  projectId: number;
  currentMap: MapData | null;
  selectedMarker: Marker | null;
  setSelectedMarker: React.Dispatch<React.SetStateAction<Marker | null>>;
  setPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setMarkers: React.Dispatch<React.SetStateAction<Marker[]>>;
  setCurrentMap: React.Dispatch<React.SetStateAction<MapData | null>>;
  setProject: React.Dispatch<React.SetStateAction<Project | null>>;
  showSnackbar: (message: string, severity?: SnackbarSeverity) => void;
  showConfirmDialog: (title: string, message: string, onConfirm: () => void) => void;
};

export function useMapMarkerCrud({
  projectId,
  currentMap,
  selectedMarker,
  setSelectedMarker,
  setPanelOpen,
  setMarkers,
  setCurrentMap,
  setProject,
  showSnackbar,
  showConfirmDialog,
}: UseMapMarkerCrudArgs) {
  const { t } = useTranslation(['map', 'common']);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMarker, setEditingMarker] = useState<Marker | null>(null);
  const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(null);
  const [markerForm, setMarkerForm] = useState({ ...DEFAULT_FORM });
  const [childMapFile, setChildMapFile] = useState<File | null>(null);
  const [childMapPreview, setChildMapPreview] = useState<string | null>(null);

  const [draggingMarker, setDraggingMarker] = useState<Marker | null>(null);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number } | null>(null);
  const dragStartScreenRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const didDragRef = useRef(false);
  const lastDragPreviewUpdateAtRef = useRef(0);

  const openNewMarkerDialogAt = useCallback((px: number, py: number) => {
    setClickPos({ x: px, y: py });
    setEditingMarker(null);
    setMarkerForm({ ...DEFAULT_FORM });
    setChildMapFile(null);
    setChildMapPreview(null);
    setPanelOpen(false);
    setDialogOpen(true);
  }, [setPanelOpen]);

  const handleMarkerMouseDown = useCallback((e: React.MouseEvent, marker: Marker, mode: MapMode) => {
    if (e.button !== 0 || e.altKey || mode !== 'select') return;
    e.stopPropagation();
    isDraggingRef.current = true;
    didDragRef.current = false;
    dragStartScreenRef.current = { x: e.clientX, y: e.clientY };
    setDraggingMarker(marker);
    setDragPreview(null);
    lastDragPreviewUpdateAtRef.current = 0;
  }, []);

  const handleMarkerDragMove = useCallback((e: React.MouseEvent, imageElement: HTMLImageElement | null, dragThreshold: number) => {
    if (!isDraggingRef.current || !draggingMarker || !imageElement) return;

    const dx = e.clientX - dragStartScreenRef.current.x;
    const dy = e.clientY - dragStartScreenRef.current.y;
    if (!didDragRef.current && Math.sqrt(dx * dx + dy * dy) < dragThreshold) return;
    didDragRef.current = true;

    const now = performance.now();
    if (now - lastDragPreviewUpdateAtRef.current < 16) return;
    lastDragPreviewUpdateAtRef.current = now;

    const rect = imageElement.getBoundingClientRect();
    setDragPreview({
      x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)),
    });
  }, [draggingMarker]);

  const handleMarkerDragEnd = useCallback(async () => {
    if (!isDraggingRef.current || !draggingMarker) return;
    isDraggingRef.current = false;

    if (didDragRef.current && dragPreview) {
      try {
        await mapApi.updateMarker(draggingMarker.id, {
          positionX: dragPreview.x / 100,
          positionY: dragPreview.y / 100,
        });
        setMarkers(prev => prev.map(m => m.id === draggingMarker.id ? { ...m, x: dragPreview.x, y: dragPreview.y } : m));
        if (selectedMarker?.id === draggingMarker.id) {
          setSelectedMarker(prev => prev ? { ...prev, x: dragPreview.x, y: dragPreview.y } : prev);
        }
        showSnackbar(t('map:snackbar.markerMoved'), 'success');
      } catch {
        showSnackbar(t('map:snackbar.markerMoveError'), 'error');
      }
    }

    setDraggingMarker(null);
    setDragPreview(null);
    lastDragPreviewUpdateAtRef.current = 0;
    didDragRef.current = false;
  }, [dragPreview, draggingMarker, selectedMarker?.id, setMarkers, setSelectedMarker, showSnackbar, t]);

  const handleSaveMarker = useCallback(async () => {
    if (!markerForm.title.trim()) return;
    try {
      if (editingMarker) {
        const res = await mapApi.updateMarker(editingMarker.id, {
          title: markerForm.title,
          description: markerForm.description,
          positionX: editingMarker.x / 100,
          positionY: editingMarker.y / 100,
          icon: markerForm.icon,
          color: markerForm.color,
          linkedNoteId: markerForm.linkedNoteId,
        });
        const updated = normalizeMarker(extractData(res));
        setMarkers(prev => prev.map(m => m.id === editingMarker.id ? updated : m));
        if (selectedMarker?.id === editingMarker.id) setSelectedMarker(updated);
        showSnackbar(t('map:snackbar.markerUpdated', { name: markerForm.title.trim() }), 'success');
      } else if (clickPos && currentMap) {
        const res = await mapApi.createMarker(currentMap.id, {
          title: markerForm.title,
          description: markerForm.description,
          positionX: clickPos.x / 100,
          positionY: clickPos.y / 100,
          icon: markerForm.icon,
          color: markerForm.color,
          linkedNoteId: markerForm.linkedNoteId,
        });
        const newMarker = normalizeMarker(extractData(res));

        if (markerForm.createChildMap && currentMap) {
          try {
            const mapRes = await mapApi.createMap({
              projectId,
              parentMapId: currentMap.id,
              parentMarkerId: newMarker.id,
              name: t('map:childMap.autoName', { title: newMarker.title }),
            });
            const childMap = normalizeMap(extractData(mapRes));
            await mapApi.updateMarker(newMarker.id, { childMapId: childMap.id });
            newMarker.childMapId = childMap.id;

            if (childMapFile) {
              try {
                await mapApi.uploadMapImage(childMap.id, childMapFile);
              } catch {
                showSnackbar(t('map:snackbar.markerChildMapUploadWarning'), 'warning');
              }
            }
          } catch {
            showSnackbar(t('map:snackbar.markerChildMapWarning'), 'warning');
          }
        }

        setMarkers(prev => [...prev, newMarker]);
        setChildMapFile(null);
        setChildMapPreview(null);
        showSnackbar(t('map:snackbar.markerCreated', { name: newMarker.title }), 'success');
      }
      setDialogOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('map:snackbar.markerSaveError');
      showSnackbar(message, 'error');
    }
  }, [markerForm, editingMarker, clickPos, currentMap, projectId, childMapFile, selectedMarker?.id, setMarkers, setSelectedMarker, showSnackbar, t]);

  const handleDeleteMarker = useCallback((marker: Marker) => {
    showConfirmDialog(
      t('map:confirm.deleteMarkerTitle'),
      t('map:confirm.deleteMarkerMessage', { name: marker.title }),
      async () => {
      try {
        await mapApi.deleteMarker(marker.id);
        setMarkers(prev => prev.filter(m => m.id !== marker.id));
        setSelectedMarker(null);
        setPanelOpen(false);
        showSnackbar(t('map:snackbar.markerDeleted', { name: marker.title }), 'success');
      } catch {
        showSnackbar(t('map:snackbar.markerDeleteError'), 'error');
      }
    });
  }, [setMarkers, setPanelOpen, setSelectedMarker, showConfirmDialog, showSnackbar, t]);

  const handleEditMarker = useCallback((marker: Marker) => {
    setEditingMarker(marker);
    setMarkerForm({
      title: marker.title,
      description: marker.description || '',
      icon: marker.icon || 'custom',
      color: marker.color || MARKER_COLORS[0],
      linkedNoteId: marker.linkedNoteId,
      createChildMap: false,
    });
    setChildMapFile(null);
    setChildMapPreview(null);
    setDialogOpen(true);
  }, []);

  const handleUploadMap = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentMap) return;
    try {
      await mapApi.uploadMapImage(currentMap.id, file);
      const updated = normalizeMap(extractData(await mapApi.getMapById(currentMap.id)));
      setCurrentMap(updated);
      if (!updated.parentMapId) {
        await projectsApi.uploadMap(projectId, file);
        setProject(extractData(await projectsApi.getById(projectId)));
      }
      showSnackbar(t('map:snackbar.mapUploaded'), 'success');
    } catch {
      showSnackbar(t('map:snackbar.mapUploadError'), 'error');
    }
  }, [currentMap, projectId, setCurrentMap, setProject, showSnackbar, t]);

  const closeDialog = useCallback(() => setDialogOpen(false), []);

  const handleChildMapFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setChildMapFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setChildMapPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  }, []);

  const clearChildMapFile = useCallback(() => {
    setChildMapFile(null);
    setChildMapPreview(null);
  }, []);

  return {
    dialogOpen,
    editingMarker,
    markerForm,
    childMapFile,
    childMapPreview,
    draggingMarker,
    dragPreview,
    didDragRef,
    isDraggingRef,
    openNewMarkerDialogAt,
    setMarkerForm,
    handleMarkerMouseDown,
    handleMarkerDragMove,
    handleMarkerDragEnd,
    handleSaveMarker,
    handleDeleteMarker,
    handleEditMarker,
    handleUploadMap,
    closeDialog,
    handleChildMapFileChange,
    clearChildMapFile,
  };
}
