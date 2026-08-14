import React, { useState } from 'react';
import { Box, IconButton, TextField, Typography, alpha, useTheme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import type { InfoboxField } from './documentMeta';

export function WikiInfobox({
  title,
  fields,
  emptyLabel,
  addLabel,
  readOnly,
  onChange,
}: {
  title: string;
  fields: InfoboxField[];
  emptyLabel: string;
  addLabel: string;
  readOnly?: boolean;
  onChange: (fields: InfoboxField[]) => void;
}) {
  const theme = useTheme();
  const [draft, setDraft] = useState('');

  return (
    <Box
      sx={{
        border: `1px solid ${theme.campaigner.surface.border}`,
        borderRadius: '12px',
        backgroundColor: theme.palette.background.paper,
        p: 1.5,
      }}
    >
      <Typography
        sx={{
          color: 'primary.main',
          fontFamily: theme.campaigner.typography.mono,
          fontSize: '0.58rem',
          letterSpacing: '.16em',
          textTransform: 'uppercase',
          pb: 1.25,
        }}
      >
        {title}
      </Typography>
      {fields.map((field, index) => (
        <Box key={`${field.key}-${index}`} sx={{ py: 0.7, borderTop: index ? `1px solid ${alpha(theme.palette.common.white, 0.04)}` : 0 }}>
          <Typography sx={{ color: 'text.disabled', fontSize: '0.62rem', letterSpacing: '.12em', textTransform: 'uppercase', pb: 0.25 }}>
            {field.key}
          </Typography>
          {readOnly ? (
            <Typography sx={{ color: field.value ? 'text.primary' : 'text.disabled', fontSize: '0.8rem' }}>
              {field.value || emptyLabel}
            </Typography>
          ) : (
            <TextField
              variant="standard"
              fullWidth
              placeholder={emptyLabel}
              value={field.value}
              onChange={(event) => {
                const next = fields.slice();
                next[index] = { ...field, value: event.target.value };
                onChange(next);
              }}
              InputProps={{ disableUnderline: true }}
              sx={{ '& input': { fontSize: '0.8rem', color: 'text.primary' } }}
            />
          )}
        </Box>
      ))}
      {!readOnly && (
        <Box sx={{ display: 'flex', alignItems: 'center', pt: 0.75 }}>
          <TextField
            variant="standard"
            placeholder={addLabel}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && draft.trim()) {
                onChange([...fields, { key: draft.trim(), value: '' }]);
                setDraft('');
              }
            }}
            InputProps={{ disableUnderline: true }}
            sx={{ flex: 1, '& input': { fontSize: '0.78rem' } }}
          />
          <IconButton
            size="small"
            onClick={() => {
              if (!draft.trim()) return;
              onChange([...fields, { key: draft.trim(), value: '' }]);
              setDraft('');
            }}
          >
            <AddIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}
