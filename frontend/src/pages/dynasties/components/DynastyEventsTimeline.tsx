import React from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, Typography, Paper, IconButton, Chip } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EventIcon from '@mui/icons-material/Event';
import {
  DYNASTY_EVENT_IMPORTANCE_COLORS,
} from '@campaigner/shared';
import type { DynastyEvent } from '@campaigner/shared';
import { useTranslation } from 'react-i18next';

// ==================== Sortable Event Item ====================

interface SortableEventProps {
  event: DynastyEvent;
  onEdit: (evt: DynastyEvent) => void;
  onDelete: (id: number, title: string) => void;
}

const SortableEvent: React.FC<SortableEventProps> = ({ event, onEdit, onDelete }) => {
  const theme = useTheme();
  const { t } = useTranslation(['dynasties', 'common']);
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: event.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  const impColor = DYNASTY_EVENT_IMPORTANCE_COLORS[event.importance] || theme.palette.success.main;

  return (
    <Box ref={setNodeRef} style={style} sx={{ position: 'relative', mb: 2.5, '&:hover .evt-actions': { opacity: 1 } }}>
      {/* Timeline dot */}
      <Box sx={{
        position: 'absolute', left: -21, top: 8,
        width: 12, height: 12, borderRadius: '50%',
        backgroundColor: impColor,
        border: `2px solid ${alpha(theme.palette.background.paper, 0.9)}`,
        boxShadow: `0 0 8px ${impColor}60`,
      }} />

      <Paper sx={{
        p: 0, overflow: 'hidden',
        backgroundColor: `${impColor}08`,
        border: `1px solid ${impColor}20`,
        borderRadius: 2,
        boxShadow: isDragging ? `0 8px 30px ${alpha(theme.palette.common.black, 0.4)}` : 'none',
        transition: 'box-shadow 0.2s',
      }}>
        <Box display="flex" alignItems="stretch">
          {/* Drag handle */}
          <Box
            {...attributes}
            {...listeners}
            sx={{
              display: 'flex', alignItems: 'center', px: 0.75,
              cursor: 'grab',
              backgroundColor: `${impColor}10`,
              borderRight: `1px solid ${impColor}15`,
              '&:hover': { backgroundColor: `${impColor}20` },
              '&:active': { cursor: 'grabbing' },
            }}
          >
            <DragIndicatorIcon sx={{ fontSize: 18, color: alpha(theme.palette.common.white, 0.25) }} />
          </Box>

          {/* Content */}
          <Box sx={{ p: 2, flexGrow: 1, minWidth: 0 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box sx={{ minWidth: 0 }}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5} flexWrap="wrap">
                  <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.95rem' }}>
                    {event.title}
                  </Typography>
                  <Chip
                    label={t(`dynasties:eventImportance.${event.importance}`, { defaultValue: event.importance })}
                    size="small"
                    sx={{
                      height: 20, fontSize: '0.6rem',
                      backgroundColor: `${impColor}25`,
                      color: impColor,
                    }}
                  />
                </Box>
                <Typography sx={{ color: alpha(theme.palette.primary.main, 0.7), fontSize: '0.8rem' }}>
                  📅 {event.eventDate}
                </Typography>
                {event.description && (
                  <Typography sx={{ color: alpha(theme.palette.text.secondary, 0.8), fontSize: '0.85rem', mt: 0.5 }}>
                    {event.description}
                  </Typography>
                )}
              </Box>

              {/* Actions */}
              <Box className="evt-actions" display="flex" gap={0} sx={{ opacity: 0, transition: 'opacity 0.15s', flexShrink: 0 }}>
                <IconButton size="small" onClick={() => onEdit(event)}>
                  <EditIcon fontSize="small" sx={{ color: alpha(theme.palette.text.secondary, 0.85) }} />
                </IconButton>
                <IconButton size="small" onClick={() => onDelete(event.id, event.title)}>
                  <DeleteIcon fontSize="small" sx={{ color: alpha(theme.palette.error.main, 0.5) }} />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

interface DynastyEventsTimelineProps {
  events: DynastyEvent[];
  onEdit: (evt: DynastyEvent) => void;
  onDelete: (id: number, title: string) => void;
  onReorder: (reorderedEvents: DynastyEvent[]) => void;
}

export const DynastyEventsTimeline: React.FC<DynastyEventsTimelineProps> = ({
  events, onEdit, onDelete, onReorder,
}) => {
  const theme = useTheme();
  const { t } = useTranslation(['dynasties', 'common']);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = events.findIndex(e => e.id === active.id);
    const newIndex = events.findIndex(e => e.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(events, oldIndex, newIndex);
    onReorder(reordered);
  };

  if (events.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <EventIcon sx={{ fontSize: 40, color: alpha(theme.palette.text.secondary, 0.25), mb: 1 }} />
        <Typography sx={{ color: alpha(theme.palette.text.secondary, 0.65), fontSize: '0.9rem' }}>
          {t('dynasties:timeline.emptyHint')}
        </Typography>
      </Box>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={events.map(e => e.id)} strategy={verticalListSortingStrategy}>
        <Box sx={{ position: 'relative', pl: 3 }}>
          {/* Timeline line */}
          <Box sx={{
            position: 'absolute', left: 11, top: 0, bottom: 0,
            width: 2, backgroundColor: alpha(theme.palette.primary.main, 0.15),
          }} />

          {events.map(evt => (
            <SortableEvent
              key={evt.id}
              event={evt}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </Box>
      </SortableContext>
    </DndContext>
  );
};
