import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, TextField, InputAdornment,
  Chip, Avatar, Select, MenuItem, FormControl, Button,
  IconButton, Tooltip, useTheme, alpha,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import GroupsIcon from '@mui/icons-material/Groups';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCharacterStore } from '@/store/useCharacterStore';
import { useTagStore } from '@/store/useTagStore';
import { useBranchStore } from '@/store/useBranchStore';
import { useUIStore } from '@/store/useUIStore';
import { useFactionStore } from '@/store/useFactionStore';
import { useDynastyStore } from '@/store/useDynastyStore';
import { useDebounce } from '@/hooks/useDebounce';
import { DndButton } from '@/components/ui/DndButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { AssetAvatar } from '@/components/ui/AssetAvatar';
import { CatalogAside, CatalogColumns } from '@/components/catalog/CatalogLayout';
import {
  CampaignerPage,
  CampaignerPageHeader,
  CampaignerSurface,
} from '@/components/ui/CampaignerPrimitives';
import { routes } from '@/utils/routes';

export const CharactersPage: React.FC = () => {
  const { t } = useTranslation(['characters', 'common', 'navigation']);
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const navigate = useNavigate();
  const theme = useTheme();

  const {
    characters,
    loading,
    error,
    fetchCharacters,
    deleteCharacter,
  } = useCharacterStore();

  const {
    tags,
    fetchTags,
  } = useTagStore();

  const { showSnackbar, showConfirmDialog } = useUIStore();
  const activeBranchId = useBranchStore((s) => s.activeBranchId);
  const fetchFactions = useFactionStore((s) => s.fetchFactions);
  const factions = useFactionStore((s) => s.factions);
  const fetchDynasties = useDynastyStore((s) => s.fetchDynasties);
  const dynasties = useDynastyStore((s) => s.dynasties);

  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    fetchCharacters(pid, { search: debouncedSearch || undefined, limit: 200 });
  }, [pid, debouncedSearch, fetchCharacters, activeBranchId]);

  useEffect(() => {
    fetchTags(pid).catch(() => {});
    void fetchFactions(pid, { limit: 500 });
    void fetchDynasties(pid);
  }, [pid, fetchTags, fetchFactions, fetchDynasties, activeBranchId]);

  const filtered = useMemo(() => {
    return characters.filter((c: any) => {
      if (selectedTag && !c.tags?.some((t: any) => t.name === selectedTag)) return false;
      return true;
    });
  }, [characters, selectedTag]);

  const handleDelete = (ch: any, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirmDialog(
      t('characters:confirm.deleteCharacterTitle'),
      t('characters:confirm.deleteCharacterListMessage', { name: ch.name }),
      async () => {
        try {
          await deleteCharacter(ch.id);
          showSnackbar(t('characters:snackbar.characterDeleted'), 'success');
        } catch {
          showSnackbar(t('characters:snackbar.deleteFailed'), 'error');
        }
      }
    );
  };

  const handleReset = () => {
    setSearch('');
    setSelectedTag('');
  };
  const hasFilters = Boolean(debouncedSearch || selectedTag);

  if (loading && characters.length === 0 && !error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography sx={{ color: 'text.secondary' }}>{t('common:loading')}</Typography>
      </Box>
    );
  }

  return (
    <CampaignerPage>
      <CatalogColumns
        aside={(
          <CatalogAside
            summaryTitle={t('common:catalog.summary')}
            summary={[
              { label: t('characters:page.aside.summaryTotal'), value: characters.length },
              { label: t('characters:page.aside.summaryAlive'), value: characters.filter((item) => item.status === 'alive').length },
              { label: t('characters:page.aside.summaryPortrait'), value: characters.filter((item) => item.imagePath).length },
              { label: t('characters:page.aside.summaryFaction'), value: characters.filter((item) => (item.factionIds?.length ?? 0) > 0).length },
            ]}
            storedTitle={t('common:catalog.storedTitle')}
            storedBody={t('characters:page.aside.storedBody')}
            linkedTitle={t('common:catalog.linkedTitle')}
            linked={[
              { label: t('navigation:menu.states'), value: factions.filter((item) => item.kind === 'state').length },
              { label: t('navigation:menu.factions'), value: factions.filter((item) => item.kind === 'faction').length },
              { label: t('navigation:menu.dynasties'), value: dynasties.length },
            ]}
          />
        )}
      >
      <CampaignerPageHeader
        eyebrow={t('characters:page.eyebrow', { count: characters.length })}
        title={t('characters:page.title')}
        description={t('characters:page.subtitle')}
        actions={
          <>
          <DndButton
            variant="outlined"
            startIcon={<AccountTreeIcon />}
            onClick={() => navigate(routes.charactersGraph(pid))}
            sx={{ borderColor: alpha(theme.palette.primary.main, 0.5) }}
          >
            {t('characters:page.relationshipGraph')}
          </DndButton>
          <DndButton
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(routes.characterDetail(pid, 'new'))}
          >
            {t('common:add')}
          </DndButton>
          </>
        }
      />

      <CampaignerSurface
          sx={{
            p: 1.5,
            mb: characters.length === 0 ? 0 : 3,
            display: 'flex',
            gap: 1.5,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <TextField
            placeholder={t('characters:page.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              flexGrow: 1,
              maxWidth: 400,
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            size="small"
          />

          <FormControl size="small" sx={{ minWidth: 170 }}>
            <Select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">{t('characters:page.allTags')}</MenuItem>
              {tags.map((tag: any) => (
                <MenuItem key={tag.id} value={tag.name}>
                  {tag.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {(search || selectedTag) && (
            <Button
              variant="outlined"
              onClick={handleReset}
              size="small"
              sx={{ borderColor: alpha(theme.palette.primary.main, 0.5), textTransform: 'none' }}
            >
              {t('common:reset')}
            </Button>
          )}

          <Typography variant="body2" sx={{ color: 'text.secondary', ml: 'auto' }}>
            {t('characters:page.count', { filtered: filtered.length, total: characters.length })}
          </Typography>
      </CampaignerSurface>

      {error && characters.length === 0 ? (
        <EmptyState
          icon={<PersonIcon sx={{ fontSize: 48 }} />}
          title={t('characters:page.error.title')}
          description={error}
          actionLabel={t('characters:page.error.retry')}
          onAction={() => fetchCharacters(pid, { search: debouncedSearch || undefined, limit: 200 })}
        />
      ) : characters.length === 0 && !hasFilters ? (
        <EmptyState
          icon={<PersonIcon sx={{ fontSize: 64 }} />}
          title={t('characters:page.empty.noCharacters.title')}
          description={t('characters:page.empty.noCharacters.description')}
          actionLabel={t('characters:page.empty.noCharacters.action')}
          onAction={() => navigate(routes.characterDetail(pid, 'new'))}
          templatesTitle={t('characters:page.empty.templates.title')}
          templates={[
            {
              icon: <PersonIcon />,
              title: t('characters:page.empty.templates.protagonist.title'),
              description: t('characters:page.empty.templates.protagonist.description'),
              onClick: () => navigate(routes.characterDetail(pid, 'new')),
            },
            {
              icon: <AccountTreeIcon />,
              title: t('characters:page.empty.templates.antagonist.title'),
              description: t('characters:page.empty.templates.antagonist.description'),
              onClick: () => navigate(routes.characterDetail(pid, 'new')),
            },
            {
              icon: <GroupsIcon />,
              title: t('characters:page.empty.templates.supporting.title'),
              description: t('characters:page.empty.templates.supporting.description'),
              onClick: () => navigate(routes.characterDetail(pid, 'new')),
            },
          ]}
        />
      ) : characters.length === 0 || filtered.length === 0 ? (
        <EmptyState
          icon={<SearchIcon sx={{ fontSize: 64 }} />}
          title={t('characters:page.empty.noMatch.title')}
          description={t('characters:page.empty.noMatch.description')}
          actionLabel={t('characters:page.empty.noMatch.action')}
          onAction={handleReset}
        />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          {filtered.map((ch: any) => (
            <CampaignerSurface
              key={ch.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(routes.characterDetail(pid, ch.id))}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  navigate(routes.characterDetail(pid, ch.id));
                }
              }}
              sx={{
                minHeight: 144,
                display: 'grid',
                gridTemplateColumns: '88px minmax(0, 1fr)',
                gap: 2,
                p: 1.5,
                position: 'relative',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'border-color 160ms ease, background-color 160ms ease, transform 160ms ease',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: '0 auto 0 0',
                  width: 2,
                  backgroundColor: 'primary.main',
                  opacity: 0,
                  transition: 'opacity 160ms ease',
                },
                '&:hover, &:focus-visible': {
                  borderColor: alpha(theme.palette.primary.main, 0.32),
                  backgroundColor: alpha(theme.palette.primary.main, 0.035),
                  transform: 'translateY(-2px)',
                  outline: 'none',
                  '&::before': { opacity: 1 },
                  '& .delete-btn': { opacity: 1 },
                },
              }}
            >
              <Box sx={{ width: 88, height: 112, borderRadius: 2, overflow: 'hidden' }}>
                {ch.imagePath ? (
                  <AssetAvatar
                    assetPath={ch.imagePath}
                    sx={{ width: '100%', height: '100%', borderRadius: 2 }}
                    variant="rounded"
                  />
                ) : (
                  <Avatar
                    sx={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      color: alpha(theme.palette.primary.main, 0.72),
                      border: `1px dashed ${alpha(theme.palette.primary.main, 0.22)}`,
                    }}
                    variant="rounded"
                  >
                    <PersonIcon sx={{ fontSize: 34 }} />
                  </Avatar>
                )}
              </Box>

              <Box sx={{ minWidth: 0, py: 0.25, pr: 3 }}>
                <Typography variant="overline" sx={{ color: 'primary.main', display: 'block', lineHeight: 1.4 }}>
                  {t('characters:page.cardEyebrow')}
                </Typography>
                <Typography variant="h5" sx={{ fontSize: '1.35rem', lineHeight: 1.15 }} noWrap>
                  {ch.name}
                </Typography>

                {ch.title ? (
                  <Typography
                    sx={{ color: 'primary.main', fontSize: '0.76rem', pt: 0.5 }}
                    noWrap
                  >
                    {ch.title}
                  </Typography>
                ) : null}

                {ch.bio ? (
                  <Typography
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.78rem',
                      lineHeight: 1.55,
                      mt: 0.75,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {ch.bio}
                  </Typography>
                ) : null}

                {ch.tags?.length > 0 ? (
                  <Box display="flex" gap={0.5} mt={1} flexWrap="wrap">
                    {ch.tags.slice(0, 2).map((tag: any) => (
                      <Chip
                        key={tag.id}
                        label={tag.name}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.66rem',
                          backgroundColor: tag.color ? alpha(tag.color, 0.12) : alpha(theme.palette.primary.main, 0.08),
                          color: tag.color || theme.palette.primary.main,
                          borderColor: tag.color ? alpha(tag.color, 0.25) : alpha(theme.palette.primary.main, 0.2),
                        }}
                      />
                    ))}
                    {ch.tags.length > 2 ? (
                      <Chip
                        label={`+${ch.tags.length - 2}`}
                        size="small"
                        sx={{ height: 22, fontSize: '0.66rem', color: 'text.secondary' }}
                      />
                    ) : null}
                  </Box>
                ) : null}
              </Box>

              <Tooltip title={t('common:delete')}>
                <IconButton
                  className="delete-btn"
                  size="small"
                  aria-label={t('common:delete')}
                  onClick={(e) => handleDelete(ch, e)}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    opacity: { xs: 1, md: 0 },
                    transition: 'opacity 0.2s',
                    color: theme.palette.error.main,
                    '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </CampaignerSurface>
          ))}
        </Box>
      )}
      </CatalogColumns>
    </CampaignerPage>
  );
};
