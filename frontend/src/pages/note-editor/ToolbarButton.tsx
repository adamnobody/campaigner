import React from 'react';
import { Tooltip, IconButton } from '@mui/material';

interface ToolbarButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
}

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({ icon, tooltip, onClick }) => (
  <Tooltip title={tooltip}>
    <IconButton
      size="small"
      onClick={onClick}
      sx={{
        color: 'rgba(255,255,255,0.4)',
        borderRadius: 1,
        width: 30,
        height: 30,
        '&:hover': { color: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(255,255,255,0.06)' },
      }}
    >
      {icon}
    </IconButton>
  </Tooltip>
);
