import React, { useRef, useState } from 'react';
import { Box, Typography, alpha, useTheme } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { AssetAvatar } from '@/components/ui/AssetAvatar';
import { CampaignerSurface } from '@/components/ui/CampaignerPrimitives';

export function CoatOfArmsDropzone({
  imagePath,
  previewUrl,
  label,
  onFile,
}: {
  imagePath?: string | null;
  previewUrl?: string | null;
  label: string;
  onFile: (file: File) => void;
}) {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const hasImage = Boolean(previewUrl || imagePath);

  const takeFile = (file?: File | null) => {
    if (file) onFile(file);
  };

  return (
    <CampaignerSurface
      component="label"
      aria-label={label}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        takeFile(event.dataTransfer.files?.[0]);
      }}
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 300,
        overflow: 'hidden',
        cursor: 'pointer',
        borderStyle: hasImage ? 'solid' : 'dashed',
        borderColor: dragging ? theme.palette.primary.main : theme.campaigner.surface.border,
        backgroundColor: dragging
          ? alpha(theme.palette.primary.main, 0.08)
          : theme.campaigner.surface.subtle,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        hidden
        accept="image/jpeg,image/png,image/svg+xml,image/webp,image/gif"
        onChange={(event) => {
          takeFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      {previewUrl ? (
        <Box
          component="img"
          src={previewUrl}
          alt=""
          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : imagePath ? (
        <AssetAvatar
          assetPath={imagePath}
          variant="rounded"
          sx={{ width: '100%', height: '100%', borderRadius: 0 }}
        />
      ) : (
        <Box sx={{ textAlign: 'center', color: 'text.secondary', px: 2 }}>
          <ShieldOutlinedIcon sx={{ fontSize: 44, opacity: 0.42, color: 'primary.main' }} />
          <Typography sx={{ fontSize: '0.78rem', pt: 1.25, color: 'text.secondary' }}>
            {label}
          </Typography>
        </Box>
      )}
      {hasImage ? (
        <Box
          sx={{
            position: 'absolute',
            right: 10,
            bottom: 10,
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            backgroundColor: alpha(theme.palette.background.paper, 0.86),
            border: `1px solid ${theme.campaigner.surface.border}`,
            color: 'text.secondary',
          }}
        >
          <EditIcon sx={{ fontSize: 16 }} />
        </Box>
      ) : null}
    </CampaignerSurface>
  );
}
