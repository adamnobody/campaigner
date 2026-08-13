import React, { useState } from 'react';
import { Box, Typography, Chip, Collapse, useTheme, alpha } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { GlassCard } from '@/components/ui/GlassCard';

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
  const theme = useTheme();

  return (
    <GlassCard sx={{ mb: 3, p: 0, borderRadius: '12px' }}>
      <Box
        onClick={() => setOpen(!open)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2.5,
          py: 1.6,
          cursor: 'pointer',
          backgroundColor: alpha(theme.palette.common.white, 0.018),
          borderBottom: open ? '1px solid rgba(255,255,255,.06)' : 'none',
          '&:hover': { backgroundColor: alpha(theme.palette.common.white, 0.035) },
          transition: 'background 0.2s',
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: '8px',
              bgcolor: alpha(theme.palette.primary.main, 0.09),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
              color: theme.palette.primary.main,
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.05rem', color: theme.palette.text.primary }}>
            {title}
          </Typography>
          {badge !== undefined && badge > 0 && (
            <Chip
              label={badge}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: alpha(theme.palette.primary.main, 0.15),
                color: theme.palette.primary.main,
              }}
            />
          )}
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          {action && open && <Box onClick={e => e.stopPropagation()}>{action}</Box>}
          {open ? <ExpandLessIcon sx={{ color: theme.palette.text.secondary }} /> : <ExpandMoreIcon sx={{ color: theme.palette.text.secondary }} />}
        </Box>
      </Box>
      <Collapse in={open}>
        <Box sx={{ p: 3 }}>{children}</Box>
      </Collapse>
    </GlassCard>
  );
};
