import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, alpha, useTheme, Tooltip, IconButton, Stack } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import BlockIcon from '@mui/icons-material/Block';
import { ExclusionOverlay } from '@/components/ui/ExclusionOverlay';

export interface AmbitionFlipCardProps {
  id: number;
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

const FLIP_MS = 600;

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
  const [flipped, setFlipped] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageSrc]);

  const handleCardAreaClick = () => {
    if (isBlocked) return;
    setFlipped((v) => !v);
  };

  const handleToggleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onToggleAttach();
  };

  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;

  const firstLetter = [...name][0] ?? '?';

  const flipInner = (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: 200,
        mx: 'auto',
        aspectRatio: '3 / 4',
        transformStyle: 'preserve-3d',
        transition: `transform ${FLIP_MS}ms ease`,
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}
    >
      <Box
        onClick={handleCardAreaClick}
        sx={{
          position: 'absolute',
          inset: 0,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          borderRadius: 2,
          overflow: 'hidden',
          cursor: 'pointer',
          border: isAttached ? 'none' : `1px solid ${theme.palette.divider}`,
          boxShadow: isAttached ? undefined : `0 2px 8px ${alpha(theme.palette.common.black, 0.12)}`,
          '@keyframes ambitionShimmer': {
            '0%': { backgroundPosition: '100% 0' },
            '100%': { backgroundPosition: '-100% 0' },
          },
          '@media (hover: hover)': {
            '&:hover .ambition-flip-shimmer': {
              opacity: 1,
              animation: 'ambitionShimmer 3.2s ease-in-out infinite',
            },
          },
        }}
      >
        {imageSrc && !imageFailed ? (
          <Box
            component="img"
            src={imageSrc}
            alt=""
            onError={() => setImageFailed(true)}
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              bgcolor: alpha(theme.palette.primary.main, 0.15),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ fontSize: '3rem', fontWeight: 600, color: 'text.secondary', lineHeight: 1 }}>
              {firstLetter}
            </Typography>
          </Box>
        )}

        <Box
          className="ambition-flip-shimmer"
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            transition: 'opacity 0.35s ease',
            pointerEvents: 'none',
            background:
              'linear-gradient(115deg, transparent 38%, rgba(255,255,255,0.08) 50%, transparent 62%)',
            backgroundSize: '200% 100%',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.15) 48%, transparent 76%)',
            pointerEvents: 'none',
          }}
        />
        <Typography
          sx={{
            position: 'absolute',
            left: 12,
            right: 12,
            bottom: 12,
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.95rem',
            lineHeight: 1.25,
            textShadow: '0 1px 4px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.9)',
            pointerEvents: 'none',
          }}
        >
          {name}
        </Typography>
      </Box>

      <Box
        onClick={handleCardAreaClick}
        sx={{
          position: 'absolute',
          inset: 0,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          borderRadius: 2,
          overflow: 'hidden',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${theme.palette.divider}`,
          boxSizing: 'border-box',
        }}
      >
        {imageSrc && !imageFailed ? (
          <>
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                zIndex: 0,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: '110%',
                  height: '110%',
                  transform: 'translate(-50%, -50%) scale(1.1)',
                  backgroundImage: `url(${imageSrc})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(8px)',
                }}
              />
            </Box>
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                zIndex: 1,
                bgcolor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(0, 0, 0, 0.55)'
                    : 'rgba(0, 0, 0, 0.45)',
              }}
            />
          </>
        ) : (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              bgcolor: alpha(theme.palette.primary.main, 0.15),
            }}
          />
        )}
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            p: 1.5,
            minHeight: 0,
          }}
        >
          {onConfigureExclusions && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 3,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Tooltip title="Настроить исключения">
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
            </Box>
          )}
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              mb: 1,
              flexShrink: 0,
              color: imageFailed ? 'text.primary' : '#fff',
              pr: onConfigureExclusions ? 4 : 0,
            }}
          >
            {name}
          </Typography>

          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'auto',
              minHeight: 0,
              px: 0.5,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: imageFailed ? 'text.secondary' : '#fff',
                textAlign: 'center',
                lineHeight: 1.5,
              }}
            >
              {description}
            </Typography>
          </Box>

          <Stack spacing={1} sx={{ pt: 1.5 }}>
            <Tooltip title="Сначала сохраните фракцию" disableHoverListener={!attachActionsDisabled}>
              <span>
                <Button
                  fullWidth
                  size="small"
                  variant={isAttached ? 'outlined' : 'contained'}
                  disabled={attachActionsDisabled || isBlocked}
                  onClick={handleToggleClick}
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
                  {isAttached ? 'Убрать из фракции' : 'Добавить во фракцию'}
                </Button>
              </span>
            </Tooltip>

            {isCustom && (
              <Stack direction="row" spacing={1} justifyContent="center" onClick={(e) => e.stopPropagation()}>
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
        </Box>
      </Box>
      {isBlocked && blockedTooltip ? <ExclusionOverlay tooltip={blockedTooltip} /> : null}
    </Box>
  );

  const perspectiveWrap = (
    <Box sx={{ perspective: 1000, width: '100%', maxWidth: 200, mx: 'auto' }}>{flipInner}</Box>
  );

  if (!isAttached) {
    return <Box sx={{ width: '100%' }}>{perspectiveWrap}</Box>;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 200,
          mx: 'auto',
          borderRadius: 2,
          p: '2px',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '180%',
            height: '180%',
            marginTop: '-90%',
            marginLeft: '-90%',
            background: `conic-gradient(from 0deg, ${primary}, ${secondary}, ${alpha(primary, 0.65)}, ${primary})`,
            animation: 'ambitionBorderSpin 5s linear infinite',
            '@keyframes ambitionBorderSpin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            },
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            borderRadius: 1.5,
            bgcolor: 'background.paper',
            overflow: 'hidden',
          }}
        >
          {perspectiveWrap}
        </Box>
      </Box>
    </Box>
  );
};
