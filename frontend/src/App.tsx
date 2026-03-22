import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/Layout/AppLayout';
import { SplashScreen } from './components/ui/SplashScreen';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
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
import { WikiGraphPage } from './pages/WikiGraphPage';
import { AppearanceSettingsPage } from './pages/AppearanceSettingsPage';
import { DogmasPage } from './pages/DogmasPage';
import { FactionsPage } from './pages/FactionsPage';
import { FactionDetailPage } from './pages/FactionDetailPage';

const App: React.FC = () => {
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="appearance" element={<ErrorBoundary><AppearanceSettingsPage /></ErrorBoundary>} />
          <Route path="project/:projectId">
            <Route index element={<Navigate to="map" replace />} />
            <Route path="map" element={<ErrorBoundary><MapPage /></ErrorBoundary>} />
            <Route path="map/:mapId" element={<ErrorBoundary><MapPage /></ErrorBoundary>} />
            <Route path="characters" element={<ErrorBoundary><CharactersPage /></ErrorBoundary>} />
            <Route path="characters/new" element={<ErrorBoundary><CharacterDetailPage /></ErrorBoundary>} />
            <Route path="characters/graph" element={<ErrorBoundary><CharacterGraphPage /></ErrorBoundary>} />
            <Route path="characters/:characterId" element={<ErrorBoundary><CharacterDetailPage /></ErrorBoundary>} />
            <Route path="notes" element={<ErrorBoundary><NotesPage /></ErrorBoundary>} />
            <Route path="notes/:noteId" element={<ErrorBoundary><NoteEditorPage /></ErrorBoundary>} />
            <Route path="wiki/graph" element={<ErrorBoundary><WikiGraphPage /></ErrorBoundary>} />
            <Route path="wiki" element={<ErrorBoundary><WikiPage /></ErrorBoundary>} />
            <Route path="timeline" element={<ErrorBoundary><TimelinePage /></ErrorBoundary>} />
            <Route path="dogmas" element={<ErrorBoundary><DogmasPage /></ErrorBoundary>} />
            <Route path="factions" element={<ErrorBoundary><FactionsPage /></ErrorBoundary>} />
            <Route path="factions/new" element={<ErrorBoundary><FactionDetailPage /></ErrorBoundary>} />
            <Route path="factions/:factionId" element={<ErrorBoundary><FactionDetailPage /></ErrorBoundary>} />
            <Route path="files" element={<ErrorBoundary><FilesPage /></ErrorBoundary>} />
            <Route path="settings" element={<ErrorBoundary><ProjectSettingsPage /></ErrorBoundary>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
};

export default App;