import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  AppBar,
  Box,
  Button,
  Divider,
  IconButton,
  Toolbar,
  Typography,
  Breadcrumbs,
  Link as MUILink,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel
} from '@mui/material';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import HomeIcon from '@mui/icons-material/Home';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../app/store';
import { CreateMapDialog } from '../components/maps/CreateMapDialog';
import { MapCanvas } from '../components/maps/MapCanvas';
import { MapsTree } from '../components/maps/MapsTree';
import { MarkerDialog } from '../components/markers/MarkerDialog';
import type { MarkerDTO, MarkerType } from '../app/api';

import { NotesList } from '../components/notes/NotesList';
import { CreateNoteDialog } from '../components/notes/CreateNoteDialog';
import { NoteEditorPanel } from '../components/notes/NoteEditorPanel';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

type RightTab = 'inspector' | 'notes';

const LS_LEFT = 'ui.leftWidth';
const LS_RIGHT = 'ui.rightWidth';
const LS_RIGHT_OPEN = 'ui.rightOpen';

const LEFT_MIN = 220;
const LEFT_MAX = 420;
const RIGHT_MIN = 320;
const RIGHT_MAX = 680;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function buildBreadcrumbs(
  maps: { id: string; title: string; parent_map_id: string | null }[],
  mapId: string | null
) {
  if (!mapId) return [];
  const byId = new Map(maps.map((m) => [m.id, m]));
  const chain: { id: string; title: string }[] = [];
  let cur = byId.get(mapId);
  const guard = new Set<string>();

  while (cur && !guard.has(cur.id)) {
    guard.add(cur.id);
    chain.push({ id: cur.id, title: cur.title });
    cur = cur.parent_map_id ? byId.get(cur.parent_map_id) : undefined;
  }

  return chain.reverse();
}

function Splitter(props: {
  ariaLabel: string;
  onDrag: (dx: number) => void;
  requireKey?: 'Shift' | 'Alt' | 'Control';
}) {
  const { ariaLabel, onDrag, requireKey = 'Shift' } = props;

  const dragging = React.useRef(false);
  const lastX = React.useRef(0);

  const isKeyHeld = React.useCallback(
    (e: { shiftKey?: boolean; altKey?: boolean; ctrlKey?: boolean }) => {
      if (requireKey === 'Shift') return !!e.shiftKey;
      if (requireKey === 'Alt') return !!e.altKey;
      return !!e.ctrlKey;
    },
    [requireKey]
  );

  const stopDrag = React.useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    document.body.style.cursor = '';
  }, []);

  React.useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return;

      if (!isKeyHeld(e)) {
        stopDrag();
        return;
      }

      const dx = e.clientX - lastX.current;
      lastX.current = e.clientX;
      onDrag(dx);
    };

    const onPointerUp = () => stopDrag();

    const onKeyUp = (e: KeyboardEvent) => {
      if (
        (requireKey === 'Shift' && e.key === 'Shift') ||
        (requireKey === 'Alt' && e.key === 'Alt') ||
        (requireKey === 'Control' && e.key === 'Control')
      ) {
        stopDrag();
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [onDrag, isKeyHeld, stopDrag, requireKey]);

  return (
    <Box
      role="separator"
      aria-label={ariaLabel}
      onPointerDown={(e) => {
        if (!isKeyHeld(e)) return;

        dragging.current = true;
        lastX.current = e.clientX;
        document.body.style.cursor = 'col-resize';
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      }}
      sx={{
        width: 12,
        flex: '0 0 12px',
        cursor: 'col-resize',
        position: 'relative',
        bgcolor: 'transparent',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: '50%',
          top: 0,
          bottom: 0,
          width: '1px',
          bgcolor: 'divider',
          opacity: 0.8,
          transform: 'translateX(-50%)'
        },
        '&:hover': { bgcolor: 'action.hover' },
        '&:hover::before': { opacity: 1 }
      }}
      title={`Тяните с зажатой клавишей ${requireKey}`}
    />
  );
}

export function ProjectWorkspacePage() {
  const nav = useNavigate();
  const { projectId, mapId } = useParams();
  const pid = projectId ?? null;

  const {
    maps,
    loadMaps,
    currentMapId,
    setCurrentMapId,
    setCurrentProjectId,
    deleteMap,

    markersByMapId,
    loadMarkers,
    createMarker,
    patchMarker,
    deleteMarker,

    // notes
    setNoteDraftContent,
    notes,
    notesLoading,
    loadNotes,
    createNote,
    selectedNoteId,
    openNote,
    noteContentById,
    noteContentLoadingById,
    loadNoteContent,
    saveNoteContent,
    deleteNote,

    // create&link
    createNoteSilent,

    // filters/search (NEW)
    markerTypeVisibility,
    markerSearchQuery,
    markerOnlyLinked,
    setMarkerTypeVisibility,
    setMarkerSearchQuery,
    setMarkerOnlyLinked,
    resetMarkerFilters,
    getVisibleMarkersForMap
  } = useAppStore();

  // sizes + right panel open
  const [leftW, setLeftW] = useState(() => {
    const v = Number(localStorage.getItem(LS_LEFT));
    return Number.isFinite(v) ? clamp(v, LEFT_MIN, LEFT_MAX) : 280;
  });

  const [rightW, setRightW] = useState(() => {
    const v = Number(localStorage.getItem(LS_RIGHT));
    return Number.isFinite(v) ? clamp(v, RIGHT_MIN, RIGHT_MAX) : 420;
  });

  const [rightOpen, setRightOpen] = useState(() => {
    const v = localStorage.getItem(LS_RIGHT_OPEN);
    return v === null ? true : v === '1';
  });

  useEffect(() => localStorage.setItem(LS_LEFT, String(leftW)), [leftW]);
  useEffect(() => localStorage.setItem(LS_RIGHT, String(rightW)), [rightW]);
  useEffect(() => localStorage.setItem(LS_RIGHT_OPEN, rightOpen ? '1' : '0'), [rightOpen]);

  // dialogs
  const [createMapOpen, setCreateMapOpen] = useState(false);
  const [createNoteOpen, setCreateNoteOpen] = useState(false);
  const [mapDeleteOpen, setMapDeleteOpen] = useState(false);

  // right panel
  const [rightTab, setRightTab] = useState<RightTab>('inspector');

  // map ui
  const [showLabels, setShowLabels] = useState(false);

  // inspector selection
  const [inspectedMarker, setInspectedMarker] = useState<MarkerDTO | null>(null);

  // Marker dialog state
  const [markerDialogOpen, setMarkerDialogOpen] = useState(false);
  const [markerDialogMode, setMarkerDialogMode] = useState<'create' | 'edit'>('create');
  const [draftPos, setDraftPos] = useState<{ x: number; y: number } | null>(null);
  const [editingMarker, setEditingMarker] = useState<MarkerDTO | null>(null);

  // optimistic positions during drag (NEW)
  const [dragPositions, setDragPositions] = useState<Record<string, { x: number; y: number }>>({});

  // load project data
  useEffect(() => {
    if (!pid) return;
    setCurrentProjectId(pid);
    loadMaps(pid);
    loadNotes(pid);
  }, [pid, setCurrentProjectId, loadMaps, loadNotes]);

  // sync URL mapId -> store currentMapId, and if no mapId -> redirect to first map
  useEffect(() => {
    if (!pid) return;
    if (!maps.length) return;

    if (mapId) {
      const exists = maps.some((m) => m.id === mapId);
      if (exists) {
        setCurrentMapId(mapId);
      } else {
        nav(`/projects/${pid}/maps/${maps[0].id}`, { replace: true });
      }
    } else {
      nav(`/projects/${pid}/maps/${maps[0].id}`, { replace: true });
    }
  }, [pid, maps, mapId, setCurrentMapId, nav]);

  const currentMap = useMemo(() => maps.find((m) => m.id === currentMapId) ?? null, [maps, currentMapId]);

  // load markers for current map
  useEffect(() => {
    if (!currentMapId) return;
    loadMarkers(currentMapId);
    setInspectedMarker(null);

    // при смене карты сбрасываем “drag overlay”, чтобы не протекал
    setDragPositions({});
  }, [currentMapId, loadMarkers]);

  const currentMarkers = useMemo(
    () => (currentMapId ? markersByMapId[currentMapId] ?? [] : []),
    [currentMapId, markersByMapId]
  );

  const visibleMarkers = useMemo(() => {
    if (!currentMapId) return [];
    return getVisibleMarkersForMap(currentMapId);
  }, [
    currentMapId,
    getVisibleMarkersForMap,
    currentMarkers,
    markerTypeVisibility,
    markerSearchQuery,
    markerOnlyLinked
  ]);

  // overlay drag positions (NEW)
  const markersForCanvas = useMemo(() => {
    if (!dragPositions || Object.keys(dragPositions).length === 0) return visibleMarkers;
    return visibleMarkers.map((m) => {
      const p = dragPositions[m.id];
      return p ? { ...m, x: p.x, y: p.y } : m;
    });
  }, [visibleMarkers, dragPositions]);

  // notes
  const selectedNote = useMemo(() => notes.find((n) => n.id === selectedNoteId) ?? null, [notes, selectedNoteId]);

  const noteContent = selectedNoteId ? noteContentById[selectedNoteId] ?? '' : '';
  const noteLoading = selectedNoteId ? noteContentLoadingById[selectedNoteId] ?? false : false;

  useEffect(() => {
    if (!selectedNoteId) return;
    if (noteContentById[selectedNoteId] === undefined) {
      loadNoteContent(selectedNoteId);
    }
  }, [selectedNoteId, noteContentById, loadNoteContent]);

  useEffect(() => {
    if (selectedNoteId) {
      setRightOpen(true);
      setRightTab('notes');
    }
  }, [selectedNoteId]);

  const crumbs = useMemo(() => buildBreadcrumbs(maps, currentMapId), [maps, currentMapId]);
  const parentMapId = currentMap?.parent_map_id ?? null;

  const toggleTheme = () => {
    const fn = (window as any).__toggleTheme as undefined | (() => void);
    if (fn) fn();
  };
  const themeMode = ((window as any).__themeMode as 'light' | 'dark' | undefined) ?? 'light';

  const handleMarkerMove = useCallback((markerId: string, pos: { x: number; y: number }) => {
    setDragPositions((s) => ({ ...s, [markerId]: pos }));
  }, []);

  const handleMarkerMoveEnd = useCallback(
    async (markerId: string, pos: { x: number; y: number }) => {
      await patchMarker(markerId, { x: pos.x, y: pos.y });

      setDragPositions((s) => {
        if (!s[markerId]) return s;
        const next = { ...s };
        delete next[markerId];
        return next;
      });
    },
    [patchMarker]
  );

  const toggleType = (t: MarkerType) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setMarkerTypeVisibility(t, e.target.checked);

  if (!pid) return null;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* AppBar (compact) */}
      <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
        <Toolbar variant="dense" sx={{ gap: 0.5 }}>
          <Button startIcon={<HomeIcon />} onClick={() => nav('/')}>
            Проекты
          </Button>
          <Button variant="text" onClick={() => nav(`/projects/${pid}/characters`)}>
            Персонажи
          </Button>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          <IconButton onClick={() => nav(-1)} aria-label="back" size="small">
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <IconButton onClick={() => nav(1)} aria-label="forward" size="small">
            <ArrowForwardIcon fontSize="small" />
          </IconButton>
          <IconButton
            onClick={() => parentMapId && nav(`/projects/${pid}/maps/${parentMapId}`)}
            disabled={!parentMapId}
            aria-label="up"
            size="small"
          >
            <ArrowUpwardIcon fontSize="small" />
          </IconButton>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          <Breadcrumbs aria-label="breadcrumb" sx={{ flex: 1, minWidth: 0 }}>
            {crumbs.map((c, idx) => {
              const isLast = idx === crumbs.length - 1;
              return isLast ? (
                <Typography key={c.id} color="text.primary" noWrap>
                  {c.title}
                </Typography>
              ) : (
                <MUILink
                  key={c.id}
                  underline="hover"
                  color="inherit"
                  noWrap
                  sx={{ cursor: 'pointer' }}
                  onClick={() => nav(`/projects/${pid}/maps/${c.id}`)}
                >
                  {c.title}
                </MUILink>
              );
            })}
          </Breadcrumbs>

          <IconButton onClick={toggleTheme} aria-label="toggle theme" size="small">
            {themeMode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </IconButton>

          <IconButton
            onClick={() => setRightOpen((v) => !v)}
            aria-label="toggle right panel"
            size="small"
            sx={{ ml: 0.5 }}
          >
            {rightOpen ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Body with resizable panels */}
      <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Left panel */}
        <Box
          sx={{
            width: leftW,
            minWidth: LEFT_MIN,
            maxWidth: LEFT_MAX,
            borderRight: '1px solid rgba(0,0,0,0.12)',
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0
          }}
        >
          <Box sx={{ p: 1.5 }}>
            <Typography variant="subtitle1">Карты</Typography>
            <Button fullWidth variant="contained" size="small" sx={{ mt: 1 }} onClick={() => setCreateMapOpen(true)}>
              + Карта
            </Button>
          </Box>

          <Divider />

          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <MapsTree maps={maps} selectedMapId={currentMapId} onSelectMap={(id) => nav(`/projects/${pid}/maps/${id}`)} />

            <Divider sx={{ my: 1 }} />

            <Box sx={{ px: 1.5, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              <Typography variant="subtitle1">Заметки</Typography>
              <Button size="small" variant="contained" onClick={() => setCreateNoteOpen(true)}>
                +
              </Button>
            </Box>

            <NotesList notes={notes} selectedNoteId={selectedNoteId} onSelect={(id) => openNote(id)} />

            {notesLoading && (
              <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 2 }}>
                Загрузка…
              </Typography>
            )}
          </Box>
        </Box>

        {/* Left splitter */}
        <Splitter ariaLabel="Resize left panel" requireKey="Shift" onDrag={(dx) => setLeftW((w) => clamp(w + dx, LEFT_MIN, LEFT_MAX))} />

        {/* Center map area */}
        <Box sx={{ flex: 1, p: 1.5, minWidth: 0, overflow: 'hidden' }}>
          <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Typography variant="subtitle1" noWrap>
              {currentMap ? currentMap.title : 'Выберите карту'}
            </Typography>

            <Button color="error" variant="outlined" size="small" disabled={!currentMap} onClick={() => setMapDeleteOpen(true)}>
              Удалить
            </Button>
          </Box>

          {/* Filters/search row (NEW) */}
          <Box sx={{ mb: 1, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              label="Поиск маркеров"
              value={markerSearchQuery}
              onChange={(e) => setMarkerSearchQuery(e.target.value)}
              sx={{ minWidth: 260, flex: '1 1 260px' }}
            />

            <FormControlLabel
              control={<Checkbox size="small" checked={markerTypeVisibility.location} onChange={toggleType('location')} />}
              label="Локации"
            />
            <FormControlLabel
              control={<Checkbox size="small" checked={markerTypeVisibility.event} onChange={toggleType('event')} />}
              label="События"
            />
            <FormControlLabel
              control={<Checkbox size="small" checked={markerTypeVisibility.character} onChange={toggleType('character')} />}
              label="Персонажи"
            />

            <FormControlLabel
              control={<Checkbox size="small" checked={markerOnlyLinked} onChange={(e) => setMarkerOnlyLinked(e.target.checked)} />}
              label="Только со ссылкой"
            />

            <Button size="small" variant="outlined" onClick={resetMarkerFilters}>
              Сброс
            </Button>

            <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
              Показано: {markersForCanvas.length}
            </Typography>
          </Box>

          <Box sx={{ height: 'calc(100% - 34px - 56px)' }}>
            {currentMap ? (
              <MapCanvas
                mapId={currentMap.id}
                markers={markersForCanvas}
                showLabels={showLabels}
                onToggleLabels={() => setShowLabels((v) => !v)}
                onMapClick={(pos) => {
                  setDraftPos(pos);
                  setEditingMarker(null);
                  setMarkerDialogMode('create');
                  setMarkerDialogOpen(true);
                }}
                onMarkerClick={(m, e) => {
                  if (e.shiftKey) {
                    setInspectedMarker(m);
                    setRightOpen(true);
                    setRightTab('inspector');
                    return;
                  }

                  if (m.link_type === 'note' && m.link_note_id) {
                    openNote(m.link_note_id);
                    return;
                  }
                  if (m.link_type === 'map' && m.link_map_id) {
                    nav(`/projects/${pid}/maps/${m.link_map_id}`);
                    return;
                  }

                  setInspectedMarker(m);
                  setRightOpen(true);
                  setRightTab('inspector');
                }}
                onMarkerDoubleClick={(m) => {
                  setInspectedMarker(m);
                  setRightOpen(true);
                  setRightTab('inspector');

                  setEditingMarker(m);
                  setDraftPos({ x: m.x, y: m.y });
                  setMarkerDialogMode('edit');
                  setMarkerDialogOpen(true);
                }}
                onMarkerContextMenu={(m) => {
                  setInspectedMarker(m);
                  setRightOpen(true);
                  setRightTab('inspector');
                }}
                onMarkerMove={handleMarkerMove}
                onMarkerMoveEnd={handleMarkerMoveEnd}
              />
            ) : (
              <Typography color="text.secondary">Добавьте карту или выберите существующую.</Typography>
            )}
          </Box>
        </Box>

        {/* Right panel + splitter (only when open) */}
        {rightOpen && (
          <>
            <Splitter ariaLabel="Resize right panel" requireKey="Shift" onDrag={(dx) => setRightW((w) => clamp(w - dx, RIGHT_MIN, RIGHT_MAX))} />

            <Box
              sx={{
                width: rightW,
                minWidth: RIGHT_MIN,
                maxWidth: RIGHT_MAX,
                borderLeft: '1px solid rgba(0,0,0,0.12)',
                bgcolor: 'background.paper',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0
              }}
            >
              <Box sx={{ px: 1.5, pt: 1 }}>
                <Tabs value={rightTab} onChange={(_e, v) => setRightTab(v)} variant="fullWidth">
                  <Tab value="inspector" label="Инспектор" />
                  <Tab value="notes" label="Заметки" />
                </Tabs>
              </Box>

              <Divider />

              <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                {rightTab === 'notes' ? (
                  <NoteEditorPanel
                    note={selectedNote}
                    content={noteContent}
                    loading={noteLoading}
                    onClose={() => openNote(null)}
                    onChange={(next) => {
                      if (!selectedNoteId) return;
                      setNoteDraftContent(selectedNoteId, next);
                    }}
                    onSave={async () => {
                      if (!selectedNoteId) return;
                      const latest = noteContentById[selectedNoteId] ?? '';
                      await saveNoteContent(selectedNoteId, latest);
                    }}
                    onDelete={async () => {
                      if (!selectedNoteId) return;
                      await deleteNote(selectedNoteId, pid);
                    }}
                  />
                ) : (
                  <InspectorPanel
                    mapTitle={currentMap?.title ?? null}
                    parentTitle={parentMapId ? maps.find((m) => m.id === parentMapId)?.title ?? null : null}
                    markerCount={currentMarkers.length}
                    inspectedMarker={inspectedMarker}
                    onClearMarker={() => setInspectedMarker(null)}
                    onEditMarker={() => {
                      if (!inspectedMarker) return;
                      setEditingMarker(inspectedMarker);
                      setDraftPos({ x: inspectedMarker.x, y: inspectedMarker.y });
                      setMarkerDialogMode('edit');
                      setMarkerDialogOpen(true);
                    }}
                    onOpenLinked={() => {
                      if (!inspectedMarker) return;
                      if (inspectedMarker.link_type === 'note' && inspectedMarker.link_note_id) {
                        openNote(inspectedMarker.link_note_id);
                        setRightTab('notes');
                        return;
                      }
                      if (inspectedMarker.link_type === 'map' && inspectedMarker.link_map_id) {
                        nav(`/projects/${pid}/maps/${inspectedMarker.link_map_id}`);
                        return;
                      }
                    }}
                  />
                )}
              </Box>
            </Box>
          </>
        )}
      </Box>

      {/* Dialogs */}
      <CreateMapDialog
        open={createMapOpen}
        onClose={() => setCreateMapOpen(false)}
        projectId={pid}
        maps={maps}
        onCreated={(newMapId) => nav(`/projects/${pid}/maps/${newMapId}`)}
      />

      <CreateNoteDialog
        open={createNoteOpen}
        onClose={() => setCreateNoteOpen(false)}
        onCreate={async (input) => {
          await createNote(pid, input);
        }}
      />

      <MarkerDialog
        open={markerDialogOpen}
        mode={markerDialogMode}
        projectId={pid}
        defaultParentMapId={currentMapId}
        notes={notes}
        maps={maps}
        onCreateLinkedNote={async (input) => {
          return await createNoteSilent(pid, input);
        }}
        onCreateLinkedMap={async (input) => {
          return await useAppStore.getState().createMap(pid, input);
        }}
        initial={
          markerDialogMode === 'create'
            ? draftPos
              ? { x: draftPos.x, y: draftPos.y }
              : undefined
            : editingMarker
              ? { ...editingMarker, x: editingMarker.x, y: editingMarker.y }
              : undefined
        }
        onClose={() => setMarkerDialogOpen(false)}
        onCreate={async (payload) => {
          if (!currentMapId) return;
          await createMarker(currentMapId, payload);
        }}
        onSave={async (patch) => {
          if (!editingMarker) return;
          await patchMarker(editingMarker.id, patch);
        }}
        onDelete={async () => {
          if (!editingMarker) return;
          await deleteMarker(editingMarker.id, editingMarker.map_id);
        }}
      />

      {/* Confirm delete map */}
      <Dialog open={mapDeleteOpen} onClose={() => setMapDeleteOpen(false)}>
        <DialogTitle>Удалить карту?</DialogTitle>
        <DialogContent>
          Будут удалены все маркеры на этой карте. Ссылки маркеров на эту карту будут отвязаны. Файл карты будет удалён с
          диска. Действие необратимо.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMapDeleteOpen(false)}>Отмена</Button>
          <Button
            color="error"
            onClick={async () => {
              if (!currentMap) return;

              const fallbackId =
                currentMap.parent_map_id && maps.some((m) => m.id === currentMap.parent_map_id)
                  ? currentMap.parent_map_id
                  : maps.find((m) => m.id !== currentMap.id)?.id ?? null;

              await deleteMap(pid, currentMap.id);

              if (fallbackId) nav(`/projects/${pid}/maps/${fallbackId}`, { replace: true });
              else nav(`/projects/${pid}`, { replace: true });

              setMapDeleteOpen(false);
            }}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function InspectorPanel(props: {
  mapTitle: string | null;
  parentTitle: string | null;
  markerCount: number;

  inspectedMarker: MarkerDTO | null;
  onClearMarker: () => void;
  onEditMarker: () => void;
  onOpenLinked: () => void;
}) {
  const { mapTitle, parentTitle, markerCount, inspectedMarker, onClearMarker, onEditMarker, onOpenLinked } = props;

  if (inspectedMarker) {
    const md = inspectedMarker.description?.trim() ? inspectedMarker.description : '_Описание отсутствует._';

    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Маркер
        </Typography>

        <Typography variant="body1" sx={{ fontWeight: 700 }}>
          {inspectedMarker.title}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          {inspectedMarker.marker_type} · {inspectedMarker.color}
        </Typography>

        <Box
          sx={{
            mt: 1,
            p: 1.25,
            border: '1px solid rgba(0,0,0,0.12)',
            borderRadius: 1,
            '& p': { m: 0 },
            '& ul, & ol': { m: 0, pl: 2.5 },
            '& code': { fontFamily: 'monospace' }
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
            {md}
          </ReactMarkdown>
        </Box>

        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="contained" size="small" onClick={onEditMarker}>
            Редактировать
          </Button>

          <Button variant="outlined" size="small" disabled={!inspectedMarker.link_type} onClick={onOpenLinked}>
            Открыть link
          </Button>

          <Button variant="text" size="small" onClick={onClearMarker}>
            Снять выбор
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Карта
      </Typography>

      <Typography variant="body1" sx={{ fontWeight: 700 }}>
        {mapTitle ?? '—'}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        Родитель: {parentTitle ?? '—'}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        Маркеров на карте: {markerCount}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Подсказка: ПКМ/Shift+клик — выбрать маркер. Двойной клик — редактировать.
      </Typography>
    </Box>
  );
}
