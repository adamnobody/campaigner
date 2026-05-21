import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';

import { legacyMigrationApi } from '@/api/legacyMigration';
import { useUIStore } from '@/store/useUIStore';
import type {
  LegacyMigrationPreview,
  LegacyMigrationReport,
} from '@/types/generated/bindings';
import { getErrorMessage } from '@/utils/error';

const WARNING_PREVIEW_LIMIT = 6;

export const LegacyMigrationDialog: React.FC = () => {
  const { t } = useTranslation(['legacyMigration', 'common']);
  const showSnackbar = useUIStore((state) => state.showSnackbar);

  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<LegacyMigrationPreview | null>(null);
  const [report, setReport] = useState<LegacyMigrationReport | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkAvailable = async () => {
      try {
        const result = await legacyMigrationApi.checkAvailable();
        if (!cancelled && result) {
          setPreview(result);
          setOpen(true);
        }
      } catch (checkError) {
        if (!cancelled) {
          showSnackbar(
            getErrorMessage(checkError, t('legacyMigration:checkFailed')),
            'warning'
          );
        }
      }
    };

    void checkAvailable();

    return () => {
      cancelled = true;
    };
  }, [showSnackbar, t]);

  const handleAskLater = () => {
    if (isImporting) return;
    setOpen(false);
  };

  const handleSkip = async () => {
    try {
      await legacyMigrationApi.skip();
      showSnackbar(t('legacyMigration:skipSuccess'), 'info');
      setOpen(false);
    } catch (skipError) {
      setError(getErrorMessage(skipError, t('legacyMigration:skipFailed')));
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    setError(null);

    try {
      const result = await legacyMigrationApi.run();
      setReport(result);
      showSnackbar(t('legacyMigration:importSuccess'), 'success');
    } catch (importError) {
      setError(getErrorMessage(importError, t('legacyMigration:importFailed')));
    } finally {
      setIsImporting(false);
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  if (!preview) {
    return null;
  }

  const warningPreview = report?.errors.slice(0, WARNING_PREVIEW_LIMIT) ?? [];
  const hiddenWarnings = Math.max(
    (report?.errors.length ?? 0) - WARNING_PREVIEW_LIMIT,
    0
  );

  return (
    <Dialog
      open={open}
      onClose={handleAskLater}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { overflow: 'hidden' } }}
    >
      <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>
        {report
          ? t('legacyMigration:successTitle')
          : t('legacyMigration:title')}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5}>
          {report ? (
            <Alert severity="success">
              {t('legacyMigration:successDescription')}
            </Alert>
          ) : (
            <Typography color="text.secondary">
              {t('legacyMigration:description')}
            </Typography>
          )}

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 1,
            }}
          >
            <CountCard
              label={t('legacyMigration:counts.projects')}
              value={report?.importedCounts.projects ?? preview.projects}
            />
            <CountCard
              label={t('legacyMigration:counts.characters')}
              value={report?.importedCounts.characters ?? preview.characters}
            />
            <CountCard
              label={t('legacyMigration:counts.factions')}
              value={report?.importedCounts.factions ?? preview.factions}
            />
            <CountCard
              label={t('legacyMigration:counts.notes')}
              value={report?.importedCounts.notes ?? preview.notes}
            />
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              {t('legacyMigration:sourcePath')}
            </Typography>
            <Typography
              variant="body2"
              sx={{ mt: 0.5, wordBreak: 'break-all', fontFamily: 'monospace' }}
            >
              {preview.sourcePath}
            </Typography>
          </Box>

          {report && (
            <Alert severity={report.uploadsCopied ? 'info' : 'warning'}>
              {report.uploadsCopied
                ? t('legacyMigration:uploadsCopied')
                : t('legacyMigration:uploadsNotFound')}
            </Alert>
          )}

          {error && <Alert severity="error">{error}</Alert>}

          {warningPreview.length > 0 && (
            <Box>
              <Divider sx={{ mb: 1 }} />
              <Typography variant="subtitle2">
                {t('legacyMigration:warningsTitle')}
              </Typography>
              <List dense disablePadding sx={{ mt: 0.5 }}>
                {warningPreview.map((warning) => (
                  <ListItem key={warning} disableGutters>
                    <ListItemText
                      primary={warning}
                      primaryTypographyProps={{
                        variant: 'caption',
                        color: 'text.secondary',
                        sx: { wordBreak: 'break-word' },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
              {hiddenWarnings > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {t('legacyMigration:warningsMore', { count: hiddenWarnings })}
                </Typography>
              )}
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {report ? (
          <>
            <Button onClick={handleAskLater} color="inherit">
              {t('common:close')}
            </Button>
            <Button onClick={handleReload} variant="contained">
              {t('legacyMigration:reload')}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleAskLater} color="inherit" disabled={isImporting}>
              {t('legacyMigration:askLater')}
            </Button>
            <Button onClick={handleSkip} color="inherit" disabled={isImporting}>
              {t('legacyMigration:skip')}
            </Button>
            <Button
              onClick={handleImport}
              variant="contained"
              disabled={isImporting}
              startIcon={isImporting ? <CircularProgress size={16} /> : null}
            >
              {isImporting
                ? t('legacyMigration:importing')
                : t('legacyMigration:import')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

type CountCardProps = {
  label: string;
  value: number;
};

const CountCard: React.FC<CountCardProps> = ({ label, value }) => (
  <Box
    sx={{
      p: 1.25,
      borderRadius: 2,
      border: '1px solid rgba(255,255,255,0.12)',
      background: 'rgba(255,255,255,0.04)',
      minWidth: 0,
    }}
  >
    <Typography variant="h6" sx={{ lineHeight: 1 }}>
      {value}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
  </Box>
);
