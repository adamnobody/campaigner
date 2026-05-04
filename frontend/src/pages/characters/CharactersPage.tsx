import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, TextField, InputAdornment,
  Chip, Avatar, Select, MenuItem, FormControl, Button,
  IconButton, useTheme, alpha,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCharacterStore } from '@/store/useCharacterStore';
import { useTagStore } from '@/store/useTagStore';
import { useUIStore } from '@/store/useUIStore';
import { useDebounce } from '@/hooks/useDebounce';
import { DndButton } from '@/components/ui/DndButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassCard } from '@/components/ui/GlassCard';
import { uploadAssetUrl } from '@/utils/uploadAssetUrl';
import { routes } from '@/utils/routes';

export const CharactersPage: React.FC = () => {
  const { t } = useTranslation(['characters', 'common']);
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const navigate = useNavigate();
  const theme = useTheme();

  const {
    characters,
    loading,
    fetchCharacters,
    deleteCharacter,
  } = useCharacterStore();

  const {
    tags,
    fetchTags,
  } = useTagStore();

  const { showSnackbar, showConfirmDialog } = useUIStore();

  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    fetchCharacters(pid, { search: debouncedSearch || undefined, limit: 200 });
  }, [pid, debouncedSearch, fetchCharacters]);

  useEffect(() => {
    fetchTags(pid).catch(() => {});
  }, [pid, fetchTags]);

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

  if (loading && characters.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography sx={{ color: 'text.secondary' }}>{t('common:loading')}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '1.8rem', color: 'text.primary' }}>
            {t('characters:page.title')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {t('characters:page.subtitle')}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
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
        </Box>
      </Box>

      {characters.length > 0 && (
        <GlassCard sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
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

          <FormControl size="small" sx={{ minWidth: 160 }}>
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
        </GlassCard>
      )}

      {characters.length === 0 ? (
        <EmptyState
          icon={<PersonIcon sx={{ fontSize: 64 }} />}
          title={t('characters:page.empty.noCharacters.title')}
          description={t('characters:page.empty.noCharacters.description')}
          actionLabel={t('characters:page.empty.noCharacters.action')}
          onAction={() => navigate(routes.characterDetail(pid, 'new'))}
        />
      ) : filtered.length === 0 ? (
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
            columnCount: { xs: 1, sm: 2, md: 3 },
            columnGap: '16px',
          }}
        >
          {filtered.map((ch: any) => (
            <Box
              key={ch.id}
              sx={{
                breakInside: 'avoid',
                mb: 2,
                display: 'inline-block',
                width: '100%',
              }}
            >
              <GlassCard
                interactive
                onClick={() => navigate(routes.characterDetail(pid, ch.id))}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 2,
                  p: 2,
                  width: '100%',
                  '&:hover': {
                    '& .delete-btn': { opacity: 1 },
                  },
                }}
              >
                <IconButton
                  className="delete-btn"
                  size="small"
                  onClick={(e) => handleDelete(ch, e)}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    color: theme.palette.error.main,
                    '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>

                {ch.imagePath ? (
                  <Avatar
                    src={uploadAssetUrl(ch.imagePath)}
                    sx={{ width: 52, height: 52, borderRadius: 1.5 }}
                    variant="rounded"
                  />
                ) : (
                  <Avatar
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 1.5,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                    }}
                    variant="rounded"
                  >
                    <PersonIcon />
                  </Avatar>
                )}

                <Box sx={{ minWidth: 0, flexGrow: 1, pr: 3 }}>
                  <Typography sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.3 }} noWrap>
                    {ch.name}
                  </Typography>

                  {ch.title && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.primary.main,
                        display: 'block',
                        lineHeight: 1.3,
                        fontStyle: 'italic',
                      }}
                      noWrap
                    >
                      {ch.title}
                    </Typography>
                  )}

                  {ch.bio && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.8rem',
                        mt: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {ch.bio}
                    </Typography>
                  )}

                  {ch.tags?.length > 0 && (
                    <Box display="flex" gap={0.5} mt={1} flexWrap="wrap">
                      {ch.tags.slice(0, 3).map((tag: any) => (
                        <Chip
                          key={tag.id}
                          label={tag.name}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            backgroundColor: tag.color ? alpha(tag.color, 0.2) : alpha(theme.palette.primary.main, 0.15),
                            color: tag.color || theme.palette.primary.main,
                            borderRadius: 1,
                          }}
                        />
                      ))}
                      {ch.tags.length > 3 && (
                        <Chip
                          label={`+${ch.tags.length - 3}`}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            backgroundColor: alpha(theme.palette.text.secondary, 0.1),
                            color: 'text.secondary',
                            borderRadius: 1,
                          }}
                        />
                      )}
                    </Box>
                  )}
                </Box>
              </GlassCard>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};
