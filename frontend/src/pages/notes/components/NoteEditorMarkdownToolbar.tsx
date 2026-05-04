import React from 'react';
import { Box, IconButton, Divider, Tooltip, useTheme, alpha } from '@mui/material';
import { useTranslation } from 'react-i18next';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import CodeIcon from '@mui/icons-material/Code';
import TitleIcon from '@mui/icons-material/Title';
import LinkIcon from '@mui/icons-material/Link';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { ToolbarButton } from '@/pages/notes/components/ToolbarButton';

type Props = {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onInsertMarkdown: (kind: string) => void;
  isWiki: boolean;
};

export const NoteEditorMarkdownToolbar: React.FC<Props> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onInsertMarkdown,
  isWiki,
}) => {
  const theme = useTheme();
  const { t } = useTranslation(['notes', 'common']);
  return (
    <Box sx={{ display: 'flex', gap: 0.5, p: 1, borderBottom: `1px solid ${theme.palette.divider}`, flexWrap: 'wrap', alignItems: 'center' }}>
      <Tooltip title={t('notes:toolbar.undo')}>
        <span>
          <IconButton size="small" onClick={onUndo} disabled={!canUndo}
            sx={{ color: 'text.secondary', '&.Mui-disabled': { color: 'text.disabled' }, borderRadius: 1, width: 30, height: 30 }}>
            <UndoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={t('notes:toolbar.redo')}>
        <span>
          <IconButton size="small" onClick={onRedo} disabled={!canRedo}
            sx={{ color: 'text.secondary', '&.Mui-disabled': { color: 'text.disabled' }, borderRadius: 1, width: 30, height: 30 }}>
            <RedoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: theme.palette.divider }} />
      <ToolbarButton icon={<TitleIcon />} tooltip={t('notes:toolbar.heading')} onClick={() => onInsertMarkdown('heading')} />
      <ToolbarButton icon={<FormatBoldIcon />} tooltip={t('notes:toolbar.bold')} onClick={() => onInsertMarkdown('bold')} />
      <ToolbarButton icon={<FormatItalicIcon />} tooltip={t('notes:toolbar.italic')} onClick={() => onInsertMarkdown('italic')} />
      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: theme.palette.divider }} />
      <ToolbarButton icon={<FormatListBulletedIcon />} tooltip={t('notes:toolbar.list')} onClick={() => onInsertMarkdown('list')} />
      <ToolbarButton icon={<FormatQuoteIcon />} tooltip={t('notes:toolbar.quote')} onClick={() => onInsertMarkdown('quote')} />
      <ToolbarButton icon={<CodeIcon />} tooltip={t('notes:toolbar.code')} onClick={() => onInsertMarkdown('code')} />
      <ToolbarButton icon={<LinkIcon />} tooltip={t('notes:toolbar.link')} onClick={() => onInsertMarkdown('link')} />
      <ToolbarButton icon={<HorizontalRuleIcon />} tooltip={t('notes:toolbar.hr')} onClick={() => onInsertMarkdown('hr')} />
      {isWiki && (
        <>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: theme.palette.divider }} />
          <Tooltip title={t('notes:toolbar.wikiLink')}>
            <IconButton size="small" onClick={() => onInsertMarkdown('wikilink')}
              sx={{ color: alpha(theme.palette.info.main, 0.8), borderRadius: 1, width: 30, height: 30,
                '&:hover': { color: theme.palette.info.main, backgroundColor: alpha(theme.palette.info.main, 0.1) } }}>
              <MenuBookIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      )}
    </Box>
  );
};
