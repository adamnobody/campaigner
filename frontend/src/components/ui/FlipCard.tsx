import React, { useEffect, useState, type ReactNode } from 'react';
import { Box, Typography, alpha, useTheme } from '@mui/material';
import type { Theme } from '@mui/material/styles';

const FLIP_MS = 600;

const SHIMMER_CLASS = 'flip-card-shimmer';

/** Контекст для слотов, которым нужно знать, упала ли загрузка обложки. */
export interface FlipCardRenderContext {
  imageFailed: boolean;
}

export type FlipCardSlot = ReactNode | ((ctx: FlipCardRenderContext) => ReactNode);

export interface FlipCardProps {
  /**
   * URL обложки на лицевой стороне. Если нет или сбой загрузки — показывается fallback с буквой.
   */
  frontImage?: string | null;

  /**
   * Символ на однотонном фоне при отсутствии картинки. Если не задан — берётся первая «буква» из `frontTitle`.
   */
  frontFallbackLetter?: string;

  /** Заголовок внизу лицевой стороны. */
  frontTitle: string;

  /** Заголовок на обороте. */
  backTitle: string;

  /** Текст описания на обороте. */
  backDescription?: string | null;

  /**
   * Содержимое верхнего правого угла оборота (иконки и т.д.).
   * Рамка позиционирования и `stopPropagation` на контейнере — на обороте внутри `FlipCard`.
   * Можно передать функцию с `{ imageFailed }` для палитры как у оригинальных карт.
   */
  backTopRightSlot?: FlipCardSlot;

  /**
   * Нижняя панель оборота. Рамка и `stopPropagation` на контейнере — на обороте внутри `FlipCard`.
   */
  backBottomSlot: FlipCardSlot;

  /** Включает conic-border и убирает divider/shadow на лице как у «прикреплённой» карты. */
  isAttached?: boolean;

  /** Блокирует переворот по клику по области карты. */
  isBlocked?: boolean;

  /** Оверлей при блокировке (например `<ExclusionOverlay />`). */
  blockedOverlay?: ReactNode;

  /** Максимальная ширина карты, px. */
  maxWidth?: number;

  /** Значение CSS `aspect-ratio` области переворота. */
  aspectRatio?: string;
}

interface FlipCardFrontProps {
  onCardClick: () => void;
  theme: Theme;
  frontImage?: string | null;
  imageFailed: boolean;
  onImageError: () => void;
  fallbackChar: string;
  frontTitle: string;
  isAttached: boolean;
}

const FlipCardFront: React.FC<FlipCardFrontProps> = ({
  onCardClick,
  theme,
  frontImage,
  imageFailed,
  onImageError,
  fallbackChar,
  frontTitle,
  isAttached,
}) => (
  <Box
    onClick={onCardClick}
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
      '@keyframes flipCardShimmer': {
        '0%': { backgroundPosition: '100% 0' },
        '100%': { backgroundPosition: '-100% 0' },
      },
      '@media (hover: hover)': {
        [`&:hover .${SHIMMER_CLASS}`]: {
          opacity: 1,
          animation: 'flipCardShimmer 3.2s ease-in-out infinite',
        },
      },
    }}
  >
    {frontImage && !imageFailed ? (
      <Box
        component="img"
        src={frontImage}
        alt=""
        onError={onImageError}
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
          {fallbackChar}
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
      className={SHIMMER_CLASS}
      sx={{
        position: 'absolute',
        inset: 0,
        opacity: 0,
        transition: 'opacity 0.35s ease',
        pointerEvents: 'none',
        background: 'linear-gradient(115deg, transparent 38%, rgba(255,255,255,0.08) 50%, transparent 62%)',
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
      {frontTitle}
    </Typography>
  </Box>
);

interface FlipCardBackProps {
  onCardClick: () => void;
  theme: Theme;
  backTitle: string;
  backDescription?: string | null;
  frontImage?: string | null;
  imageFailed: boolean;
  hasTopRight: boolean;
  topRightContent: ReactNode;
  bottomContent: ReactNode;
}

const FlipCardBack: React.FC<FlipCardBackProps> = ({
  onCardClick,
  theme,
  backTitle,
  backDescription,
  frontImage,
  imageFailed,
  hasTopRight,
  topRightContent,
  bottomContent,
}) => (
  <Box
    onClick={onCardClick}
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
    {frontImage && !imageFailed ? (
      <>
        <Box sx={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: '110%',
              height: '110%',
              transform: 'translate(-50%, -50%) scale(1.1)',
              backgroundImage: `url(${frontImage})`,
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
              theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.55)' : 'rgba(0, 0, 0, 0.45)',
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
      {hasTopRight && (
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
          {topRightContent}
        </Box>
      )}
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 700,
          mb: 1,
          flexShrink: 0,
          color: imageFailed ? 'text.primary' : '#fff',
          pr: hasTopRight ? 4 : 0,
        }}
      >
        {backTitle}
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
          {backDescription ?? ''}
        </Typography>
      </Box>
      <Box sx={{ pt: 1.5, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
        {bottomContent}
      </Box>
    </Box>
  </Box>
);

export const FlipCard: React.FC<FlipCardProps> = ({
  frontImage,
  frontFallbackLetter,
  frontTitle,
  backTitle,
  backDescription,
  backTopRightSlot,
  backBottomSlot,
  isAttached = false,
  isBlocked = false,
  blockedOverlay,
  maxWidth = 200,
  aspectRatio = '3 / 4',
}) => {
  const theme = useTheme();
  const [flipped, setFlipped] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [frontImage]);

  const fallbackChar = frontFallbackLetter ?? ([...frontTitle][0] ?? '?');

  const handleCardAreaClick = () => {
    if (isBlocked) return;
    setFlipped((v) => !v);
  };

  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;
  const slotCtx: FlipCardRenderContext = { imageFailed };

  const resolveSlot = (slot: FlipCardSlot): ReactNode =>
    typeof slot === 'function' ? slot(slotCtx) : slot;

  const hasTopRight = Boolean(backTopRightSlot);
  const topRightContent = backTopRightSlot != null ? resolveSlot(backTopRightSlot) : null;
  const bottomContent = resolveSlot(backBottomSlot);

  const flipInner = (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth,
        mx: 'auto',
        aspectRatio,
        transformStyle: 'preserve-3d',
        transition: `transform ${FLIP_MS}ms ease`,
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}
    >
      <FlipCardFront
        onCardClick={handleCardAreaClick}
        theme={theme}
        frontImage={frontImage}
        imageFailed={imageFailed}
        onImageError={() => setImageFailed(true)}
        fallbackChar={fallbackChar}
        frontTitle={frontTitle}
        isAttached={isAttached}
      />
      <FlipCardBack
        onCardClick={handleCardAreaClick}
        theme={theme}
        backTitle={backTitle}
        backDescription={backDescription}
        frontImage={frontImage}
        imageFailed={imageFailed}
        hasTopRight={hasTopRight}
        topRightContent={topRightContent}
        bottomContent={bottomContent}
      />
      {blockedOverlay ?? null}
    </Box>
  );

  const perspectiveWrap = (
    <Box sx={{ perspective: 1000, width: '100%', maxWidth, mx: 'auto' }}>{flipInner}</Box>
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
          maxWidth,
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
            animation: 'flipCardBorderSpin 5s linear infinite',
            '@keyframes flipCardBorderSpin': {
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
