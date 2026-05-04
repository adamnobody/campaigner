import React from 'react';
import { Button, alpha, useTheme, Tooltip, IconButton, Stack } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import BlockIcon from '@mui/icons-material/Block';
import { useTranslation } from 'react-i18next';
import { ExclusionOverlay } from '@/components/ui/ExclusionOverlay';
import { FlipCard } from '@/components/ui/FlipCard';

export interface AmbitionFlipCardProps {
  name: string;
  description: string;
  imageSrc?: string;
  isAttached: boolean;
  isCustom: boolean;
  onToggleAttach: () => void;
  onEdit?: () => void;
  onDeleteAmbition?: () => void;
  onConfigureExclusions?: () => void;
  isBlocked?: boolean;
  blockedTooltip?: string;
  attachActionsDisabled?: boolean;
}

export const AmbitionFlipCard: React.FC<AmbitionFlipCardProps> = ({
  name,
  description,
  imageSrc,
  isAttached,
  isCustom,
  onToggleAttach,
  onEdit,
  onDeleteAmbition,
  onConfigureExclusions,
  isBlocked = false,
  blockedTooltip,
  attachActionsDisabled = false,
}) => {
  const theme = useTheme();
  const { t } = useTranslation(['factions', 'common']);
  const firstLetter = [...name][0] ?? '?';

  return (
    <FlipCard
      frontImage={imageSrc}
      frontFallbackLetter={firstLetter}
      frontTitle={name}
      backTitle={name}
      backDescription={description}
      backTopRightSlot={
        onConfigureExclusions
          ? ({ imageFailed }) => (
              <Tooltip title={t('factions:ambitions.tooltipConfigure')}>
                <IconButton
                  size="small"
                  onClick={() => onConfigureExclusions()}
                  sx={{
                    color: imageFailed ? 'text.secondary' : 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      color: imageFailed ? 'text.primary' : '#fff',
                      bgcolor: 'rgba(255,255,255,0.08)',
                    },
                  }}
                >
                  <BlockIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )
          : undefined
      }
      backBottomSlot={({ imageFailed }) => (
        <Stack spacing={1}>
          <Tooltip title={t('factions:ambitions.saveFactionFirstTooltip')} disableHoverListener={!attachActionsDisabled}>
            <span>
              <Button
                fullWidth
                size="small"
                variant={isAttached ? 'outlined' : 'contained'}
                disabled={attachActionsDisabled || isBlocked}
                onClick={() => onToggleAttach()}
                sx={
                  isAttached && !imageFailed
                    ? {
                        borderColor: 'rgba(255,255,255,0.7)',
                        color: 'rgba(255,255,255,0.7)',
                        '&:hover': {
                          borderColor: 'rgba(255,255,255,0.9)',
                          bgcolor: 'rgba(255,255,255,0.08)',
                        },
                      }
                    : undefined
                }
              >
                {isAttached ? t('factions:ambitions.detach') : t('factions:ambitions.attach')}
              </Button>
            </span>
          </Tooltip>

          {isCustom && (
            <Stack direction="row" spacing={1} justifyContent="center">
              <IconButton
                size="small"
                onClick={onEdit}
                sx={{
                  color: imageFailed ? 'text.secondary' : 'rgba(255,255,255,0.8)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                  '&:hover': {
                    bgcolor: imageFailed ? alpha(theme.palette.action.hover, 0.2) : 'rgba(255,255,255,0.08)',
                  },
                }}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={onDeleteAmbition}
                sx={{
                  color: imageFailed ? theme.palette.error.main : 'rgba(255,120,120,0.95)',
                  border: `1px solid ${alpha(theme.palette.error.main, 0.4)}`,
                  '&:hover': {
                    bgcolor: imageFailed ? alpha(theme.palette.error.main, 0.08) : 'rgba(255,255,255,0.08)',
                  },
                }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Stack>
          )}
        </Stack>
      )}
      isAttached={isAttached}
      isBlocked={isBlocked}
      blockedOverlay={isBlocked && blockedTooltip ? <ExclusionOverlay tooltip={blockedTooltip} /> : undefined}
    />
  );
};
