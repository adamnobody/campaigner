import React, { useMemo, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, List, ListItemButton, ListItemText, TextField } from '@mui/material';
import type { DocumentEntity } from './WorldTextEditor';

export function EntityPickerDialog({
  open,
  title,
  items,
  onClose,
  onPick,
}: {
  open: boolean;
  title: string;
  items: DocumentEntity[];
  onClose: () => void;
  onPick: (item: DocumentEntity) => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) => item.label.toLowerCase().includes(needle) || item.group.toLowerCase().includes(needle));
  }, [items, query]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          size="small"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          sx={{ mb: 1, mt: 0.5 }}
        />
        <List dense>
          {filtered.map((item) => (
            <ListItemButton
              key={item.id}
              onClick={() => {
                onPick(item);
                setQuery('');
              }}
            >
              <ListItemText primary={item.label} secondary={item.group} />
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
}
