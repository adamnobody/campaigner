import React from 'react';
import { Outlet } from 'react-router-dom';
import { CommandPalette } from '../shared/ui/CommandPalette';

export function RootLayout() {
  return (
    <>
      <Outlet />
      <CommandPalette />
    </>
  );
}
