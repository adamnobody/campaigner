import { Divider, ListItemText, Menu, MenuItem } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { CanvasObject } from '@/api/canvas';

export type MapContextMenuState = {
  mouseX: number;
  mouseY: number;
  worldX: number;
  worldY: number;
  targetObject: CanvasObject | null;
} | null;

type Props = {
  menu: MapContextMenuState;
  onClose: () => void;
  onAddMarker: () => void;
  onAddText: () => void;
  onAddCurveText: () => void;
  onAddImage: () => void;
  onAddPolygon: () => void;
  onAddRectangle: () => void;
  onAddEllipse: () => void;
  onAddPolyline: () => void;
  onDeleteSelected: () => void;
  onEditSelected: () => void;
  onDuplicateSelected: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
};

export function MapCanvasContextMenu({
  menu,
  onClose,
  onAddMarker,
  onAddText,
  onAddCurveText,
  onAddImage,
  onAddPolygon,
  onAddRectangle,
  onAddEllipse,
  onAddPolyline,
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
          <MenuItem onClick={() => { onAddCurveText(); onClose(); }}>
            <ListItemText>{t('map:canvas.context.addCurveText')}</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { onAddImage(); onClose(); }}>
            <ListItemText>{t('map:canvas.context.addImage')}</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { onAddPolygon(); onClose(); }}>
            <ListItemText>{t('map:canvas.context.addPolygon')}</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { onAddRectangle(); onClose(); }}>
            <ListItemText>{t('map:canvas.context.addRectangle')}</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { onAddEllipse(); onClose(); }}>
            <ListItemText>{t('map:canvas.context.addEllipse')}</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { onAddPolyline(); onClose(); }}>
            <ListItemText>{t('map:canvas.context.addPolyline')}</ListItemText>
          </MenuItem>
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
