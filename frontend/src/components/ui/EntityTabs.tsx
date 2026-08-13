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
    <Box sx={{ mb: 4, borderBottom: '1px solid rgba(255,255,255,.07)' }}>
      <Tabs
        value={value}
        onChange={onChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: 38,
          '& .MuiTabs-indicator': {
            height: 1,
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
              minHeight: 38,
              fontWeight: 300,
              textTransform: 'none',
              fontSize: '0.78rem',
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: theme.palette.text.primary,
                fontWeight: 400,
              },
            }}
          />
        ))}
      </Tabs>
    </Box>
  );
};
