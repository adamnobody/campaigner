import { Divider, ListItemText, Menu, MenuItem, alpha, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { CanvasObject } from '@/api/canvas';
import { isMapScene } from '../canvas/canvasTools';
import type { ShapeVariant } from '../canvas/shapeObjectForm';

export type MapContextMenuState = {
  mouseX: number;
  mouseY: number;
  worldX: number;
  worldY: number;
  targetObject: CanvasObject | null;
} | null;

type Props = {
  menu: MapContextMenuState;
  sceneType?: string | null;
  onClose: () => void;
  onAddMarker: () => void;
  onAddText: () => void;
  onAddImage: () => void;
  onAddShape: (variant: ShapeVariant) => void;
  onDeleteSelected: () => void;
  onEditSelected: () => void;
  onDuplicateSelected: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
};

const SHAPE_MENU_VARIANTS: ShapeVariant[] = ['rectangle', 'ellipse', 'triangle', 'diamond', 'line'];

export function MapCanvasContextMenu({
  menu,
  sceneType,
  onClose,
  onAddMarker,
  onAddText,
  onAddImage,
  onAddShape,
  onDeleteSelected,
  onEditSelected,
  onDuplicateSelected,
  onBringToFront,
  onSendToBack,
}: Props) {
  const { t } = useTranslation(['map']);
  const theme = useTheme();
  const hasSelection = Boolean(menu?.targetObject);
  const itemSx = {
    minHeight: 36,
    mx: 0.5,
    px: 1.25,
    borderRadius: '7px',
    '& .MuiListItemText-primary': { fontSize: '0.78rem' },
  } as const;

  return (
    <Menu
      open={Boolean(menu)}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={menu ? { top: menu.mouseY, left: menu.mouseX } : undefined}
      slotProps={{
        paper: {
          sx: {
            minWidth: 210,
            p: 0.5,
            borderRadius: '12px',
            border: `1px solid ${theme.campaigner.surface.border}`,
            backgroundColor: alpha(theme.palette.background.default, 0.96),
            backdropFilter: 'blur(18px)',
          },
        },
      }}
    >
      {!hasSelection && (
        <>
          <MenuItem sx={itemSx} onClick={() => { onAddMarker(); onClose(); }}>
            <ListItemText>{t('map:canvas.context.addMarker')}</ListItemText>
          </MenuItem>
          <MenuItem sx={itemSx} onClick={() => { onAddText(); onClose(); }}>
            <ListItemText>{t('map:canvas.context.addText')}</ListItemText>
          </MenuItem>
          {!isMapScene(sceneType) && (
            <MenuItem sx={itemSx} onClick={() => { onAddImage(); onClose(); }}>
              <ListItemText>{t('map:canvas.context.addImage')}</ListItemText>
            </MenuItem>
          )}
          <Divider />
          {SHAPE_MENU_VARIANTS.map((variant) => (
            <MenuItem sx={itemSx} key={variant} onClick={() => { onAddShape(variant); onClose(); }}>
              <ListItemText>{t(`map:shapePanel.variants.${variant}`)}</ListItemText>
            </MenuItem>
          ))}
        </>
      )}
      {hasSelection && (
        <>
          <MenuItem sx={itemSx} onClick={() => { onEditSelected(); onClose(); }}>
            <ListItemText>{t('map:canvas.context.edit')}</ListItemText>
          </MenuItem>
          <MenuItem sx={itemSx} onClick={() => { onDuplicateSelected(); onClose(); }}>
            <ListItemText>{t('map:canvas.context.duplicate')}</ListItemText>
          </MenuItem>
          <MenuItem sx={itemSx} onClick={() => { onBringToFront(); onClose(); }}>
            <ListItemText>{t('map:canvas.context.bringToFront')}</ListItemText>
          </MenuItem>
          <MenuItem sx={itemSx} onClick={() => { onSendToBack(); onClose(); }}>
            <ListItemText>{t('map:canvas.context.sendToBack')}</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem
            sx={{ ...itemSx, color: 'error.main', '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.08) } }}
            onClick={() => { onDeleteSelected(); onClose(); }}
          >
            <ListItemText>{t('map:canvas.context.delete')}</ListItemText>
          </MenuItem>
        </>
      )}
    </Menu>
  );
}
