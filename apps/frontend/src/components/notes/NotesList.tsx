import React from 'react';
import { List, ListItemButton, ListItemText, Typography, Box } from '@mui/material';
import type { NoteDTO } from '../../app/api';

export function NotesList(props: {
  notes: NoteDTO[];
  selectedNoteId: string | null;
  onSelect: (noteId: string) => void;
}) {
  const { notes, selectedNoteId, onSelect } = props;

  return (
    <Box sx={{ px: 1, pb: 1 }}>
      {notes.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ px: 1, mt: 1 }}>
          Заметок пока нет.
        </Typography>
      ) : (
        <List dense>
          {notes.map((n) => (
            <ListItemButton key={n.id} selected={n.id === selectedNoteId} onClick={() => onSelect(n.id)}>
              <ListItemText primary={n.title} secondary={n.type.toUpperCase()} />
            </ListItemButton>
          ))}
        </List>
      )}
    </Box>
  );
}
