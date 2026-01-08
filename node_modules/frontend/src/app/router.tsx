import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ProjectsPage } from '../pages/ProjectsPage';
import { ProjectWorkspacePage } from '../pages/ProjectWorkspacePage';
import { RootLayout } from './RootLayout';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <ProjectsPage /> },

      // mapId опционален: если его нет — workspace сам выберет первую карту и сделает navigate(replace)
      { path: 'projects/:projectId', element: <ProjectWorkspacePage /> },
      { path: 'projects/:projectId/maps/:mapId', element: <ProjectWorkspacePage /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
