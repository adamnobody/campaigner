import React from 'react';
import { Box, IconButton, Divider, Tooltip, useTheme, alpha } from '@mui/material';
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
  return (
    <Box sx={{ display: 'flex', gap: 0.5, p: 1, borderBottom: `1px solid ${theme.palette.divider}`, flexWrap: 'wrap', alignItems: 'center' }}>
      <Tooltip title="Отменить (Ctrl+Z)">
        <span>
          <IconButton size="small" onClick={onUndo} disabled={!canUndo}
            sx={{ color: 'text.secondary', '&.Mui-disabled': { color: 'text.disabled' }, borderRadius: 1, width: 30, height: 30 }}>
            <UndoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Повторить (Ctrl+Shift+Z)">
        <span>
          <IconButton size="small" onClick={onRedo} disabled={!canRedo}
            sx={{ color: 'text.secondary', '&.Mui-disabled': { color: 'text.disabled' }, borderRadius: 1, width: 30, height: 30 }}>
            <RedoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: theme.palette.divider }} />
      <ToolbarButton icon={<TitleIcon />} tooltip="Заголовок" onClick={() => onInsertMarkdown('heading')} />
      <ToolbarButton icon={<FormatBoldIcon />} tooltip="Жирный (Ctrl+B)" onClick={() => onInsertMarkdown('bold')} />
      <ToolbarButton icon={<FormatItalicIcon />} tooltip="Курсив (Ctrl+I)" onClick={() => onInsertMarkdown('italic')} />
      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: theme.palette.divider }} />
      <ToolbarButton icon={<FormatListBulletedIcon />} tooltip="Список" onClick={() => onInsertMarkdown('list')} />
      <ToolbarButton icon={<FormatQuoteIcon />} tooltip="Цитата" onClick={() => onInsertMarkdown('quote')} />
      <ToolbarButton icon={<CodeIcon />} tooltip="Код" onClick={() => onInsertMarkdown('code')} />
      <ToolbarButton icon={<LinkIcon />} tooltip="Ссылка" onClick={() => onInsertMarkdown('link')} />
      <ToolbarButton icon={<HorizontalRuleIcon />} tooltip="Разделитель" onClick={() => onInsertMarkdown('hr')} />
      {isWiki && (
        <>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: theme.palette.divider }} />
          <Tooltip title="Внутренняя вики-ссылка">
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
