import React, { useState } from 'react';
import { Box, Typography, Paper, Chip, Collapse } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

export interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  badge?: number;
  defaultOpen?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title, icon, badge, defaultOpen = true, action, children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Paper sx={{
      mb: 2.5, overflow: 'hidden',
      backgroundColor: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)', borderRadius: 2,
    }}>
      <Box onClick={() => setOpen(!open)} sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, py: 2, cursor: 'pointer',
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderBottom: open ? '1px solid rgba(255,255,255,0.06)' : 'none',
        '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)' },
        transition: 'background 0.15s',
      }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box sx={{ color: 'rgba(201,169,89,0.7)', display: 'flex' }}>{icon}</Box>
          <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '1.05rem', color: 'rgba(255,255,255,0.9)' }}>
            {title}
          </Typography>
          {badge !== undefined && badge > 0 && (
            <Chip label={badge} size="small" sx={{
              height: 22, fontSize: '0.7rem', fontWeight: 700,
              backgroundColor: 'rgba(201,169,89,0.15)', color: 'rgba(201,169,89,0.9)',
            }} />
          )}
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          {action && open && <Box onClick={e => e.stopPropagation()}>{action}</Box>}
          {open ? <ExpandLessIcon sx={{ color: 'rgba(255,255,255,0.3)' }} /> : <ExpandMoreIcon sx={{ color: 'rgba(255,255,255,0.3)' }} />}
        </Box>
      </Box>
      <Collapse in={open}>
        <Box sx={{ p: 3 }}>{children}</Box>
      </Collapse>
    </Paper>
  );
};
