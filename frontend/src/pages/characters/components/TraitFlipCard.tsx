import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, alpha, useTheme, Tooltip, IconButton } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BlockIcon from '@mui/icons-material/Block';
import { ExclusionOverlay } from '@/components/ui/ExclusionOverlay';
import { FlipCard } from '@/components/ui/FlipCard';

export interface TraitFlipCardProps {
  name: string;
  description: string;
  imageSrc?: string;
  isAttached: boolean;
  isCustom: boolean;
  onToggleAttach: () => void;
  onDelete?: () => void;
  onConfigureExclusions?: () => void;
  isBlocked?: boolean;
  blockedTooltip?: string;
  /** When true, attach/detach buttons are disabled (e.g. new character not saved). */
  attachActionsDisabled?: boolean;
}

export const TraitFlipCard: React.FC<TraitFlipCardProps> = ({
  name,
  description,
  imageSrc,
  isAttached,
  isCustom,
  onDelete,
  onConfigureExclusions,
  onToggleAttach,
  isBlocked = false,
  blockedTooltip,
  attachActionsDisabled = false,
}) => {
  const theme = useTheme();
  const { t } = useTranslation(['characters', 'common']);
  const firstLetter = [...name][0] ?? '?';

  return (
    <FlipCard
      frontImage={imageSrc}
      frontFallbackLetter={firstLetter}
      frontTitle={name}
      backTitle={name}
      backDescription={description}
      backTopRightSlot={
        onConfigureExclusions || (isCustom && onDelete)
          ? ({ imageFailed }) => (
              <>
                {onConfigureExclusions && (
                  <Tooltip title={t('traits.tooltipConfigureExclusions')}>
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
                )}
                {isCustom && onDelete && (
                  <IconButton
                    size="small"
                    onClick={() => onDelete()}
                    sx={{
                      color: 'rgba(255,255,255,0.7)',
                      '&:hover': {
                        color: 'rgba(255,100,100,0.9)',
                        bgcolor: 'rgba(255,255,255,0.08)',
                      },
                    }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                )}
              </>
            )
          : undefined
      }
      backBottomSlot={({ imageFailed }) =>
        isAttached ? (
          <Tooltip title={t('traits.emptyNotSavedTitle')} disableHoverListener={!attachActionsDisabled}>
            <span>
              <Button
                fullWidth
                size="small"
                variant="outlined"
                disabled={attachActionsDisabled || isBlocked}
                onClick={() => onToggleAttach()}
                sx={
                  imageFailed
                    ? { borderColor: alpha(theme.palette.text.primary, 0.25) }
                    : {
                        borderColor: 'rgba(255,255,255,0.7)',
                        color: 'rgba(255,255,255,0.7)',
                        '&:hover': {
                          borderColor: 'rgba(255,255,255,0.9)',
                          bgcolor: 'rgba(255,255,255,0.08)',
                        },
                      }
                }
              >
                {t('traits.detach')}
              </Button>
            </span>
          </Tooltip>
        ) : (
          <Tooltip title={t('traits.emptyNotSavedTitle')} disableHoverListener={!attachActionsDisabled}>
            <span style={{ display: 'block', width: '100%' }}>
              <Button
                fullWidth
                size="small"
                variant="contained"
                color="primary"
                disabled={attachActionsDisabled || isBlocked}
                onClick={() => onToggleAttach()}
              >
                {t('traits.attach')}
              </Button>
            </span>
          </Tooltip>
        )
      }
      isAttached={isAttached}
      isBlocked={isBlocked}
      blockedOverlay={isBlocked && blockedTooltip ? <ExclusionOverlay tooltip={blockedTooltip} /> : undefined}
    />
  );
};
