import { Divider, ListItemText, Menu, MenuItem } from '@mui/material';
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
  const hasSelection = Boolean(menu?.targetObject);

  return (
    <Menu
      open={Boolean(menu)}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={menu ? { top: menu.mouseY, left: menu.mouseX } : undefined}
    >
      {!hasSelection && (
        <>
          <MenuItem onClick={() => { onAddMarker(); onClose(); }}>
            <ListItemText>{t('map:canvas.context.addMarker')}</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { onAddText(); onClose(); }}>
            <ListItemText>{t('map:canvas.context.addText')}</ListItemText>
          </MenuItem>
          {!isMapScene(sceneType) && (
            <MenuItem onClick={() => { onAddImage(); onClose(); }}>
              <ListItemText>{t('map:canvas.context.addImage')}</ListItemText>
            </MenuItem>
          )}
          <Divider />
          {SHAPE_MENU_VARIANTS.map((variant) => (
            <MenuItem key={variant} onClick={() => { onAddShape(variant); onClose(); }}>
              <ListItemText>{t(`map:shapePanel.variants.${variant}`)}</ListItemText>
            </MenuItem>
          ))}
        </>
      )}
      {hasSelection && (
        <>
          <MenuItem onClick={() => { onEditSelected(); onClose(); }}>
            <ListItemText>{t('map:canvas.context.edit')}</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { onDuplicateSelected(); onClose(); }}>
            <ListItemText>{t('map:canvas.context.duplicate')}</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { onBringToFront(); onClose(); }}>
            <ListItemText>{t('map:canvas.context.bringToFront')}</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { onSendToBack(); onClose(); }}>
            <ListItemText>{t('map:canvas.context.sendToBack')}</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { onDeleteSelected(); onClose(); }}>
            <ListItemText>{t('map:canvas.context.delete')}</ListItemText>
          </MenuItem>
        </>
      )}
    </Menu>
  );
}
