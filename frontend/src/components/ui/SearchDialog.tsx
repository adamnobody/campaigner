import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog, Box, TextField, Typography, List, ListItemButton,
  ListItemIcon, ListItemText, Chip, InputAdornment, CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { searchApi } from '@/api/axiosClient';
import { useProjectStore } from '@/store/useProjectStore';

interface SearchResult {
  type: string;
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  url: string;
}

const TYPE_COLORS: Record<string, string> = {
  character: '#4ECDC4',
  note: '#45B7D1',
  marker: '#FF6B6B',
  event: '#F7DC6F',
  tag: '#BB8FCE',
};

const TYPE_LABELS: Record<string, string> = {
  character: 'Персонаж',
  note: 'Заметка',
  marker: 'Маркер',
  event: 'Событие',
  tag: 'Тег',
};

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export const SearchDialog: React.FC<SearchDialogProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { currentProject } = useProjectStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (!currentProject?.id || !q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await searchApi.search(currentProject.id, q.trim());
      setResults(res.data.data || []);
      setSelectedIndex(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [currentProject?.id]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(() => doSearch(query), 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelect = (result: SearchResult) => {
    onClose();
    navigate(result.url);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(20, 20, 35, 0.98)',
          border: '1px solid rgba(255,255,255,0.15)',
          backdropFilter: 'blur(20px)',
          borderRadius: 2,
          overflow: 'hidden',
          position: 'fixed',
          top: '15%',
          m: 0,
        },
      }}
      slotProps={{
        backdrop: {
          sx: { backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' },
        },
      }}
    >
      {/* Search input */}
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <TextField
          inputRef={inputRef}
          fullWidth
          placeholder="Поиск персонажей, заметок, маркеров, событий..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          variant="standard"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {loading ? (
                  <CircularProgress size={20} sx={{ color: 'rgba(255,255,255,0.4)' }} />
                ) : (
                  <SearchIcon sx={{ color: 'rgba(255,255,255,0.4)' }} />
                )}
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Typography variant="caption" sx={{
                  color: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 0.5,
                  px: 0.8,
                  py: 0.2,
                  fontSize: '0.65rem',
                }}>
                  ESC
                </Typography>
              </InputAdornment>
            ),
            disableUnderline: true,
            sx: {
              fontSize: '1.1rem',
              color: '#fff',
            },
          }}
        />
      </Box>

      {/* Results */}
      <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
        {!query.trim() ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem' }}>
              Начните вводить для поиска...
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.75rem', mt: 1 }}>
              Поиск по персонажам, заметкам, маркерам карты, событиям таймлайна и тегам
            </Typography>
          </Box>
        ) : results.length === 0 && !loading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.3)' }}>
              Ничего не найдено по запросу "{query}"
            </Typography>
          </Box>
        ) : (
          <List dense sx={{ py: 0 }}>
            {results.map((result, index) => (
              <ListItemButton
                key={`${result.type}-${result.id}`}
                selected={index === selectedIndex}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setSelectedIndex(index)}
                sx={{
                  py: 1.5,
                  px: 2,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(255,255,255,0.08)',
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.06)',
                  },
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Typography fontSize="1.3rem">{result.icon}</Typography>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
                        {highlightMatch(result.title, query)}
                      </Typography>
                      <Chip
                        label={TYPE_LABELS[result.type] || result.type}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.6rem',
                          fontWeight: 600,
                          backgroundColor: `${TYPE_COLORS[result.type] || '#666'}22`,
                          color: TYPE_COLORS[result.type] || '#666',
                          border: `1px solid ${TYPE_COLORS[result.type] || '#666'}44`,
                        }}
                      />
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: '0.75rem',
                        mt: 0.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {result.subtitle}
                    </Typography>
                  }
                />
                {index === selectedIndex && (
                  <Typography sx={{
                    color: 'rgba(255,255,255,0.2)',
                    fontSize: '0.65rem',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 0.5,
                    px: 0.6,
                    py: 0.1,
                  }}>
                    ↵
                  </Typography>
                )}
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>

      {/* Footer */}
      {results.length > 0 && (
        <Box sx={{
          p: 1.5,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem' }}>
            {results.length} результат{results.length > 1 ? (results.length < 5 ? 'а' : 'ов') : ''}
          </Typography>
          <Box display="flex" gap={1}>
            <Typography sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.65rem' }}>
              ↑↓ навигация
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.65rem' }}>
              ↵ открыть
            </Typography>
          </Box>
        </Box>
      )}
    </Dialog>
  );
};

// Highlight matching text
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return text;

  const before = text.substring(0, index);
  const match = text.substring(index, index + query.length);
  const after = text.substring(index + query.length);

  return (
    <>
      {before}
      <span style={{ color: '#4ECDC4', fontWeight: 700 }}>{match}</span>
      {after}
    </>
  );
}