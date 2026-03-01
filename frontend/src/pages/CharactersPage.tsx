import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Paper, TextField, InputAdornment,
  Chip, Avatar, Select, MenuItem, FormControl, Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import { useParams, useNavigate } from 'react-router-dom';
import { charactersApi, tagsApi } from '@/api/axiosClient';
import { useDebounce } from '@/hooks/useDebounce';
import { DndButton } from '@/components/ui/DndButton';
import { EmptyState } from '@/components/ui/EmptyState';

export const CharactersPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const navigate = useNavigate();

  const [characters, setCharacters] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      charactersApi.getAll(pid, { search: debouncedSearch || undefined, limit: 200 }),
      tagsApi.getAll(pid),
    ]).then(([charRes, tagsRes]) => {
      setCharacters(charRes.data.data.items || []);
      setAllTags(tagsRes.data.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [pid, debouncedSearch]);

  // Filter by tag
  const filtered = characters.filter(c => {
    if (!selectedTag) return true;
    return c.tags?.some((t: any) => t.name === selectedTag);
  });

  const handleReset = () => {
    setSearch('');
    setSelectedTag('');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>Загрузка...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '1.8rem', color: '#fff' }}>
          Персонажи
        </Typography>
        <Box display="flex" gap={1}>
          <DndButton
            variant="outlined"
            onClick={() => navigate(`/project/${pid}/map`)}
            sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
          >
            Назад к проекту
          </DndButton>
          <DndButton
            variant="outlined"
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

      {/* Filters */}
      <Box display="flex" gap={2} mb={3} alignItems="center" flexWrap="wrap">
        <TextField
          placeholder="Поиск по имени"
          value={search}
          onChange={e => { setSearch(e.target.value); }}
          sx={{
            flexGrow: 1, maxWidth: 400,
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255,255,255,0.04)',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
            },
          }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'rgba(255,255,255,0.3)' }} /></InputAdornment>,
          }}
          size="small"
        />

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <Select
            value={selectedTag}
            onChange={e => { setSelectedTag(e.target.value); }}
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

        <Button
          variant="outlined"
          onClick={handleReset}
          size="small"
          sx={{ borderColor: 'rgba(130,130,255,0.4)', color: 'rgba(130,130,255,0.9)', textTransform: 'none' }}
        >
          Сброс
        </Button>

        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
          Показано: {filtered.length}
        </Typography>
      </Box>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Персонажи не найдены"
          description="Создайте первого персонажа"
          actionLabel="Создать персонажа"
          onAction={() => navigate(`/project/${pid}/characters/new`)}
        />
      ) : (
        <Grid container spacing={2}>
          {filtered.map((ch: any) => (
            <Grid item xs={12} sm={6} md={4} key={ch.id}>
              <Paper
                onClick={() => navigate(`/project/${pid}/characters/${ch.id}`)}
                sx={{
                  display: 'flex', alignItems: 'flex-start', gap: 2, p: 2,
                  cursor: 'pointer',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 2,
                  transition: 'all 0.2s',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(130,130,255,0.3)' },
                }}
              >
                {ch.imagePath ? (
                  <Avatar src={ch.imagePath} sx={{ width: 48, height: 48 }} />
                ) : (
                  <Avatar sx={{ width: 48, height: 48, bgcolor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}>
                    <PersonIcon />
                  </Avatar>
                )}
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography sx={{ fontWeight: 700, color: '#fff' }} noWrap>{ch.name}</Typography>
                  {ch.bio && (
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }} noWrap>
                      {ch.bio}
                    </Typography>
                  )}
                  {ch.tags?.length > 0 && (
                    <Box display="flex" gap={0.5} mt={1} flexWrap="wrap">
                      {ch.tags.map((tag: any) => (
                        <Chip key={tag.id} label={tag.name} size="small" sx={{
                          height: 22, fontSize: '0.7rem', fontWeight: 600,
                          backgroundColor: tag.color || 'rgba(130,130,255,0.2)', color: '#fff', borderRadius: 1,
                        }} />
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