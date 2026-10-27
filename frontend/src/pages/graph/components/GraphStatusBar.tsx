import React from 'react';
import { useTranslation } from 'react-i18next';
import { Stack, Typography } from '@mui/material';

type Props = {
  nodeCount: number;
  edgeCount: number;
  zoomPercent: number;
};

export const GraphStatusBar: React.FC<Props> = ({ nodeCount, edgeCount, zoomPercent }) => {
  const { t } = useTranslation(['graph', 'common']);
  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      alignItems="baseline"
      justifyContent="space-between"
      gap={1}
      sx={{
        py: 0.7,
        px: 1,
        mt: 0.5,
        borderTop: (theme) => `1px solid ${theme.campaigner.surface.border}`,
        opacity: 0.68,
        '& .MuiTypography-root': {
          fontFamily: (theme) => theme.campaigner.typography.mono,
          fontSize: '0.62rem',
          letterSpacing: '0.03em',
        },
      }}
    >
      <Typography variant="caption" color="text.secondary" component="div">
        {t('graph:statusBar.nodeCount', { count: nodeCount })} · {t('graph:statusBar.edgeCount', { count: edgeCount })} ·{' '}
        {t('graph:statusBar.zoomLabel')} {t('graph:toolbar.zoomPercent', { value: zoomPercent })}
      </Typography>
      <Typography variant="caption" color="text.secondary" component="div" sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
        {t('graph:statusBar.hint')}
      </Typography>
    </Stack>
  );
};
