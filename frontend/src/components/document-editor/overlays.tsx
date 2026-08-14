import React from 'react';
import { Box, ButtonBase, Paper, Typography, alpha, useTheme } from '@mui/material';

export type SlashCommand = {
  id: string;
  label: string;
  hint?: string;
};

export function visibleSlashItems(items: SlashCommand[], query?: string): SlashCommand[] {
  const needle = (query ?? '').trim().toLowerCase();
  if (!needle) return items;
  return items.filter((item) => item.label.toLowerCase().includes(needle) || item.id.includes(needle));
}

export function FloatingMenu({
  x,
  y,
  title,
  items,
  query,
  activeIndex = 0,
  onHoverIndex,
  onPick,
}: {
  x: number;
  y: number;
  title?: string;
  items: SlashCommand[];
  query?: string;
  activeIndex?: number;
  onHoverIndex?: (index: number) => void;
  onPick: (id: string) => void;
}) {
  const theme = useTheme();
  const visible = visibleSlashItems(items, query);
  if (visible.length === 0) return null;
  const selected = Math.min(Math.max(activeIndex, 0), visible.length - 1);

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        top: y,
        left: x,
        zIndex: 20,
        minWidth: 240,
        p: 0.75,
        border: `1px solid ${theme.campaigner.surface.border}`,
        backgroundColor: theme.palette.background.paper,
        boxShadow: '0 18px 40px rgba(0,0,0,.45)',
      }}
    >
      {title ? (
        <Typography
          sx={{
            px: 1,
            py: 0.75,
            color: 'text.disabled',
            fontFamily: theme.campaigner.typography.mono,
            fontSize: '0.58rem',
            letterSpacing: '.16em',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </Typography>
      ) : null}
      {visible.map((item, index) => (
        <ButtonBase
          key={item.id}
          onMouseDown={(event) => {
            event.preventDefault();
            onPick(item.id);
          }}
          onMouseEnter={() => onHoverIndex?.(index)}
          sx={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            gap: 2,
            px: 1.1,
            py: 0.85,
            borderRadius: 1,
            backgroundColor: index === selected ? alpha(theme.palette.primary.main, 0.1) : undefined,
            '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) },
          }}
        >
          <Typography sx={{ fontSize: '0.84rem' }}>{item.label}</Typography>
          {item.hint ? (
            <Typography sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>{item.hint}</Typography>
          ) : null}
        </ButtonBase>
      ))}
    </Paper>
  );
}

export function SelectionToolbar({
  x,
  y,
  children,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        position: 'fixed',
        top: y,
        left: x,
        zIndex: 21,
        transform: 'translate(-50%, -100%)',
        display: 'flex',
        alignItems: 'center',
        gap: 0.25,
        px: 0.75,
        py: 0.4,
        borderRadius: '10px',
        border: `1px solid ${theme.campaigner.surface.border}`,
        backgroundColor: theme.palette.background.paper,
        boxShadow: '0 12px 28px rgba(0,0,0,.4)',
      }}
    >
      {children}
    </Box>
  );
}
