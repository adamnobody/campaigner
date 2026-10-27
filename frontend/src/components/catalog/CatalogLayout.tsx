import React from 'react';
import { Box, Typography } from '@mui/material';
import { CampaignerPage, CampaignerPageHeader, CampaignerSurface, campaignerPageHeaderPt } from '@/components/ui/CampaignerPrimitives';

export function CatalogColumns({
  aside,
  children,
}: {
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  if (!aside) return children;
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 280px' },
        gap: { xs: 4, lg: 5 },
        alignItems: 'start',
      }}
    >
      <Box sx={{ minWidth: 0 }}>{children}</Box>
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          gap: 2,
          pt: campaignerPageHeaderPt,
        }}
      >
        <Typography
          variant="overline"
          aria-hidden
          sx={{ display: 'block', pb: 1, visibility: 'hidden', pointerEvents: 'none' }}
        >
          &nbsp;
        </Typography>
        {aside}
      </Box>
    </Box>
  );
}

export function CatalogLayout({
  eyebrow,
  title,
  subtitle,
  actions,
  toolbar,
  aside,
  hasItems = true,
  children,
}: {
  eyebrow?: React.ReactNode;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  toolbar?: React.ReactNode;
  aside?: React.ReactNode;
  hasItems?: boolean;
  children: React.ReactNode;
}) {
  return (
    <CampaignerPage>
      <CatalogColumns aside={aside}>
        <CampaignerPageHeader
          eyebrow={eyebrow}
          title={title}
          description={subtitle}
          actions={actions}
        />
        {toolbar ? (
          <CampaignerSurface
            sx={{
              p: 1.25,
              mb: hasItems ? 3 : 0,
              display: 'flex',
              gap: 1.25,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {toolbar}
          </CampaignerSurface>
        ) : null}
        {children}
      </CatalogColumns>
    </CampaignerPage>
  );
}

export function CatalogAsideCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <CampaignerSurface sx={{ p: 2 }}>
      <Typography
        sx={{
          color: 'text.disabled',
          fontFamily: (theme) => theme.campaigner.typography.mono,
          fontSize: '0.6rem',
          letterSpacing: '.16em',
          textTransform: 'uppercase',
          pb: 1.25,
        }}
      >
        {title}
      </Typography>
      {children}
    </CampaignerSurface>
  );
}

export function CatalogSummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.35 }}>
      <Typography sx={{ color: 'text.disabled', fontSize: '0.78rem' }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.78rem' }}>{value}</Typography>
    </Box>
  );
}

export function CatalogAside({
  summaryTitle,
  summary,
  storedTitle,
  storedBody,
  linkedTitle,
  linked,
}: {
  summaryTitle: string;
  summary: Array<{ label: string; value: React.ReactNode }>;
  storedTitle: string;
  storedBody: string;
  linkedTitle: string;
  linked: Array<{ label: string; value: React.ReactNode }>;
}) {
  return (
    <>
      <CatalogAsideCard title={summaryTitle}>
        {summary.map((row) => (
          <CatalogSummaryRow key={row.label} label={row.label} value={row.value} />
        ))}
      </CatalogAsideCard>
      <CatalogAsideCard title={storedTitle}>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem', lineHeight: 1.55 }}>{storedBody}</Typography>
      </CatalogAsideCard>
      <CatalogAsideCard title={linkedTitle}>
        {linked.map((row) => (
          <CatalogSummaryRow key={row.label} label={row.label} value={row.value} />
        ))}
      </CatalogAsideCard>
    </>
  );
}
