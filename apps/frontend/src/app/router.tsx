import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ProjectsPage } from '../pages/ProjectsPage';
import { ProjectWorkspacePage } from '../pages/ProjectWorkspacePage';
import { RootLayout } from './RootLayout';
import { ProjectCharactersPage } from '../pages/ProjectCharactersPage';
import { CharacterPage } from '../pages/CharacterPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <ProjectsPage /> },

      // Characters
      { path: 'projects/:projectId/characters', element: <ProjectCharactersPage /> },
      { path: 'projects/:projectId/characters/:characterId', element: <CharacterPage /> },

      // mapId опционален: если его нет — workspace сам выберет первую карту и сделает navigate(replace)
      { path: 'projects/:projectId', element: <ProjectWorkspacePage /> },
      { path: 'projects/:projectId/maps/:mapId', element: <ProjectWorkspacePage /> }
    ]
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
