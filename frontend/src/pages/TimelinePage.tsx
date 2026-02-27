import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, TextField, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Chip, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import TimelineIcon from '@mui/icons-material/Timeline';
import {
  Timeline, TimelineItem, TimelineSeparator, TimelineDot,
  TimelineConnector, TimelineContent, TimelineOppositeContent,
} from '@mui/lab';
import { useParams } from 'react-router-dom';
import { useTimelineStore } from '@/store/useTimelineStore';
import { useUIStore } from '@/store/useUIStore';
import { DndButton } from '@/components/ui/DndButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import type { TimelineEvent } from '@campaigner/shared';

export const TimelinePage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const { events, loading, fetchEvents, createEvent, updateEvent, deleteEvent } = useTimelineStore();
  const { showSnackbar, showConfirmDialog } = useUIStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [era, setEra] = useState('');

  useEffect(() => {
    fetchEvents(pid);
  }, [pid, fetchEvents]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setEventDate('');
    setEra('');
    setEditingEvent(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (event: TimelineEvent) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description || '');
    setEventDate(event.eventDate);
    setEra(event.era || '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !eventDate.trim()) return;
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, { title, description, eventDate, era });
        showSnackbar('Event updated', 'success');
      } else {
        await createEvent({ projectId: pid, title, description, eventDate, era, sortOrder: 0 });
        showSnackbar('Event created', 'success');
      }
      setDialogOpen(false);
      resetForm();
    } catch {
      showSnackbar('Failed to save event', 'error');
    }
  };

  const handleDelete = (id: number, title: string) => {
    showConfirmDialog('Delete Event', `Delete "${title}"?`, async () => {
      try {
        await deleteEvent(id);
        showSnackbar('Event deleted', 'success');
      } catch {
        showSnackbar('Failed', 'error');
      }
    });
  };

  // Группируем по эрам
  const eras = [...new Set(events.map(e => e.era || 'Unknown Era'))];

  if (loading && events.length === 0) return <LoadingScreen />;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h3">Timeline</Typography>
        <DndButton variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Add Event
        </DndButton>
      </Box>

      {events.length === 0 ? (
        <EmptyState
          icon={<TimelineIcon sx={{ fontSize: 64 }} />}
          title="No timeline events yet"
          description="Build a chronological history for your world — ages, wars, discoveries, and turning points"
          actionLabel="Add Event"
          onAction={handleOpenCreate}
        />
      ) : (
        <Box>
          {eras.map(eraName => {
            const eraEvents = events.filter(e => (e.era || 'Unknown Era') === eraName);
            return (
              <Box key={eraName} mb={4}>
                <Typography variant="h4" color="primary" sx={{ mb: 2 }}>
                  {eraName}
                </Typography>
                <Timeline position="alternate">
                  {eraEvents.map((event, index) => (
                    <TimelineItem key={event.id}>
                      <TimelineOppositeContent sx={{ flex: 0.3 }}>
                        <Typography variant="body2" color="primary.light" fontWeight={600}>
                          {event.eventDate}
                        </Typography>
                      </TimelineOppositeContent>
                      <TimelineSeparator>
                        <TimelineDot color="primary" />
                        {index < eraEvents.length - 1 && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent>
                        <Paper sx={{ p: 2, '&:hover': { borderColor: 'primary.main' } }}>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                            <Typography variant="h6">{event.title}</Typography>
                            <Box>
                              <IconButton size="small" onClick={() => handleOpenEdit(event)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={() => handleDelete(event.id, event.title)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                          {event.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {event.description}
                            </Typography>
                          )}
                          {event.tags && event.tags.length > 0 && (
                            <Box display="flex" gap={0.5} mt={1} flexWrap="wrap">
                              {event.tags.map(tag => (
                                <Chip key={tag.id} label={tag.name} size="small" sx={{ backgroundColor: tag.color, color: '#fff' }} />
                              ))}
                            </Box>
                          )}
                        </Paper>
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Event Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingEvent ? 'Edit Event' : 'Add Timeline Event'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth label="Event Title *" value={title}
            onChange={(e) => setTitle(e.target.value)} margin="normal"
            placeholder="e.g. The Fall of Netheril"
          />
          <TextField
            fullWidth label="Date *" value={eventDate}
            onChange={(e) => setEventDate(e.target.value)} margin="normal"
            placeholder="e.g. Year 3520 of the Third Age, or 1492 DR"
            helperText="Free format — use your world's calendar"
          />
          <TextField
            fullWidth label="Era" value={era}
            onChange={(e) => setEra(e.target.value)} margin="normal"
            placeholder="e.g. The Age of Myth, First Era"
          />
          <TextField
            fullWidth label="Description" value={description}
            onChange={(e) => setDescription(e.target.value)} margin="normal"
            multiline rows={4}
            placeholder="What happened..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancel</Button>
          <DndButton variant="contained" onClick={handleSave} disabled={!title.trim() || !eventDate.trim()}>
            {editingEvent ? 'Update' : 'Add'}
          </DndButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};