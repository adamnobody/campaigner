import React from 'react';
import { Tabs, Tab, Box, alpha, useTheme } from '@mui/material';

interface EntityTabsProps {
  value: string;
  onChange: (event: React.SyntheticEvent, newValue: string) => void;
  tabs: { value: string; label: string; icon?: React.ReactElement }[];
}

export const EntityTabs: React.FC<EntityTabsProps> = ({ value, onChange, tabs }) => {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
      <Tabs
        value={value}
        onChange={onChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: 48,
          '& .MuiTabs-indicator': {
            height: 3,
            borderTopLeftRadius: 3,
            borderTopRightRadius: 3,
            backgroundColor: theme.palette.primary.main,
          },
        }}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.value}
            value={tab.value}
            label={tab.label}
            icon={tab.icon}
            iconPosition="start"
            sx={{
              minHeight: 48,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.95rem',
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              },
            }}
          />
        ))}
      </Tabs>
    </Box>
  );
};
