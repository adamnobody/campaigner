import React, { useEffect, useState } from 'react';
import {
  Box, Typography, TextField, Button,
  FormControl, InputLabel, Select, MenuItem,
  useTheme, alpha,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SettingsIcon from '@mui/icons-material/Settings';
import WarningIcon from '@mui/icons-material/Warning';
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
      const blob = res.data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (currentProject?.name || 'project').replace(/[^a-zA-Zа-яА-Я0-9]/g, '_');
      a.download = `campaigner-${safeName}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSnackbar(t('projectSettings:snackbar.exported'), 'success');
    } catch {
      showSnackbar(t('projectSettings:snackbar.exportError'), 'error');
    } finally {
      setExporting(false);
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
    <Box maxWidth={700}>
      <Typography
        variant="h4"
        sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: 'text.primary', mb: 3 }}
      >
        {t('projectSettings:page.title')}
      </Typography>

      {/* General */}
      <GlassCard sx={{ p: 3, mb: 3 }}>
        <SectionHeader
          icon={<SettingsIcon sx={{ fontSize: '1.2rem' }} />}
          title={t('projectSettings:sections.general')}
        />
        <TextField
          fullWidth
          label={t('projectSettings:fields.projectName')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
        />
        <TextField
          fullWidth
          label={t('projectSettings:fields.description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
          multiline
          rows={3}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>{statusLabel}</InputLabel>
          <Select value={status} label={statusLabel} onChange={(e) => setStatus(e.target.value)}>
            {PROJECT_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {t(`projectSettings:status.${s}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box display="flex" justifyContent="flex-end" mt={2}>
          <DndButton
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            loading={saving}
          >
            {t('common:save')}
          </DndButton>
        </Box>
      </GlassCard>

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
          <Typography variant="h6" sx={{ fontFamily: '"Cinzel", serif', fontWeight: 600, color: theme.palette.error.main }}>
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
    </Box>
  );
};
