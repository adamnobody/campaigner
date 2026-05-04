import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, IconButton, Tooltip, useTheme, alpha } from '@mui/material';
import { useTranslation } from 'react-i18next';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

export interface EditorWikiLink {
  id: number;
  sourceNoteId: number;
  targetNoteId: number;
  sourceTitle?: string;
  targetTitle?: string;
  label: string;
}

type Props = {
  wikiLinks: EditorWikiLink[];
  currentNoteId: number;
  onNavigateToNote: (noteId: number) => void;
  onOpenCreateLink: () => void;
  onDeleteLink: (linkId: number) => void;
};

export const NoteEditorWikiSidebar: React.FC<Props> = ({
  wikiLinks,
  currentNoteId,
  onNavigateToNote,
  onOpenCreateLink,
  onDeleteLink,
}) => {
  const theme = useTheme();
  const { t } = useTranslation(['notes', 'common']);
  return (
    <Box sx={{
      width: 260, flexShrink: 0, borderLeft: `1px solid ${theme.palette.divider}`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      backgroundColor: alpha(theme.palette.background.paper, 0.5),
    }}>
      <Box sx={{ p: 1.5, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={0.5}>
          <AccountTreeIcon sx={{ fontSize: 16, color: alpha(theme.palette.info.main, 0.6) }} />
          <Typography variant="subtitle2" sx={{ color: alpha(theme.palette.info.main, 0.8), fontWeight: 600, fontSize: '0.8rem' }}>
            {t('notes:wikiSidebar.title', { count: wikiLinks.length })}
          </Typography>
        </Box>
        <Tooltip title={t('notes:wikiSidebar.addLink')}>
          <IconButton size="small" onClick={onOpenCreateLink}
            sx={{ color: alpha(theme.palette.info.main, 0.5), '&:hover': { color: theme.palette.info.main } }}>
            <AddIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
        {wikiLinks.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <AccountTreeIcon sx={{ fontSize: 32, color: alpha(theme.palette.text.primary, 0.08), mb: 1 }} />
            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
              {t('notes:wikiSidebar.emptyTitle')}
            </Typography>
            <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.15), display: 'block', fontSize: '0.65rem' }}>
              {t('notes:wikiSidebar.emptyHint')}
            </Typography>
          </Box>
        ) : (
          <List disablePadding dense>
            {wikiLinks.map(link => {
              const otherTitle = (link.sourceNoteId === currentNoteId ? link.targetTitle : link.sourceTitle) || '';
              const otherId = link.sourceNoteId === currentNoteId ? link.targetNoteId : link.sourceNoteId;
              return (
                <ListItem
                  key={link.id}
                  secondaryAction={
                    <IconButton size="small" onClick={() => onDeleteLink(link.id)} aria-label={t('notes:wikiSidebar.deleteLinkAria')}
                      sx={{ color: alpha(theme.palette.error.main, 0.3), '&:hover': { color: alpha(theme.palette.error.main, 0.7) } }}>
                      <DeleteIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  }
                  onClick={() => onNavigateToNote(otherId)}
                  sx={{
                    cursor: 'pointer', borderRadius: 1, mb: 0.5,
                    backgroundColor: alpha(theme.palette.info.main, 0.04),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.08)}`,
                    '&:hover': { backgroundColor: alpha(theme.palette.info.main, 0.1) },
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography sx={{ fontSize: '0.8rem', color: 'text.primary', fontWeight: 500 }} noWrap>
                        {otherTitle}
                      </Typography>
                    }
                    secondary={link.label ? (
                      <Typography variant="caption" sx={{ color: alpha(theme.palette.info.main, 0.5), fontSize: '0.65rem' }}>
                        {link.label}
                      </Typography>
                    ) : null}
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>

      <Box sx={{ p: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem', display: 'block', textAlign: 'center' }}>
          {t('notes:wikiSidebar.footerHint')}
        </Typography>
      </Box>
    </Box>
  );
};
