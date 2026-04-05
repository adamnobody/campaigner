import React from 'react';
import { Box, IconButton, Divider, Tooltip } from '@mui/material';
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
import { ToolbarButton } from '@/pages/note-editor/ToolbarButton';

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
}) => (
  <Box sx={{ display: 'flex', gap: 0.5, p: 1, borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', alignItems: 'center' }}>
    <Tooltip title="Отменить (Ctrl+Z)">
      <span>
        <IconButton size="small" onClick={onUndo} disabled={!canUndo}
          sx={{ color: 'rgba(255,255,255,0.4)', '&.Mui-disabled': { color: 'rgba(255,255,255,0.12)' }, borderRadius: 1, width: 30, height: 30 }}>
          <UndoIcon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
    <Tooltip title="Повторить (Ctrl+Shift+Z)">
      <span>
        <IconButton size="small" onClick={onRedo} disabled={!canRedo}
          sx={{ color: 'rgba(255,255,255,0.4)', '&.Mui-disabled': { color: 'rgba(255,255,255,0.12)' }, borderRadius: 1, width: 30, height: 30 }}>
          <RedoIcon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
    <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: 'rgba(255,255,255,0.08)' }} />
    <ToolbarButton icon={<TitleIcon />} tooltip="Заголовок" onClick={() => onInsertMarkdown('heading')} />
    <ToolbarButton icon={<FormatBoldIcon />} tooltip="Жирный (Ctrl+B)" onClick={() => onInsertMarkdown('bold')} />
    <ToolbarButton icon={<FormatItalicIcon />} tooltip="Курсив (Ctrl+I)" onClick={() => onInsertMarkdown('italic')} />
    <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: 'rgba(255,255,255,0.08)' }} />
    <ToolbarButton icon={<FormatListBulletedIcon />} tooltip="Список" onClick={() => onInsertMarkdown('list')} />
    <ToolbarButton icon={<FormatQuoteIcon />} tooltip="Цитата" onClick={() => onInsertMarkdown('quote')} />
    <ToolbarButton icon={<CodeIcon />} tooltip="Код" onClick={() => onInsertMarkdown('code')} />
    <ToolbarButton icon={<LinkIcon />} tooltip="Ссылка" onClick={() => onInsertMarkdown('link')} />
    <ToolbarButton icon={<HorizontalRuleIcon />} tooltip="Разделитель" onClick={() => onInsertMarkdown('hr')} />
    {isWiki && (
      <>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: 'rgba(255,255,255,0.08)' }} />
        <Tooltip title="Внутренняя вики-ссылка">
          <IconButton size="small" onClick={() => onInsertMarkdown('wikilink')}
            sx={{ color: 'rgba(78,205,196,0.6)', borderRadius: 1, width: 30, height: 30,
              '&:hover': { color: 'rgba(78,205,196,1)', backgroundColor: 'rgba(78,205,196,0.1)' } }}>
            <MenuBookIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </>
    )}
  </Box>
);
