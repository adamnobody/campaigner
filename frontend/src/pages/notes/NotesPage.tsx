import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, IconButton, InputAdornment, MenuItem, Select, TextField, Typography, alpha, useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import TvOutlinedIcon from '@mui/icons-material/TvOutlined';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNoteStore } from '@/store/useNoteStore';
import { useWikiStore } from '@/store/useWikiStore';
import { useCharacterStore } from '@/store/useCharacterStore';
import { useTimelineStore } from '@/store/useTimelineStore';
import { useBranchStore } from '@/store/useBranchStore';
import { useUIStore } from '@/store/useUIStore';
import { useDebounce } from '@/hooks/useDebounce';
import { DndButton } from '@/components/ui/DndButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { CatalogAside, CatalogLayout } from '@/components/catalog/CatalogLayout';
import { DocChip } from '@/components/document-editor/DocChip';
import { parseDocument, serializeDocument, type NoteKind } from '@/components/document-editor/documentMeta';
import { formatRelativeTime } from '@/utils/relativeTime';
import { getPlainPreviewText } from '@/pages/wiki/components/wikiPreviewText';

const FILTERS: Array<'all' | NoteKind> = ['all', 'idea', 'scene', 'question'];

export const NotesPage: React.FC = () => {
  const { t, i18n } = useTranslation(['notes', 'common', 'wiki', 'navigation']);
  const { projectId } = useParams<{ projectId: string }>();
  const pid = Number.parseInt(projectId!, 10);
  const navigate = useNavigate();
  const theme = useTheme();
  const { notes, loading, fetchNotes, createNote } = useNoteStore();
  const fetchLinks = useWikiStore((state) => state.fetchLinks);
  const fetchCharacters = useCharacterStore((state) => state.fetchCharacters);
  const characters = useCharacterStore((state) => state.characters);
  const fetchEvents = useTimelineStore((state) => state.fetchEvents);
  const events = useTimelineStore((state) => state.events);
  const showSnackbar = useUIStore((state) => state.showSnackbar);
  const activeBranchId = useBranchStore((state) => state.activeBranchId);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | NoteKind>('all');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [grid, setGrid] = useState(true);
  const [creating, setCreating] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    void fetchNotes(pid, { search: debouncedSearch || undefined, limit: 500 });
  }, [activeBranchId, debouncedSearch, fetchNotes, pid]);

  useEffect(() => {
    void fetchLinks(pid);
    void fetchCharacters(pid);
    void fetchEvents(pid);
  }, [activeBranchId, fetchCharacters, fetchEvents, fetchLinks, pid]);

  const entries = useMemo(() => {
    const list = notes.filter((note) => note.noteType !== 'wiki');
    const filtered = list.filter((note) => {
      if (filter === 'all') return true;
      return (parseDocument(note.content).meta.kind ?? 'note') === filter;
    });
    filtered.sort((a, b) => {
      const delta = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      return sort === 'newest' ? -delta : delta;
    });
    return filtered;
  }, [filter, notes, sort]);

  const noteList = notes.filter((note) => note.noteType !== 'wiki');
  const wikiCount = notes.filter((note) => note.noteType === 'wiki').length;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const summary = {
    total: noteList.length,
    week: noteList.filter((note) => new Date(note.updatedAt).getTime() >= weekAgo).length,
    questions: noteList.filter((note) => parseDocument(note.content).meta.kind === 'question').length,
    untagged: noteList.filter((note) => !note.tags?.length).length,
  };
  const trulyEmpty = noteList.length === 0 && !search && filter === 'all';

  const createAndOpen = async (kind: NoteKind = 'note') => {
    if (creating) return;
    setCreating(true);
    try {
      const note = await createNote({
        projectId: pid,
        title: t('notes:untitled'),
        content: serializeDocument({ kind }, ''),
        format: 'md',
        noteType: 'note',
        isPinned: false,
      });
      navigate(`/project/${pid}/notes/${note.id}`);
    } catch {
      showSnackbar(t('notes:snackbar.createError'), 'error');
      setCreating(false);
    }
  };

  if (loading && notes.length === 0) return <LoadingScreen />;

  return (
    <CatalogLayout
      eyebrow={t('notes:list.eyebrow', { count: noteList.length })}
      title={t('notes:list.title')}
      subtitle={t('notes:list.subtitle')}
      hasItems={entries.length > 0}
      actions={(
        <DndButton variant="contained" startIcon={<AddIcon />} loading={creating} onClick={() => { void createAndOpen(); }}>
          {t('notes:list.newNote')}
        </DndButton>
      )}
      toolbar={(
        <>
          <TextField
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('notes:list.searchPlaceholder')}
            sx={{ flexGrow: 1, maxWidth: 400 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment> }}
          />
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {FILTERS.map((item) => (
              <DocChip
                key={item}
                active={filter === item}
                label={item === 'all' ? t('notes:list.filterAll') : t(`notes:kinds.${item}`)}
                onClick={() => setFilter(item)}
              />
            ))}
          </Box>
          <Select size="small" value={sort} onChange={(event) => setSort(event.target.value as 'newest' | 'oldest')} sx={{ height: 34, fontSize: 12.5, minWidth: 170 }}>
            <MenuItem value="newest">{t('notes:list.sortNewest')}</MenuItem>
            <MenuItem value="oldest">{t('notes:list.sortOldest')}</MenuItem>
          </Select>
          <IconButton size="small" onClick={() => setGrid(true)} aria-label={t('notes:list.viewGrid')} sx={{ color: grid ? 'primary.main' : 'text.disabled' }}>
            <ViewModuleIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => setGrid(false)} aria-label={t('notes:list.viewList')} sx={{ color: !grid ? 'primary.main' : 'text.disabled' }}>
            <ViewListIcon fontSize="small" />
          </IconButton>
          <Typography variant="body2" sx={{ color: 'text.secondary', ml: 'auto' }}>
            {t('notes:list.count', { shown: entries.length, total: noteList.length })}
          </Typography>
        </>
      )}
      aside={(
        <CatalogAside
          summaryTitle={t('common:catalog.summary')}
          summary={[
            { label: t('notes:list.summaryTotal'), value: summary.total },
            { label: t('notes:list.summaryWeek'), value: summary.week },
            { label: t('notes:list.summaryQuestions'), value: summary.questions },
            { label: t('notes:list.summaryUntagged'), value: summary.untagged },
          ]}
          storedTitle={t('common:catalog.storedTitle')}
          storedBody={t('notes:list.storedBody')}
          linkedTitle={t('common:catalog.linkedTitle')}
          linked={[
            { label: t('navigation:menu.wiki'), value: wikiCount },
            { label: t('navigation:menu.timeline'), value: events.length },
            { label: t('navigation:menu.characters'), value: characters.length },
          ]}
        />
      )}
    >
      {entries.length === 0 ? (
        trulyEmpty ? (
          <EmptyState
            icon={<DescriptionIcon sx={{ fontSize: 64 }} />}
            title={t('notes:list.emptyNoNotesTitle')}
            description={t('notes:list.emptyNoNotesDescription')}
            actionLabel={t('notes:list.newNote')}
            onAction={() => { void createAndOpen(); }}
            templatesTitle={t('notes:list.templates.title')}
            templates={[
              {
                icon: <LightbulbOutlinedIcon />,
                title: t('notes:list.templates.idea.title'),
                description: t('notes:list.templates.idea.description'),
                onClick: () => { void createAndOpen('idea'); },
              },
              {
                icon: <TvOutlinedIcon />,
                title: t('notes:list.templates.scene.title'),
                description: t('notes:list.templates.scene.description'),
                onClick: () => { void createAndOpen('scene'); },
              },
              {
                icon: <HelpOutlineIcon />,
                title: t('notes:list.templates.question.title'),
                description: t('notes:list.templates.question.description'),
                onClick: () => { void createAndOpen('question'); },
              },
            ]}
          />
        ) : (
          <EmptyState
            icon={<SearchIcon />}
            title={t('notes:list.emptyFilteredTitle')}
            description={t('notes:list.emptyFilteredDescription')}
          />
        )
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: grid ? { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' } : '1fr',
            gap: 1.5,
          }}
        >
          {entries.map((note) => {
            const kind = parseDocument(note.content).meta.kind ?? 'note';
            return (
              <Box
                key={note.id}
                onClick={() => navigate(`/project/${pid}/notes/${note.id}`)}
                sx={{
                  p: 2.25,
                  borderRadius: '14px',
                  border: `1px solid ${theme.campaigner.surface.border}`,
                  backgroundColor: theme.campaigner.surface.subtle,
                  cursor: 'pointer',
                  minWidth: 0,
                  '&:hover': { borderColor: alpha(theme.palette.primary.main, 0.35) },
                }}
              >
                <Typography sx={{ fontWeight: 600, fontSize: '1.02rem', pb: 0.75 }}>{note.title}</Typography>
                <Typography
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.84rem',
                    lineHeight: 1.55,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: grid ? 62 : 0,
                  }}
                >
                  {getPlainPreviewText(note.content)}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 1, pt: 1.5 }}>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {kind !== 'note' ? <DocChip muted label={t(`notes:kinds.${kind}`)} /> : null}
                    {(note.tags ?? []).slice(0, 3).map((tag) => (
                      <DocChip key={tag.id} muted label={tag.name} />
                    ))}
                  </Box>
                  <Typography sx={{ color: 'text.disabled', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                    {formatRelativeTime(note.updatedAt, i18n.language)}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </CatalogLayout>
  );
};
