import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Paper, TextField, InputAdornment,
  Chip, Avatar, Select, MenuItem, FormControl, Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import { useParams, useNavigate } from 'react-router-dom';
import { charactersApi } from '@/api/axiosClient';
import { useDebounce } from '@/hooks/useDebounce';
import { DndButton } from '@/components/ui/DndButton';
import { EmptyState } from '@/components/ui/EmptyState';

export const CharactersPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const navigate = useNavigate();

  const [characters, setCharacters] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const debouncedSearch = useDebounce(search, 300);

  const fetchData = () => {
    setLoading(true);
    charactersApi.getAll(pid, { search: debouncedSearch || undefined, limit: 100 })
      .then(res => {
        setCharacters(res.data.data.items);
        setTotal(res.data.data.total);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, [pid, debouncedSearch]);

  // Собираем все теги
  const allTags = Array.from(
    new Map(
      characters.flatMap(c => c.tags || []).map((tag: any) => [tag.id, tag])
    ).values()
  );

  // Фильтрация по тегу
  const filteredCharacters = characters.filter(c => {
    if (selectedTag) {
      return c.tags?.some((t: any) => t.name === selectedTag);
    }
    return true;
  });

  const handleReset = () => {
    setSearch('');
    setSelectedTag('');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
          {error ? `Ошибка: ${error}` : 'Загрузка персонажей...'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography
          sx={{
            fontFamily: '"Cinzel", serif',
            fontWeight: 700,
            fontSize: '1.8rem',
            color: '#fff',
          }}
        >
          Персонажи
        </Typography>
        <Box display="flex" gap={1}>
          <DndButton
            variant="outlined"
            onClick={() => navigate(`/project/${pid}/map`)}
            sx={{
              borderColor: 'rgba(255,255,255,0.2)',
              color: '#fff',
              '&:hover': { borderColor: 'rgba(255,255,255,0.4)' },
            }}
          >
            НАЗАД К ПРОЕКТУ
          </DndButton>
          <DndButton
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/project/${pid}/characters/new`)}
          >
            ДОБАВИТЬ
          </DndButton>
        </Box>
      </Box>

      {/* Filters */}
      <Box display="flex" gap={2} mb={3} alignItems="center" flexWrap="wrap">
        <TextField
          placeholder="Поиск по имени"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            flexGrow: 1,
            maxWidth: 500,
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255,255,255,0.04)',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
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

        {allTags.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
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
              <MenuItem value="">Теги</MenuItem>
              {allTags.map((tag: any) => (
                <MenuItem key={tag.id} value={tag.name}>{tag.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <Button
          variant="outlined"
          onClick={handleReset}
          size="small"
          sx={{
            borderColor: 'rgba(130,130,255,0.4)',
            color: 'rgba(130,130,255,0.9)',
            '&:hover': { borderColor: 'rgba(130,130,255,0.6)' },
            textTransform: 'none',
            fontFamily: '"Cinzel", serif',
          }}
        >
          СБРОС
        </Button>

        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
          Показано: {filteredCharacters.length}
        </Typography>
      </Box>

      {/* Characters grid */}
      {filteredCharacters.length === 0 ? (
        <EmptyState
          title="Персонажи не найдены"
          description="Создайте первого персонажа для вашего мира"
          actionLabel="Создать персонажа"
          onAction={() => navigate(`/project/${pid}/characters/new`)}
        />
      ) : (
        <Grid container spacing={2}>
          {filteredCharacters.map((character: any) => (
            <Grid item xs={12} sm={6} md={4} key={character.id}>
              <Paper
                onClick={() => navigate(`/project/${pid}/characters/${character.id}`)}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 2,
                  p: 2,
                  cursor: 'pointer',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 2,
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    borderColor: 'rgba(130,130,255,0.3)',
                  },
                }}
              >
                {character.imagePath ? (
                  <Avatar src={character.imagePath} sx={{ width: 48, height: 48, flexShrink: 0 }} />
                ) : (
                  <Avatar
                    sx={{
                      width: 48, height: 48, flexShrink: 0,
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.3)',
                    }}
                  >
                    <PersonIcon />
                  </Avatar>
                )}
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }} noWrap>
                    {character.name}
                  </Typography>
                  {(character.title || character.bio) && (
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', mt: 0.3 }} noWrap>
                      {character.title || character.bio}
                    </Typography>
                  )}
                  {character.tags?.length > 0 && (
                    <Box display="flex" gap={0.5} mt={1} flexWrap="wrap">
                      {character.tags.map((tag: any) => (
                        <Chip
                          key={tag.id}
                          label={tag.name}
                          size="small"
                          sx={{
                            height: 22, fontSize: '0.7rem', fontWeight: 600,
                            backgroundColor: tag.color || 'rgba(130,130,255,0.2)',
                            color: '#fff', borderRadius: 1,
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};