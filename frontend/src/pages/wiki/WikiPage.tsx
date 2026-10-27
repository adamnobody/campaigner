import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, IconButton, InputAdornment, MenuItem, Select, TextField, Typography, alpha, useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNoteStore } from '@/store/useNoteStore';
import { useWikiStore } from '@/store/useWikiStore';
import { useCharacterStore } from '@/store/useCharacterStore';
import { useFactionStore } from '@/store/useFactionStore';
import { useBranchStore } from '@/store/useBranchStore';
import { useUIStore } from '@/store/useUIStore';
import { useDebounce } from '@/hooks/useDebounce';
import { DndButton } from '@/components/ui/DndButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { CatalogAside, CatalogLayout } from '@/components/catalog/CatalogLayout';
import { DocChip } from '@/components/document-editor/DocChip';
import { parseDocument, serializeDocument } from '@/components/document-editor/documentMeta';
import { formatRelativeTime } from '@/utils/relativeTime';
import { routes } from '@/utils/routes';
import { getPlainPreviewText } from '@/pages/wiki/components/wikiPreviewText';

const BUILTIN_CATEGORIES = ['location', 'item', 'phenomenon'] as const;

function articleCategory(content: string, tags: Array<{ name: string }> | undefined): string {
  const meta = parseDocument(content).meta.category;
  if (meta) return meta;
  const tag = tags?.[0]?.name;
  return tag || '';
}

export const WikiPage: React.FC = () => {
  const { t, i18n } = useTranslation(['wiki', 'common', 'navigation']);
  const { projectId } = useParams<{ projectId: string }>();
  const pid = Number.parseInt(projectId!, 10);
  const navigate = useNavigate();
  const theme = useTheme();
  const { notes, loading, fetchNotes, createNote } = useNoteStore();
  const { links, fetchLinks } = useWikiStore();
  const fetchCharacters = useCharacterStore((state) => state.fetchCharacters);
  const characters = useCharacterStore((state) => state.characters);
  const fetchFactions = useFactionStore((state) => state.fetchFactions);
  const factions = useFactionStore((state) => state.factions);
  const showSnackbar = useUIStore((state) => state.showSnackbar);
  const activeBranchId = useBranchStore((state) => state.activeBranchId);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [grid, setGrid] = useState(false);
  const [creating, setCreating] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    void fetchNotes(pid, { noteType: 'wiki', search: debouncedSearch || undefined, limit: 500 });
    void fetchLinks(pid);
  }, [activeBranchId, debouncedSearch, fetchLinks, fetchNotes, pid]);

  useEffect(() => {
    void fetchCharacters(pid);
    void fetchFactions(pid);
  }, [activeBranchId, fetchCharacters, fetchFactions, pid]);

  const articles = useMemo(() => {
    const list = notes.filter((note) => {
      if (!filter) return true;
      return articleCategory(note.content, note.tags) === filter;
    });
    list.sort((a, b) => {
      const delta = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      return sort === 'newest' ? -delta : delta;
    });
    return list;
  }, [filter, notes, sort]);

  const grouped = useMemo(() => {
    const buckets = new Map<string, typeof articles>();
    for (const article of articles) {
      const key = articleCategory(article.content, article.tags) || 'uncategorized';
      const bucket = buckets.get(key) ?? [];
      bucket.push(article);
      buckets.set(key, bucket);
    }
    return [...buckets.entries()];
  }, [articles]);

  const drafts = notes.filter((note) => (parseDocument(note.content).meta.status ?? 'draft') === 'draft').length;
  const linkedCount = notes.filter((note) => links.some((link) => link.sourceNoteId === note.id || link.targetNoteId === note.id)).length;
  const categoryCount = new Set(notes.map((note) => articleCategory(note.content, note.tags)).filter(Boolean)).size;
  const trulyEmpty = notes.length === 0 && !search && !filter;

  const createAndOpen = async (category?: string) => {
    if (creating) return;
    setCreating(true);
    try {
      const note = await createNote({
        projectId: pid,
        title: t('wiki:untitled'),
        content: serializeDocument({
          status: 'draft',
          category,
          infobox: [
            { key: t('wiki:editor.infoboxWhere'), value: '' },
            { key: t('wiki:editor.infoboxStart'), value: '' },
            { key: t('wiki:editor.infoboxArea'), value: '' },
          ],
        }, ''),
        format: 'md',
        noteType: 'wiki',
        isPinned: false,
      });
      navigate(`/project/${pid}/wiki/${note.id}`);
    } catch {
      showSnackbar(t('wiki:snackbar.createError'), 'error');
      setCreating(false);
    }
  };

  if (loading && notes.length === 0) return <LoadingScreen />;

  const renderArticle = (note: typeof articles[number]) => (
    <Box
      key={note.id}
      onClick={() => navigate(`/project/${pid}/wiki/${note.id}`)}
      sx={{
        display: 'grid',
        gridTemplateColumns: grid ? '1fr' : { xs: '1fr', md: 'minmax(0, 1fr) auto' },
        gap: 0.75,
        px: grid ? 2 : 0.5,
        py: grid ? 2 : 1.35,
        borderRadius: grid ? '14px' : 1,
        border: grid ? `1px solid ${theme.campaigner.surface.border}` : 'none',
        backgroundColor: grid ? theme.campaigner.surface.subtle : 'transparent',
        cursor: 'pointer',
        minWidth: 0,
        '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.05) },
      }}
    >
      <Box sx={{ minWidth: 0, display: 'flex', gap: 1.25, alignItems: 'baseline' }}>
        {!grid ? <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0, mt: '0.45em' }} /> : null}
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: 'primary.main', fontWeight: 600, fontSize: '0.98rem' }}>{note.title}</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem', pt: 0.25 }} noWrap>
            {getPlainPreviewText(note.content)}
          </Typography>
        </Box>
      </Box>
      <Typography sx={{ color: 'text.disabled', fontSize: '0.72rem', whiteSpace: 'nowrap', alignSelf: 'center' }}>
        {formatRelativeTime(note.updatedAt, i18n.language)}
      </Typography>
    </Box>
  );

  return (
    <CatalogLayout
      eyebrow={t('wiki:page.eyebrow', { count: notes.length })}
      title={t('wiki:page.title')}
      subtitle={t('wiki:page.subtitle')}
      hasItems={articles.length > 0}
      actions={(
        <>
          <DndButton variant="outlined" onClick={() => navigate(routes.wikiGraph(pid))} disabled={creating}>
            {t('wiki:page.linkArticles')}
          </DndButton>
          <DndButton variant="contained" startIcon={<AddIcon />} loading={creating} onClick={() => { void createAndOpen(); }}>
            {t('wiki:page.newArticle')}
          </DndButton>
        </>
      )}
      toolbar={(
        <>
          <TextField
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('wiki:page.searchPlaceholder')}
            sx={{ flexGrow: 1, maxWidth: 400 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment> }}
          />
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            <DocChip active={!filter} label={t('wiki:page.chipAll')} onClick={() => setFilter('')} />
            {BUILTIN_CATEGORIES.map((item) => (
              <DocChip
                key={item}
                active={filter === item}
                label={t(`wiki:categories.${item}`)}
                onClick={() => setFilter(filter === item ? '' : item)}
              />
            ))}
          </Box>
          <Select size="small" value={sort} onChange={(event) => setSort(event.target.value as 'newest' | 'oldest')} sx={{ height: 34, fontSize: 12.5, minWidth: 170 }}>
            <MenuItem value="newest">{t('wiki:page.sortNewest')}</MenuItem>
            <MenuItem value="oldest">{t('wiki:page.sortOldest')}</MenuItem>
          </Select>
          <IconButton size="small" onClick={() => setGrid(false)} aria-label={t('wiki:page.viewList')} sx={{ color: !grid ? 'primary.main' : 'text.disabled' }}>
            <ViewListIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => setGrid(true)} aria-label={t('wiki:page.viewGrid')} sx={{ color: grid ? 'primary.main' : 'text.disabled' }}>
            <ViewModuleIcon fontSize="small" />
          </IconButton>
          <Typography variant="body2" sx={{ color: 'text.secondary', ml: 'auto' }}>
            {t('wiki:page.count', { shown: articles.length, total: notes.length })}
          </Typography>
        </>
      )}
      aside={(
        <CatalogAside
          summaryTitle={t('common:catalog.summary')}
          summary={[
            { label: t('wiki:page.summaryArticles'), value: notes.length },
            { label: t('wiki:page.summaryCategories'), value: categoryCount },
            { label: t('wiki:page.summaryLinked'), value: linkedCount },
            { label: t('wiki:page.summaryDrafts'), value: drafts },
          ]}
          storedTitle={t('common:catalog.storedTitle')}
          storedBody={t('wiki:page.storedBody')}
          linkedTitle={t('common:catalog.linkedTitle')}
          linked={[
            { label: t('navigation:menu.characters'), value: characters.length },
            { label: t('navigation:menu.states'), value: factions.filter((item) => item.kind === 'state').length },
            { label: t('navigation:menu.graph'), value: links.length },
          ]}
        />
      )}
    >
      {articles.length === 0 ? (
        trulyEmpty ? (
          <EmptyState
            icon={<MenuBookIcon sx={{ fontSize: 64 }} />}
            title={t('wiki:empty.noWikiTitle')}
            description={t('wiki:empty.noWikiDescription')}
            actionLabel={t('wiki:page.newArticle')}
            onAction={() => { void createAndOpen(); }}
            templatesTitle={t('wiki:empty.templates.title')}
            templates={[
              {
                icon: <PlaceOutlinedIcon />,
                title: t('wiki:empty.templates.location.title'),
                description: t('wiki:empty.templates.location.description'),
                onClick: () => { void createAndOpen('location'); },
              },
              {
                icon: <Inventory2OutlinedIcon />,
                title: t('wiki:empty.templates.item.title'),
                description: t('wiki:empty.templates.item.description'),
                onClick: () => { void createAndOpen('item'); },
              },
              {
                icon: <AutoAwesomeIcon />,
                title: t('wiki:empty.templates.phenomenon.title'),
                description: t('wiki:empty.templates.phenomenon.description'),
                onClick: () => { void createAndOpen('phenomenon'); },
              },
            ]}
          />
        ) : (
          <EmptyState
            icon={<SearchIcon />}
            title={t('wiki:empty.filteredTitle')}
            description={t('wiki:empty.filteredDescription')}
          />
        )
      ) : grid ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
          {articles.map(renderArticle)}
        </Box>
      ) : (
        <Box>
          {grouped.map(([key, group]) => (
            <Box key={key} sx={{ pb: 2.5 }}>
              <Typography
                sx={{
                  color: 'text.disabled',
                  fontFamily: (th) => th.campaigner.typography.mono,
                  fontSize: '0.62rem',
                  letterSpacing: '.16em',
                  textTransform: 'uppercase',
                  pb: 1,
                }}
              >
                {key === 'uncategorized' ? t('wiki:page.uncategorized') : t(`wiki:categories.${key}`, { defaultValue: key })} {group.length}
              </Typography>
              {group.map(renderArticle)}
            </Box>
          ))}
        </Box>
      )}
    </CatalogLayout>
  );
};
