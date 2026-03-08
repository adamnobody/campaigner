import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Paper, TextField, InputAdornment,
  Chip, Avatar, Select, MenuItem, FormControl, Button,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { useParams, useNavigate } from 'react-router-dom';
import { useCharacterStore } from '@/store/useCharacterStore';
import { useTagStore } from '@/store/useTagStore';
import { useUIStore } from '@/store/useUIStore';
import { useDebounce } from '@/hooks/useDebounce';
import { DndButton } from '@/components/ui/DndButton';
import { EmptyState } from '@/components/ui/EmptyState';

export const CharactersPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const navigate = useNavigate();

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
    showConfirmDialog('Удалить персонажа', `Удалить "${ch.name}"?`, async () => {
      try {
        await deleteCharacter(ch.id);
        showSnackbar('Персонаж удалён', 'success');
      } catch {
        showSnackbar('Ошибка удаления', 'error');
      }
    });
  };

  const handleReset = () => {
    setSearch('');
    setSelectedTag('');
  };

  if (loading && characters.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>Загрузка...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '1.8rem', color: '#fff' }}>
          Персонажи
        </Typography>
        <Box display="flex" gap={1}>
          <DndButton
            variant="outlined"
            startIcon={<AccountTreeIcon />}
            onClick={() => navigate(`/project/${pid}/characters/graph`)}
            sx={{ borderColor: 'rgba(130,130,255,0.3)', color: 'rgba(130,130,255,0.9)' }}
          >
            Граф связей
          </DndButton>
          <DndButton
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/project/${pid}/characters/new`)}
          >
            Добавить
          </DndButton>
        </Box>
      </Box>

      <Box display="flex" gap={2} mb={3} alignItems="center" flexWrap="wrap">
        <TextField
          placeholder="Поиск по имени..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            flexGrow: 1,
            maxWidth: 400,
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255,255,255,0.04)',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(255,255,255,0.3)' }} />
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
            sx={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
              color: '#fff',
            }}
          >
            <MenuItem value="">Все теги</MenuItem>
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
            sx={{ borderColor: 'rgba(130,130,255,0.4)', color: 'rgba(130,130,255,0.9)', textTransform: 'none' }}
          >
            Сброс
          </Button>
        )}

        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
          {filtered.length} из {characters.length}
        </Typography>
      </Box>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<PersonIcon sx={{ fontSize: 64 }} />}
          title="Персонажи не найдены"
          description={characters.length > 0 ? 'Попробуйте изменить фильтры' : 'Создайте первого персонажа'}
          actionLabel={characters.length > 0 ? undefined : 'Создать персонажа'}
          onAction={characters.length > 0 ? undefined : () => navigate(`/project/${pid}/characters/new`)}
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
              <Paper
                onClick={() => navigate(`/project/${pid}/characters/${ch.id}`)}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 2,
                  p: 2,
                  cursor: 'pointer',
                  width: '100%',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 2,
                  transition: 'all 0.2s',
                  position: 'relative',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    borderColor: 'rgba(130,130,255,0.3)',
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
                    color: 'rgba(255,100,100,0.5)',
                    '&:hover': { color: 'rgba(255,100,100,0.8)' },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>

                {ch.imagePath ? (
                  <Avatar
                    src={ch.imagePath}
                    sx={{ width: 52, height: 52, borderRadius: 1.5 }}
                    variant="rounded"
                  />
                ) : (
                  <Avatar
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 1.5,
                      bgcolor: 'rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.2)',
                    }}
                    variant="rounded"
                  >
                    <PersonIcon />
                  </Avatar>
                )}

                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography sx={{ fontWeight: 700, color: '#fff', lineHeight: 1.3 }} noWrap>
                    {ch.name}
                  </Typography>

                  {ch.title && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'rgba(201,169,89,0.8)',
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
                        color: 'rgba(255,255,255,0.4)',
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
                            backgroundColor: tag.color || 'rgba(130,130,255,0.2)',
                            color: '#fff',
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
                            backgroundColor: 'rgba(255,255,255,0.06)',
                            color: 'rgba(255,255,255,0.4)',
                            borderRadius: 1,
                          }}
                        />
                      )}
                    </Box>
                  )}
                </Box>
              </Paper>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};