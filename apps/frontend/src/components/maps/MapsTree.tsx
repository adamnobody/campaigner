import React, { useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import type { MapDTO } from '../../app/api';

type MapNode = MapDTO & { children: MapNode[] };

function buildTree(maps: MapDTO[]) {
  const byId = new Map<string, MapNode>();
  const roots: MapNode[] = [];

  for (const m of maps) byId.set(m.id, { ...m, children: [] });

  for (const m of maps) {
    const node = byId.get(m.id)!;
    if (m.parent_map_id && byId.has(m.parent_map_id)) {
      byId.get(m.parent_map_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Опционально: сортировка (например, по title)
  const sortRec = (nodes: MapNode[]) => {
    nodes.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
    nodes.forEach(n => sortRec(n.children));
  };
  sortRec(roots);

  return roots;
}

function collectAllIds(nodes: MapNode[]): string[] {
  const out: string[] = [];
  const walk = (n: MapNode[]) => {
    for (const x of n) {
      out.push(x.id);
      walk(x.children);
    }
  };
  walk(nodes);
  return out;
}

function renderNode(node: MapNode) {
  return (
    <TreeItem key={node.id} itemId={node.id} label={node.title}>
      {node.children.map(renderNode)}
    </TreeItem>
  );
}

export function MapsTree(props: {
  maps: MapDTO[];
  selectedMapId: string | null;
  onSelectMap: (mapId: string) => void;
}) {
  const { maps, selectedMapId, onSelectMap } = props;

  const tree = useMemo(() => buildTree(maps), [maps]);

  // По умолчанию раскрываем все узлы (для MVP удобно).
  // Позже можно хранить expanded в Zustand/LocalStorage.
  const defaultExpanded = useMemo(() => collectAllIds(tree), [tree]);
  const [expandedItems, setExpandedItems] = useState<string[]>(defaultExpanded);

  // Когда список карт изменился (создали новую), обновим expanded так,
  // чтобы новые элементы тоже раскрылись.
  React.useEffect(() => {
    setExpandedItems(defaultExpanded);
  }, [defaultExpanded]);

  return (
    <Box sx={{ px: 2, pb: 1 }}>
      {maps.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Карт пока нет. Нажмите «+ Карта».
        </Typography>
      ) : (
        <SimpleTreeView
          selectedItems={selectedMapId ?? undefined}
          expandedItems={expandedItems}
          onExpandedItemsChange={(_e, ids) => setExpandedItems(ids)}
          onSelectedItemsChange={(_e, itemId) => {
            if (typeof itemId === 'string') onSelectMap(itemId);
          }}
          sx={{
            mt: 1,
            '& .MuiTreeItem-label': { userSelect: 'none' }
          }}
        >
          {tree.map(renderNode)}
        </SimpleTreeView>
      )}
    </Box>
  );
}
