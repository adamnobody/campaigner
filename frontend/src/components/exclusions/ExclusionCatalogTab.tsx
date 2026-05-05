import React, { useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Collapse,
  Typography,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Link,
  Tab,
  Tabs,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { EditExclusionsDialog } from '@/components/ui/EditExclusionsDialog';
import { useUIStore } from '@/store/useUIStore';
import { shallow } from 'zustand/shallow';
import { getConflictPairs, getExcludingIds, isExcluded, type ExcludableItem } from '@/utils/exclusions';

export interface ExclusionItem extends ExcludableItem {
  description?: string;
  /** Localized description for predefined catalog rows (optional). */
  displayDescription?: string;
  isCustom: boolean;
  imagePath?: string | null;
}

export interface ExclusionCatalogCreateDialogBaseProps {
  open: boolean;
  onClose: () => void;
  projectId: number;
}

export interface RenderExclusionCardArgs<T extends ExclusionItem> {
  item: T;
  isAttached: boolean;
  isBlocked: boolean;
  blockedTooltip: string | undefined;
  attachActionsDisabled: boolean;
  onToggleAttach: () => void;
  onConfigureExclusions: () => void;
}

export interface ExclusionCatalogTabProps<T extends ExclusionItem, TCreateExtra extends object = object> {
  projectId: number;

  title: string;
  icon: ReactNode;
  addButtonLabel: string;

  catalogDialogTitle: string;
  catalogTabLabel?: string;
  createTabLabel?: string;
  createTabDescription: string;
  createButtonLabel: string;

  emptyNotSavedTitle: string;
  emptyNotSavedDescription: string;

  emptyNoAssignedTitle: string;
  emptyNoAssignedDescription: string;
  emptyNoAssignedActionLabel: string;

  emptyStateIcon: ReactNode;

  conflictAlertText: string;

  exclusionsDialogLabel: string;
  exclusionsSavedSnackbar: string;

  exclusionsCatalog: ExcludableItem[];
  items: T[];
  assignedMainItems: T[];

  assignedIds: number[];
  error?: string | null;

  attachActionsDisabled?: boolean;
  isEntitySaved: boolean;
  showInitialSpinner: boolean;

  onToggleAssign: (itemId: number) => void | Promise<void>;
  onUpdateExclusions: (itemId: number, exclusionIds: number[]) => void | Promise<unknown>;

  renderCard: (args: RenderExclusionCardArgs<T>) => ReactNode;

  CreateDialog: ComponentType<ExclusionCatalogCreateDialogBaseProps & Partial<TCreateExtra>>;
  createDialogExtraProps?: TCreateExtra;
  onCreateDialogClose?: () => void;
  prepareCreateNew?: () => void;

  gridMinColumnWidth?: number;
  gridGap?: number | string;

  createDialogOpen?: boolean;
  onCreateDialogOpenChange?: (open: boolean) => void;
  catalogHeaderExtraSx?: object;
}

export function ExclusionCatalogTab<T extends ExclusionItem, TCreateExtra extends object = object>({
  projectId,
  title,
  icon,
  addButtonLabel,
  catalogDialogTitle,
  catalogTabLabel,
  createTabLabel,
  createTabDescription,
  createButtonLabel,
  emptyNotSavedTitle,
  emptyNotSavedDescription,
  emptyNoAssignedTitle,
  emptyNoAssignedDescription,
  emptyNoAssignedActionLabel,
  emptyStateIcon,
  conflictAlertText,
  exclusionsDialogLabel,
  exclusionsSavedSnackbar,
  exclusionsCatalog,
  items,
  assignedMainItems,
  assignedIds,
  error,
  attachActionsDisabled = false,
  isEntitySaved,
  showInitialSpinner,
  onToggleAssign,
  onUpdateExclusions,
  renderCard,
  CreateDialog,
  createDialogExtraProps,
  onCreateDialogClose,
  prepareCreateNew,
  gridMinColumnWidth = 200,
  gridGap = 2,
  createDialogOpen: createDialogOpenProp,
  onCreateDialogOpenChange,
  catalogHeaderExtraSx,
}: ExclusionCatalogTabProps<T, TCreateExtra>) {
  const { t } = useTranslation('common');
  const resolvedCatalogTabLabel = catalogTabLabel ?? t('exclusionCatalog.catalogTab');
  const resolvedCreateTabLabel = createTabLabel ?? t('exclusionCatalog.createTab');

  const [catalogDialogOpen, setCatalogDialogOpen] = useState(false);
  const [catalogTab, setCatalogTab] = useState<'catalog' | 'create'>('catalog');
  const [createDialogOpenInternal, setCreateDialogOpenInternal] = useState(false);
  const isCreateDialogControlled =
    createDialogOpenProp !== undefined && onCreateDialogOpenChange !== undefined;
  const createDialogOpen = isCreateDialogControlled ? createDialogOpenProp! : createDialogOpenInternal;
  const setCreateDialogOpen = (open: boolean) => {
    if (isCreateDialogControlled) onCreateDialogOpenChange!(open);
    else setCreateDialogOpenInternal(open);
  };
  const [showConflictDetails, setShowConflictDetails] = useState(false);
  const [editingExclusionsItem, setEditingExclusionsItem] = useState<T | null>(null);

  const { showSnackbar } = useUIStore(
    (s) => ({ showSnackbar: s.showSnackbar }),
    shallow
  );

  const nameById = useMemo(
    () =>
      new Map(exclusionsCatalog.map((x) => [x.id, x.displayLabel ?? x.name] as const)),
    [exclusionsCatalog]
  );

  const conflictPairs = useMemo(
    () => getConflictPairs(assignedIds, exclusionsCatalog),
    [assignedIds, exclusionsCatalog]
  );

  const assignedIdSet = useMemo(() => new Set(assignedIds), [assignedIds]);

  const getBlockedTooltip = (itemId: number, idsToCheck: number[]): string | null => {
    const conflictingIds = getExcludingIds(itemId, idsToCheck, exclusionsCatalog);
    if (conflictingIds.length === 0) return null;
    const names = conflictingIds.map((id) => nameById.get(id) ?? `#${id}`);
    return t('exclusionCatalog.blockedTooltip', { names: names.join(', ') });
  };

  const gridSx = {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(${gridMinColumnWidth}px, 1fr))`,
    gap: gridGap,
  } as const;

  const mergedCreateDialogProps = {
    open: createDialogOpen,
    onClose: () => {
      setCreateDialogOpen(false);
      onCreateDialogClose?.();
    },
    projectId,
    ...createDialogExtraProps,
  } as ExclusionCatalogCreateDialogBaseProps & Partial<TCreateExtra>;

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          mb: 2.5,
          ...catalogHeaderExtraSx,
        }}
      >
        <SectionHeader icon={icon} title={title} />
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => {
            setCatalogTab('catalog');
            setCatalogDialogOpen(true);
          }}
          disabled={attachActionsDisabled}
        >
          {addButtonLabel}
        </Button>
      </Box>

      {error && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {conflictPairs.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Alert
            severity="warning"
            action={
              <Link
                component="button"
                type="button"
                underline="hover"
                onClick={() => setShowConflictDetails((prev) => !prev)}
              >
                {t('exclusionCatalog.detailsLink')}
              </Link>
            }
          >
            {conflictAlertText}
          </Alert>
          <Collapse in={showConflictDetails} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 1.5, display: 'grid', gap: 1 }}>
              {conflictPairs.map((pair) => {
                const leftName = nameById.get(pair.leftId) ?? `#${pair.leftId}`;
                const rightName = nameById.get(pair.rightId) ?? `#${pair.rightId}`;
                return (
                  <Box
                    key={`${pair.leftId}:${pair.rightId}`}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1.5,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {leftName} ↔ {rightName}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button size="small" onClick={() => { void onToggleAssign(pair.leftId); }}>
                        {t('exclusionCatalog.removePair', { name: leftName })}
                      </Button>
                      <Button size="small" onClick={() => { void onToggleAssign(pair.rightId); }}>
                        {t('exclusionCatalog.removePair', { name: rightName })}
                      </Button>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Collapse>
        </Box>
      )}

      {showInitialSpinner ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={32} />
        </Box>
      ) : !isEntitySaved ? (
        <EmptyState
          icon={emptyStateIcon}
          title={emptyNotSavedTitle}
          description={emptyNotSavedDescription}
        />
      ) : assignedMainItems.length === 0 ? (
        <EmptyState
          icon={emptyStateIcon}
          title={emptyNoAssignedTitle}
          description={emptyNoAssignedDescription}
          actionLabel={emptyNoAssignedActionLabel}
          onAction={() => {
            setCatalogTab('catalog');
            setCatalogDialogOpen(true);
          }}
        />
      ) : (
        <Box sx={gridSx}>
          {assignedMainItems.map((item) => {
            const tip = getBlockedTooltip(item.id, assignedIds);
            return (
              <React.Fragment key={item.id}>
                {renderCard({
                  item,
                  isAttached: true,
                  isBlocked: Boolean(tip),
                  blockedTooltip: tip ?? undefined,
                  attachActionsDisabled,
                  onToggleAttach: () => { void onToggleAssign(item.id); },
                  onConfigureExclusions: () => setEditingExclusionsItem(item),
                })}
              </React.Fragment>
            );
          })}
        </Box>
      )}

      <Dialog open={catalogDialogOpen} onClose={() => setCatalogDialogOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle>{catalogDialogTitle}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Tabs value={catalogTab} onChange={(_, value) => setCatalogTab(value)} sx={{ mb: 2 }}>
            <Tab value="catalog" label={resolvedCatalogTabLabel} />
            <Tab value="create" label={resolvedCreateTabLabel} />
          </Tabs>

          {catalogTab === 'catalog' ? (
            <Box sx={{ ...gridSx, pb: 1 }}>
              {items.map((item) => {
                const isAttached = assignedIdSet.has(item.id);
                const blocked = !isAttached && isExcluded(item.id, assignedIds, exclusionsCatalog);
                const tooltip = blocked ? getBlockedTooltip(item.id, assignedIds) : null;
                return (
                  <React.Fragment key={item.id}>
                    {renderCard({
                      item,
                      isAttached,
                      isBlocked: blocked,
                      blockedTooltip: tooltip ?? undefined,
                      attachActionsDisabled,
                      onToggleAttach: () => { void onToggleAssign(item.id); },
                      onConfigureExclusions: () => setEditingExclusionsItem(item),
                    })}
                  </React.Fragment>
                );
              })}
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {createTabDescription}
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  prepareCreateNew?.();
                  setCreateDialogOpen(true);
                }}
              >
                {createButtonLabel}
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <CreateDialog {...mergedCreateDialogProps} />

      <EditExclusionsDialog
        open={Boolean(editingExclusionsItem)}
        onClose={() => setEditingExclusionsItem(null)}
        title={
          editingExclusionsItem
            ? t('exclusionCatalog.dialogTitle', {
                name: editingExclusionsItem.displayLabel ?? editingExclusionsItem.name,
              })
            : t('exclusionCatalog.dialogTitleFallback')
        }
        label={exclusionsDialogLabel}
        options={exclusionsCatalog.map((x) => ({
          id: x.id,
          name: x.displayLabel ?? x.name,
        }))}
        selfId={editingExclusionsItem?.id ?? 0}
        selectedIds={editingExclusionsItem?.exclusions ?? []}
        onSave={async (excludedIds) => {
          if (!editingExclusionsItem) return;
          await onUpdateExclusions(editingExclusionsItem.id, excludedIds);
          showSnackbar(exclusionsSavedSnackbar, 'success');
        }}
      />
    </Box>
  );
}
