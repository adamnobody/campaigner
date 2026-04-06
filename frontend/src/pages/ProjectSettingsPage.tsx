import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/store/useProjectStore';
import { useUIStore } from '@/store/useUIStore';
import { PROJECT_STATUSES } from '@campaigner/shared';
import { projectsApi } from '@/api/projects';
import { DndButton } from '@/components/ui/DndButton';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export const ProjectSettingsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const navigate = useNavigate();
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
      showSnackbar('Настройки сохранены', 'success');
    } catch {
      showSnackbar('Ошибка сохранения', 'error');
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
      showSnackbar('Проект экспортирован!', 'success');
    } catch {
      showSnackbar('Ошибка экспорта', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = () => {
    showConfirmDialog(
      'Удалить проект',
      `Вы уверены, что хотите удалить "${currentProject?.name}"? Будут удалены ВСЕ данные: персонажи, заметки, карты и таймлайн. Это действие НЕЛЬЗЯ отменить.`,
      async () => {
        try {
          await deleteProject(pid);
          showSnackbar('Проект удалён', 'success');
          navigate('/');
        } catch {
          showSnackbar('Ошибка удаления', 'error');
        }
      }
    );
  };

  if (!currentProject) return <LoadingScreen />;

  return (
    <Box maxWidth={700}>
      <Typography
        variant="h4"
        sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: '#fff', mb: 3 }}
      >
        Настройки проекта
      </Typography>

      {/* General */}
      <Paper sx={{
        p: 3, mb: 3,
        backgroundColor: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <Typography
          variant="h6"
          sx={{ fontFamily: '"Cinzel", serif', fontWeight: 600, color: '#fff', mb: 2 }}
        >
          Основное
        </Typography>
        <TextField
          fullWidth
          label="Название проекта"
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
        />
        <TextField
          fullWidth
          label="Описание"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
          multiline
          rows={3}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Статус</InputLabel>
          <Select value={status} label="Статус" onChange={(e) => setStatus(e.target.value)}>
            {PROJECT_STATUSES.map(s => (
              <MenuItem key={s} value={s}>
                {s === 'active' ? 'Активный' : 'Архив'}
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
            Сохранить
          </DndButton>
        </Box>
      </Paper>

      {/* Export */}
      <Paper sx={{
        p: 3, mb: 3,
        backgroundColor: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <Typography
          variant="h6"
          sx={{ fontFamily: '"Cinzel", serif', fontWeight: 600, color: '#fff', mb: 1 }}
        >
          Экспорт данных
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 2 }}>
          Скачайте полную копию проекта в формате JSON. Включает все персонажи, заметки,
          маркеры карты, таймлайн, теги и связи. Файл можно импортировать обратно на главной странице.
        </Typography>
        <DndButton
          variant="outlined"
          startIcon={<FileDownloadIcon />}
          onClick={handleExport}
          loading={exporting}
          sx={{ borderColor: 'rgba(130,130,255,0.4)', color: 'rgba(130,130,255,0.9)' }}
        >
          Экспортировать в JSON
        </DndButton>
      </Paper>

      {/* Danger Zone */}
      <Paper sx={{
        p: 3,
        backgroundColor: 'rgba(255,50,50,0.04)',
        border: '1px solid rgba(255,50,50,0.2)',
      }}>
        <Typography
          variant="h6"
          sx={{ fontFamily: '"Cinzel", serif', fontWeight: 600, color: 'rgba(255,100,100,0.9)', mb: 1 }}
        >
          Опасная зона
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 2 }}>
          Удаление проекта необратимо. Рекомендуем сначала сделать экспорт.
        </Typography>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteForeverIcon />}
          onClick={handleDelete}
        >
          Удалить проект
        </Button>
      </Paper>
    </Box>
  );
};