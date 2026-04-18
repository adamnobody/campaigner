import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, alpha, useTheme, Tooltip, IconButton } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BlockIcon from '@mui/icons-material/Block';
import { ExclusionOverlay } from '@/components/ui/ExclusionOverlay';

export interface TraitFlipCardProps {
  id: number;
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

const FLIP_MS = 600;

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
  const [flipped, setFlipped] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageSrc]);

  const handleCardAreaClick = () => {
    if (isBlocked) return;
    setFlipped((v) => !v);
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
          '@keyframes traitShimmer': {
            '0%': { backgroundPosition: '100% 0' },
            '100%': { backgroundPosition: '-100% 0' },
          },
          '@media (hover: hover)': {
            '&:hover .trait-flip-shimmer': {
              opacity: 1,
              animation: 'traitShimmer 3.2s ease-in-out infinite',
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
            <Typography
              sx={{
                fontSize: '3rem',
                fontWeight: 600,
                color: 'text.secondary',
                lineHeight: 1,
              }}
            >
              {firstLetter}
            </Typography>
          </Box>
        )}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 45%, transparent 72%)',
            pointerEvents: 'none',
          }}
        />
        <Box
          className="trait-flip-shimmer"
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
          {(onConfigureExclusions || (isCustom && onDelete)) && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 3,
                display: 'flex',
                gap: 0.5,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {onConfigureExclusions && (
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
            </Box>
          )}
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              mb: 1,
              flexShrink: 0,
              color: imageFailed ? 'text.primary' : '#fff',
              pr: (onConfigureExclusions && isCustom && onDelete) ? 8 : (onConfigureExclusions || (isCustom && onDelete)) ? 4 : 0,
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
          <Box sx={{ pt: 1.5, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
            {isAttached ? (
              <Tooltip
                title="Сначала сохраните персонажа"
                disableHoverListener={!attachActionsDisabled}
              >
                <span>
                  <Button
                    fullWidth
                    size="small"
                    variant="outlined"
                    disabled={attachActionsDisabled || isBlocked}
                    onClick={handleToggleClick}
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
                    Открепить
                  </Button>
                </span>
              </Tooltip>
            ) : (
              <Tooltip
                title="Сначала сохраните персонажа"
                disableHoverListener={!attachActionsDisabled}
              >
                <span style={{ display: 'block', width: '100%' }}>
                  <Button
                    fullWidth
                    size="small"
                    variant="contained"
                    color="primary"
                    disabled={attachActionsDisabled || isBlocked}
                    onClick={handleToggleClick}
                  >
                    Прикрепить
                  </Button>
                </span>
              </Tooltip>
            )}
          </Box>
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
            animation: 'traitBorderSpin 5s linear infinite',
            '@keyframes traitBorderSpin': {
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
