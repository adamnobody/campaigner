import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/Layout/AppLayout';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { GlobalSnackbar } from './components/ui/GlobalSnackbar';
import { SplashScreen } from './components/ui/SplashScreen';
import { HomePage } from './pages/HomePage';
import { MapPage } from './pages/MapPage';
import { CharactersPage } from './pages/CharactersPage';
import { CharacterDetailPage } from './pages/CharacterDetailPage';
import { CharacterGraphPage } from './pages/CharacterGraphPage';
import { NotesPage } from './pages/NotesPage';
import { NoteEditorPage } from './pages/NoteEditorPage';
import { WikiPage } from './pages/WikiPage';
import { TimelinePage } from './pages/TimelinePage';
import { FilesPage } from './pages/FilesPage';
import { ProjectSettingsPage } from './pages/ProjectSettingsPage';

const App: React.FC = () => {
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<HomePage />} />

          <Route path="project/:projectId">
            <Route index element={<Navigate to="map" replace />} />
            <Route path="map" element={<MapPage />} />
            <Route path="characters" element={<CharactersPage />} />
            <Route path="characters/new" element={<CharacterDetailPage />} />
            <Route path="characters/graph" element={<CharacterGraphPage />} />
            <Route path="characters/:characterId" element={<CharacterDetailPage />} />
            <Route path="notes" element={<NotesPage />} />
            <Route path="notes/:noteId" element={<NoteEditorPage />} />
            <Route path="wiki" element={<WikiPage />} />
            <Route path="timeline" element={<TimelinePage />} />
            <Route path="files" element={<FilesPage />} />
            <Route path="settings" element={<ProjectSettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>

      <ConfirmDialog />
      <GlobalSnackbar />
    </>
  );
};

export default App;