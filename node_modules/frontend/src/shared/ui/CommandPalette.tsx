import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Divider,
  InputBase,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Popover,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../app/store';

type Cmd = {
  id: string;
  title: string;
  subtitle?: string;
  keywords?: string;
  run: () => void | Promise<void>;
};

function norm(s: string) {
  return s.trim().toLowerCase();
}

function score(haystack: string, needle: string): number {
  const q = norm(needle);
  if (!q) return 1;

  const h = norm(haystack);
  const parts = q.split(/\s+/).filter(Boolean);
  let total = 0;

  for (const p of parts) {
    const idx = h.indexOf(p);
    if (idx === -1) return 0;
    total += Math.max(1, 200 - idx);
  }

  return total;
}

export function CommandPalette() {
  const navigate = useNavigate();

  const projects = useAppStore((s) => s.projects);
  const projectsLoading = useAppStore((s) => s.projectsLoading);
  const maps = useAppStore((s) => s.maps);
  const notes = useAppStore((s) => s.notes);

  const currentProjectId = useAppStore((s) => s.currentProjectId);

  const loadProjects = useAppStore((s) => s.loadProjects);
  const loadMaps = useAppStore((s) => s.loadMaps);
  const loadNotes = useAppStore((s) => s.loadNotes);

  const openNote = useAppStore((s) => s.openNote);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const anchorRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Hotkey
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes('mac');
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (mod && e.code === 'KeyK') {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }

      if (!open) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((a) => a + 1);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        // выполняем ниже (в onEnter), чтобы учитывался clamp по длине
        return;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // When opened: ensure data is present + focus
  useEffect(() => {
    if (!open) return;

    setQuery('');
    setActive(0);

    // подгрузим проекты (если пусто)
    if (!projectsLoading && projects.length === 0) {
      void loadProjects();
    }

    // если мы внутри проекта — подгрузим карты/заметки для команд
    if (currentProjectId) {
      if (maps.length === 0) void loadMaps(currentProjectId);
      if (notes.length === 0) void loadNotes(currentProjectId);
    }

    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [
    open,
    projects.length,
    projectsLoading,
    loadProjects,
    currentProjectId,
    maps.length,
    notes.length,
    loadMaps,
    loadNotes,
  ]);

  const commands: Cmd[] = useMemo(() => {
    const cmds: Cmd[] = [];

    cmds.push({
      id: 'reload-projects',
      title: 'Обновить: проекты',
      subtitle: 'Перезагрузить список проектов',
      keywords: 'reload refresh projects проекты',
      run: async () => {
        await loadProjects();
      },
    });

    cmds.push({
      id: 'go-home',
      title: 'Перейти: проекты (главная)',
      subtitle: '/',
      keywords: 'home проекты главная',
      run: () => navigate('/'),
    });

    for (const p of projects) {
      cmds.push({
        id: `project:${p.id}`,
        title: p.name,
        subtitle: `Проект • ${p.path ?? ''}`,
        keywords: `project проект ${p.name} ${p.path ?? ''} ${p.system ?? ''}`,
        run: () => navigate(`/projects/${p.id}`),
      });
    }

    if (currentProjectId) {
      for (const m of maps) {
        cmds.push({
          id: `map:${m.id}`,
          title: m.title ?? 'Без названия',
          subtitle: 'Карта',
          keywords: `map карта ${m.title ?? ''}`,
          run: () => navigate(`/projects/${currentProjectId}/maps/${m.id}`),
        });
      }

      for (const n of notes) {
        cmds.push({
          id: `note:${n.id}`,
          title: n.title ?? 'Без названия',
          subtitle: 'Заметка',
          keywords: `note заметка ${n.title ?? ''} ${n.type ?? ''}`,
          run: () => {
            // ВАЖНО: это ваш “правильный” путь открытия заметки:
            // открываем note в store — workspace сам раскроет правую панель.
            openNote(n.id);
            navigate(`/projects/${currentProjectId}`);
          },
        });
      }
    }

    return cmds;
  }, [projects, currentProjectId, maps, notes, loadProjects, navigate, openNote]);

  const filtered = useMemo(() => {
    const scored = commands
      .map((c) => {
        const hay = `${c.title}\n${c.subtitle ?? ''}\n${c.keywords ?? ''}`;
        return { c, s: score(hay, query) };
      })
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 14)
      .map((x) => x.c);

    return scored;
  }, [commands, query]);

  const activeClamped = Math.min(active, Math.max(0, filtered.length - 1));

  // Enter handling (needs filtered + activeClamped)
  useEffect(() => {
    if (!open) return;

    const onEnter = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();

      const cmd = filtered[activeClamped];
      if (!cmd) return;

      setOpen(false);
      void cmd.run();
    };

    window.addEventListener('keydown', onEnter);
    return () => window.removeEventListener('keydown', onEnter);
  }, [open, filtered, activeClamped]);

  // reset active on query change
  useEffect(() => {
    if (!open) return;
    setActive(0);
  }, [query, open]);

  return (
    <>
      <Box
        ref={anchorRef}
        sx={{
          position: 'fixed',
          left: '50%',
          top: '18%',
          width: 0,
          height: 0,
          zIndex: 1300,
          pointerEvents: 'none',
        }}
      />

      <Popover
        open={open}
        onClose={() => setOpen(false)}
        anchorEl={anchorRef.current}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        PaperProps={{
          sx: (theme) => ({
            width: 'min(760px, calc(100vw - 24px))',
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.10)',
            background:
              theme.palette.mode === 'dark'
                ? 'linear-gradient(180deg, rgba(18,20,26,0.92), rgba(12,14,18,0.92))'
                : 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(250,250,252,0.92))',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 20px 70px rgba(0,0,0,0.35)',
          }),
        }}
      >
        <Paper elevation={0} sx={{ p: 1.25 }}>
          <Box sx={{ px: 0.75, pb: 1 }}>
            <Typography variant="caption" sx={{ display: 'block', opacity: 0.7, mb: 0.75 }}>
              Ctrl+K / Cmd+K • Enter — выбрать • Esc — закрыть
            </Typography>

            <InputBase
              inputRef={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={currentProjectId ? 'Проект / карта / заметка…' : 'Проект…'}
              sx={(theme) => ({
                width: '100%',
                px: 1.25,
                py: 1,
                borderRadius: 1.5,
                border: '1px solid rgba(255,255,255,0.10)',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.20)' : 'rgba(0,0,0,0.04)',
                fontSize: '1rem',
              })}
            />
          </Box>

          <Divider sx={{ opacity: 0.5 }} />

          <List dense sx={{ py: 0.5 }}>
            {filtered.length === 0 ? (
              <Box sx={{ px: 1.25, py: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Ничего не найдено.
                </Typography>
              </Box>
            ) : (
              filtered.map((cmd, idx) => (
                <ListItemButton
                  key={cmd.id}
                  selected={idx === activeClamped}
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => {
                    setOpen(false);
                    void cmd.run();
                  }}
                  sx={{
                    borderRadius: 1.5,
                    my: 0.25,
                    '&.Mui-selected': { backgroundColor: 'rgba(120,140,255,0.18)' },
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography
                        sx={{
                          fontFamily: '"IBM Plex Serif", ui-serif, Georgia, serif',
                          fontWeight: 600,
                        }}
                      >
                        {cmd.title}
                      </Typography>
                    }
                    secondary={
                      cmd.subtitle ? (
                        <Typography variant="caption" sx={{ opacity: 0.75 }}>
                          {cmd.subtitle}
                        </Typography>
                      ) : null
                    }
                  />
                </ListItemButton>
              ))
            )}
          </List>
        </Paper>
      </Popover>
    </>
  );
}
