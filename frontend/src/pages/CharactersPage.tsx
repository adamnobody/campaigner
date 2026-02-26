import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardMedia,
  TextField, InputAdornment, Tabs, Tab, Chip, Avatar,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useParams, useNavigate } from 'react-router-dom';
import { useCharacterStore } from '@/store/useCharacterStore';
import { useUIStore } from '@/store/useUIStore';
import { useDebounce } from '@/hooks/useDebounce';
import { DndButton } from '@/components/ui/DndButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { CHARACTER_STATUSES } from '@campaigner/shared';

const statusColors: Record<string, string> = {
  alive: '#82E0AA',
  dead: '#FF6B6B',
  unknown: '#F7DC6F',
  missing: '#85C1E9',
};

export const CharactersPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const navigate = useNavigate();
  const { characters, total, loading, fetchCharacters, deleteCharacter } = useCharacterStore();
  const { showSnackbar, showConfirmDialog } = useUIStore();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(0);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    fetchCharacters(pid, { search: debouncedSearch || undefined });
  }, [pid, fetchCharacters, debouncedSearch]);

  const handleDelete = (id: number, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirmDialog('Delete Character', `Delete "${name}"? This cannot be undone.`, async () => {
      try {
        await deleteCharacter(id);
        showSnackbar('Character deleted', 'success');
      } catch {
        showSnackbar('Failed to delete', 'error');
      }
    });
  };

  const tabs = ['all', ...CHARACTER_STATUSES];

  const filteredCharacters = tab === 0
    ? characters
    : characters.filter(c => c.status === tabs[tab]);

  if (loading && characters.length === 0) return <LoadingScreen />;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h3">Characters</Typography>
        <Box display="flex" gap={2}>
          <DndButton
            variant="outlined"
            onClick={() => navigate(`/project/${pid}/characters/graph`)}
          >
            Relationship Graph
          </DndButton>
          <DndButton
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/project/${pid}/characters/new`)}
          >
            New Character
          </DndButton>
        </Box>
      </Box>

      <TextField
        fullWidth
        placeholder="Search characters..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start"><SearchIcon /></InputAdornment>
          ),
        }}
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label={`All (${total})`} />
        {CHARACTER_STATUSES.map(status => (
          <Tab
            key={status}
            label={
              <Chip
                label={status}
                size="small"
                sx={{ backgroundColor: statusColors[status], color: '#000', fontWeight: 600 }}
              />
            }
          />
        ))}
      </Tabs>

      {filteredCharacters.length === 0 ? (
        <EmptyState
          title="No characters found"
          description="Create your first character to populate your world"
          actionLabel="Create Character"
          onAction={() => navigate(`/project/${pid}/characters/new`)}
        />
      ) : (
        <Grid container spacing={3}>
          {filteredCharacters.map(character => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={character.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' },
                }}
                onClick={() => navigate(`/project/${pid}/characters/${character.id}`)}
              >
                {character.imagePath ? (
                  <CardMedia
                    component="img"
                    height="220"
                    image={character.imagePath}
                    alt={character.name}
                    sx={{ objectFit: 'cover' }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 220,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%)',
                    }}
                  >
                    <Avatar sx={{ width: 80, height: 80, fontSize: 36, bgcolor: 'primary.dark' }}>
                      {character.name[0]}
                    </Avatar>
                  </Box>
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h6" noWrap>{character.name}</Typography>
                      {character.title && (
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {character.title}
                        </Typography>
                      )}
                    </Box>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => handleDelete(character.id, character.name, e)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                    <Chip
                      label={character.status}
                      size="small"
                      sx={{ backgroundColor: statusColors[character.status], color: '#000' }}
                    />
                    {character.race && <Chip label={character.race} size="small" variant="outlined" />}
                    {character.characterClass && <Chip label={character.characterClass} size="small" variant="outlined" />}
                    {character.level && <Chip label={`Lvl ${character.level}`} size="small" variant="outlined" />}
                  </Box>
                  {character.tags && character.tags.length > 0 && (
                    <Box display="flex" gap={0.5} mt={1} flexWrap="wrap">
                      {character.tags.slice(0, 3).map(tag => (
                        <Chip
                          key={tag.id}
                          label={tag.name}
                          size="small"
                          sx={{ backgroundColor: tag.color, color: '#fff', fontSize: '0.7rem' }}
                        />
                      ))}
                      {character.tags.length > 3 && (
                        <Chip label={`+${character.tags.length - 3}`} size="small" />
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};