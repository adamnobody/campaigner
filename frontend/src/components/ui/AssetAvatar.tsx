import React from 'react';
import { Avatar, type AvatarProps } from '@mui/material';

import { useAssetUrl } from '@/hooks/useAssetUrl';

type AssetAvatarProps = Omit<AvatarProps, 'src'> & {
  assetPath?: string | null;
};

/** Avatar that resolves `/uploads/...` paths for HTTP and Tauri transports. */
export const AssetAvatar: React.FC<AssetAvatarProps> = ({ assetPath, ...avatarProps }) => {
  const src = useAssetUrl(assetPath);
  return <Avatar src={src} {...avatarProps} />;
};
