import React, { useState } from 'react';
import { Box, Button, Typography, alpha, useTheme } from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import { useAssetUrl } from '@/hooks/useAssetUrl';
import { DndButton } from '@/components/ui/DndButton';

export function CoverDropzone({
  path,
  readOnly,
  uploadLabel,
  libraryLabel,
  hint,
  libraryPaths = [],
  onUpload,
  onPick,
}: {
  path?: string;
  readOnly?: boolean;
  uploadLabel: string;
  libraryLabel: string;
  hint: string;
  libraryPaths?: string[];
  onUpload: (file: File) => void;
  onPick: (path: string) => void;
}) {
  const theme = useTheme();
  const url = useAssetUrl(path);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  return (
    <Box
      onDragOver={(event) => {
        if (readOnly) return;
        event.preventDefault();
      }}
      onDrop={(event) => {
        if (readOnly) return;
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (file) onUpload(file);
      }}
      sx={{
        position: 'relative',
        height: 200,
        mb: 2.5,
        borderRadius: '14px',
        overflow: 'hidden',
        border: url ? 'none' : `1px dashed ${theme.campaigner.surface.border}`,
        backgroundColor: alpha(theme.palette.common.white, 0.02),
        backgroundImage: url ? `url("${url}")` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {!url && (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, px: 2 }}>
          <CloudUploadOutlinedIcon sx={{ color: 'text.disabled' }} />
          <Typography sx={{ color: 'text.disabled', fontSize: '0.82rem', textAlign: 'center' }}>{hint}</Typography>
        </Box>
      )}
      {!readOnly && (
        <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 1 }}>
          <DndButton size="small" variant="outlined" onClick={() => inputRef.current?.click()}>
            {uploadLabel}
          </DndButton>
          <DndButton size="small" variant="outlined" onClick={() => setLibraryOpen((open) => !open)}>
            {libraryLabel}
          </DndButton>
        </Box>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) onUpload(file);
        }}
      />
      {libraryOpen && libraryPaths.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: 52,
            right: 12,
            width: 220,
            maxHeight: 140,
            overflow: 'auto',
            p: 1,
            borderRadius: 1.5,
            border: `1px solid ${theme.campaigner.surface.border}`,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          {libraryPaths.map((item) => (
            <Button key={item} fullWidth size="small" onClick={() => { onPick(item); setLibraryOpen(false); }} sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>
              {item.split('/').pop()}
            </Button>
          ))}
        </Box>
      )}
    </Box>
  );
}
