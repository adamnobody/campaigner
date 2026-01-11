import React from 'react';
import { Box, Typography } from '@mui/material';

type LoadingScreenProps = {
  durationMs?: number;
  quotes?: string[];
  quoteIntervalMs?: number;
  onDone?: () => void;
};

export function LoadingScreen({
  durationMs = 7000,
  quotes = [
    'Карта — это обещание приключения.',
    'Мир строится из деталей.',
    'Записывай легенды, пока они живы.',
  ],
  quoteIntervalMs = 2400,
  onDone,
}: LoadingScreenProps) {
  const [progress, setProgress] = React.useState(0);

  const [quoteIndex, setQuoteIndex] = React.useState(0);
  const [quoteOpacity, setQuoteOpacity] = React.useState(1);

  React.useEffect(() => {
    const start = performance.now();
    let raf = 0;

    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else onDone?.();
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs, onDone]);

  React.useEffect(() => {
    if (!quotes.length) return;

    const fadeOutMs = 260;
    const fadeInMs = 260;
    const holdMs = Math.max(600, quoteIntervalMs - fadeOutMs - fadeInMs);

    let alive = true;
    let t1 = 0;
    let t2 = 0;
    let t3 = 0;

    const cycle = () => {
      if (!alive) return;

      t1 = window.setTimeout(() => {
        if (!alive) return;

        setQuoteOpacity(0);

        t2 = window.setTimeout(() => {
          if (!alive) return;
          setQuoteIndex((i) => (i + 1) % quotes.length);

          requestAnimationFrame(() => {
            if (!alive) return;
            setQuoteOpacity(1);
          });

          t3 = window.setTimeout(cycle, fadeInMs + holdMs);
        }, fadeOutMs);
      }, holdMs);
    };

    setQuoteOpacity(1);
    cycle();

    return () => {
      alive = false;
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [quotes.length, quoteIntervalMs]);

  const currentQuote = quotes.length ? quotes[quoteIndex] : '';

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'grid',
        placeItems: 'center',
        bgcolor: '#0B0D12',
        color: '#fff',
        overflow: 'hidden',
      }}
    >
      {/* vignette */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.0) 45%, rgba(0,0,0,0.55) 100%)',
          pointerEvents: 'none',
        }}
      />

      <Box sx={{ position: 'relative', width: 'min(920px, 92vw)', textAlign: 'center' }}>
        <Typography
          sx={{
            fontFamily: '"IBM Plex Serif", ui-serif, Georgia, serif',
            fontWeight: 800,
            letterSpacing: '0.03em',
            lineHeight: 1.0,
            fontSize: { xs: '48px', sm: '64px', md: '78px' },
            mb: 3,
            textShadow: '0 12px 40px rgba(0,0,0,0.55)',
          }}
        >
          Campaigner
        </Typography>

        {/* Progress track + glow */}
        <Box sx={{ position: 'relative' }}>
          {/* BLUR-GLOW behind the bar */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              height: 18,
              width: `${Math.round(progress * 100)}%`,
              borderRadius: 999,
              background:
                'linear-gradient(90deg, rgba(255,255,255,0.25) 0%, rgba(210,230,255,0.42) 35%, rgba(160,200,255,0.42) 65%, rgba(255,255,255,0.30) 100%)',
              filter: 'blur(12px)',
              opacity: 0.9,
              pointerEvents: 'none',
              transition: 'width 80ms linear',
            }}
          />

          {/* track */}
          <Box
            sx={{
              height: 8,
              width: '100%',
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.10)',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
              position: 'relative',
            }}
          >
            {/* subtle inner highlight */}
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.0))',
                pointerEvents: 'none',
              }}
            />

            {/* progress fill */}
            <Box
              sx={{
                height: '100%',
                width: `${Math.round(progress * 100)}%`,
                borderRadius: 999,
                background:
                  'linear-gradient(90deg, rgba(255,255,255,0.85) 0%, rgba(210,230,255,0.95) 35%, rgba(160,200,255,0.95) 65%, rgba(255,255,255,0.92) 100%)',
                boxShadow: '0 0 18px rgba(180,210,255,0.35)',
                transition: 'width 80ms linear',
                position: 'relative',
              }}
            >
              {/* moving sheen */}
              <Box
                aria-hidden
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(110deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.25) 45%, rgba(255,255,255,0.0) 80%)',
                  transform: 'translateX(-35%)',
                  animation: 'campaignerSheen 1.2s linear infinite',
                  '@keyframes campaignerSheen': {
                    '0%': { transform: 'translateX(-45%)' },
                    '100%': { transform: 'translateX(45%)' },
                  },
                  pointerEvents: 'none',
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Quotes */}
        <Box sx={{ mt: 2.25, minHeight: 46 }}>
          <Typography
            sx={{
              fontSize: { xs: '14px', sm: '15px' },
              color: 'rgba(255,255,255,0.78)',
              fontStyle: 'italic',
              opacity: quoteOpacity,
              transition: 'opacity 260ms ease',
            }}
          >
            {currentQuote}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
