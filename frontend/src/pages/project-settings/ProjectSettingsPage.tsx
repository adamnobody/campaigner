import React, { useEffect, useRef, useState } from 'react';
import {
  Box, Typography, TextField, Button,
  FormControl, InputLabel, Select, MenuItem,
  CircularProgress, useTheme, alpha,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SettingsIcon from '@mui/icons-material/Settings';
import WarningIcon from '@mui/icons-material/Warning';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '@/store/useProjectStore';
import { useUIStore } from '@/store/useUIStore';
import { PROJECT_STATUSES } from '@campaigner/shared';
import { projectsApi } from '@/api/projects';
import { DndButton } from '@/components/ui/DndButton';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import {
  CampaignerFieldRow,
  CampaignerPage,
  CampaignerPageHeader,
  CampaignerSurface,
} from '@/components/ui/CampaignerPrimitives';
import { useAssetUrl } from '@/hooks/useAssetUrl';

export const ProjectSettingsPage: React.FC = () => {
  const { t } = useTranslation(['projectSettings', 'common']);
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const navigate = useNavigate();
  const theme = useTheme();
  const { currentProject, fetchProject, updateProject, deleteProject } = useProjectStore();
  const { showSnackbar, showConfirmDialog } = useUIStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<string>('active');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const coverUrl = useAssetUrl(currentProject?.coverImagePath);

  useEffect(() => {
    fetchProject(pid);
  }, [pid, fetchProject]);

  useEffect(() => {
    if (currentProject) {
      setName(currentProject.name);
      setDescription(currentProject.description || '');
      setStatus(currentProject.status);
    }
  }, [currentProject]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProject(pid, { name, description, status: status as any });
      showSnackbar(t('projectSettings:snackbar.saved'), 'success');
    } catch {
      showSnackbar(t('projectSettings:snackbar.saveError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await projectsApi.exportProject(pid);
      if ('cancelled' in res) {
        if (res.cancelled) {
          return;
        }
        showSnackbar(
          t('projectSettings:snackbar.exportedPath', { path: res.path, defaultValue: res.path }),
          'success',
        );
        return;
      }
    } catch {
      showSnackbar(t('projectSettings:snackbar.exportError'), 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleCoverChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploadingCover(true);
    try {
      await projectsApi.uploadCover(pid, file);
      await fetchProject(pid);
      showSnackbar(
        t('projectSettings:snackbar.coverUpdated', { defaultValue: 'Project cover updated' }),
        'success',
      );
    } catch {
      showSnackbar(
        t('projectSettings:snackbar.coverError', { defaultValue: 'Could not update project cover' }),
        'error',
      );
    } finally {
      setUploadingCover(false);
    }
  };

  const handleDelete = () => {
    const projectName = currentProject?.name ?? '';
    showConfirmDialog(
      t('projectSettings:confirm.deleteTitle'),
      t('projectSettings:confirm.deleteMessage', { name: projectName }),
      async () => {
        try {
          await deleteProject(pid);
          showSnackbar(t('projectSettings:snackbar.deleted'), 'success');
          navigate('/');
        } catch {
          showSnackbar(t('projectSettings:snackbar.deleteError'), 'error');
        }
      },
    );
  };

  if (!currentProject) return <LoadingScreen />;

  const statusLabel = t('projectSettings:fields.status');

  return (
    <CampaignerPage maxWidth={900}>
      <CampaignerPageHeader
        title={t('projectSettings:page.title')}
        description={currentProject.name}
      />

      {/* General */}
      <CampaignerSurface sx={{ overflow: 'hidden', mb: 3 }}>
        <Box sx={{ px: 2.25, pt: 2.25 }}>
        <SectionHeader
          icon={<SettingsIcon sx={{ fontSize: '1.2rem' }} />}
          title={t('projectSettings:sections.general')}
        />
        </Box>
        <CampaignerFieldRow
          label={t('projectSettings:fields.cover', { defaultValue: 'Project cover' })}
          hint={t('projectSettings:fields.coverHint', { defaultValue: 'Used on the project shelf' })}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '180px minmax(0, 1fr)' },
              gap: 1.5,
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                height: 96,
                borderRadius: '10px',
                border: `1px solid ${theme.campaigner.surface.border}`,
                backgroundColor: theme.campaigner.surface.raised,
                backgroundImage: coverUrl ? `url("${coverUrl}")` : 'none',
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                display: 'grid',
                placeItems: 'center',
                overflow: 'hidden',
              }}
            >
              {!coverUrl && <AddPhotoAlternateOutlinedIcon sx={{ color: 'text.disabled' }} />}
              {uploadingCover && (
                <Box sx={{ inset: 0, width: '100%', height: '100%', display: 'grid', placeItems: 'center', bgcolor: alpha(theme.palette.background.default, 0.72) }}>
                  <CircularProgress size={24} />
                </Box>
              )}
            </Box>
            <Box>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={handleCoverChange}
              />
              <Button
                variant="outlined"
                startIcon={<AddPhotoAlternateOutlinedIcon />}
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
              >
                {coverUrl
                  ? t('projectSettings:cover.replace', { defaultValue: 'Replace cover' })
                  : t('projectSettings:cover.add', { defaultValue: 'Add cover' })}
              </Button>
            </Box>
          </Box>
        </CampaignerFieldRow>
        <CampaignerFieldRow label={t('projectSettings:fields.projectName')}>
        <TextField
          fullWidth
          aria-label={t('projectSettings:fields.projectName')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          size="small"
        />
        </CampaignerFieldRow>
        <CampaignerFieldRow label={t('projectSettings:fields.description')}>
        <TextField
          fullWidth
          aria-label={t('projectSettings:fields.description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          rows={3}
          size="small"
        />
        </CampaignerFieldRow>
        <CampaignerFieldRow label={statusLabel}>
        <FormControl fullWidth size="small">
          <InputLabel>{statusLabel}</InputLabel>
          <Select value={status} label={statusLabel} onChange={(e) => setStatus(e.target.value)}>
            {PROJECT_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {t(`projectSettings:status.${s}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        </CampaignerFieldRow>

        <Box display="flex" justifyContent="flex-end" sx={{ px: 2.25, py: 2 }}>
          <DndButton
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            loading={saving}
          >
            {t('common:save')}
          </DndButton>
        </Box>
      </CampaignerSurface>

      {/* Export */}
      <GlassCard sx={{ p: 3, mb: 3 }}>
        <SectionHeader
          icon={<FileDownloadIcon sx={{ fontSize: '1.2rem' }} />}
          title={t('projectSettings:sections.export')}
        />
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          {t('projectSettings:export.description')}
        </Typography>
        <DndButton
          variant="outlined"
          startIcon={<FileDownloadIcon />}
          onClick={handleExport}
          loading={exporting}
          sx={{ borderColor: alpha(theme.palette.info.main, 0.4), color: theme.palette.info.main }}
        >
          {t('projectSettings:export.button')}
        </DndButton>
      </GlassCard>

      {/* Danger Zone */}
      <GlassCard sx={{
        p: 3,
        backgroundColor: alpha(theme.palette.error.main, 0.04),
        border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 40, height: 40, borderRadius: 2,
            backgroundColor: theme.palette.error.main, color: '#fff',
            boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`,
          }}>
            <WarningIcon sx={{ fontSize: '1.2rem' }} />
          </Box>
          <Typography variant="h6" sx={{ color: theme.palette.error.main }}>
            {t('projectSettings:sections.dangerZone')}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          {t('projectSettings:dangerZone.hint')}
        </Typography>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteForeverIcon />}
          onClick={handleDelete}
          aria-label={t('projectSettings:dangerZone.deleteProject')}
        >
          {t('projectSettings:dangerZone.deleteProject')}
        </Button>
      </GlassCard>
    </CampaignerPage>
  );
};
