import React, { Suspense, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { SplashScreen } from './components/ui/SplashScreen';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { CircularProgress, Box } from '@mui/material';

const HomePage = React.lazy(() => import('./pages/home/HomePage').then(m => ({ default: m.HomePage })));
const MapPage = React.lazy(() => import('./pages/maps/MapPage').then(m => ({ default: m.MapPage })));
const CharactersPage = React.lazy(() => import('./pages/characters/CharactersPage').then(m => ({ default: m.CharactersPage })));
const CharacterDetailPage = React.lazy(() => import('./pages/characters/CharacterDetailPage').then(m => ({ default: m.CharacterDetailPage })));
const CharacterGraphPage = React.lazy(() => import('./pages/characters/CharacterGraphPage').then(m => ({ default: m.CharacterGraphPage })));
const NotesPage = React.lazy(() => import('./pages/notes/NotesPage').then(m => ({ default: m.NotesPage })));
const NoteEditorPage = React.lazy(() => import('./pages/notes/NoteEditorPage').then(m => ({ default: m.NoteEditorPage })));
const WikiPage = React.lazy(() => import('./pages/wiki/WikiPage').then(m => ({ default: m.WikiPage })));
const TimelinePage = React.lazy(() => import('./pages/timeline/TimelinePage').then(m => ({ default: m.TimelinePage })));
const ProjectSettingsPage = React.lazy(() => import('./pages/project-settings/ProjectSettingsPage').then(m => ({ default: m.ProjectSettingsPage })));
const WikiGraphPage = React.lazy(() => import('./pages/wiki/WikiGraphPage').then(m => ({ default: m.WikiGraphPage })));
const AppearanceSettingsPage = React.lazy(() => import('./pages/appearance/AppearanceSettingsPage').then(m => ({ default: m.AppearanceSettingsPage })));
const DogmasPage = React.lazy(() => import('./pages/dogmas/DogmasPage').then(m => ({ default: m.DogmasPage })));
const FactionsPage = React.lazy(() => import('./pages/factions/FactionsPage').then(m => ({ default: m.FactionsPage })));
const FactionDetailPage = React.lazy(() => import('./pages/factions/FactionDetailPage').then(m => ({ default: m.FactionDetailPage })));
const DynastiesPage = React.lazy(() => import('./pages/dynasties/DynastiesPage').then(m => ({ default: m.DynastiesPage })));
const DynastyDetailPage = React.lazy(() => import('./pages/dynasties/DynastyDetailPage').then(m => ({ default: m.DynastyDetailPage })));
const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
    <CircularProgress />
  </Box>
);

const App: React.FC = () => {
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
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
              <Route path="states" element={<ErrorBoundary><FactionsPage entityType="state" /></ErrorBoundary>} />
              <Route path="states/new" element={<ErrorBoundary><FactionDetailPage entityType="state" /></ErrorBoundary>} />
              <Route path="states/:factionId" element={<ErrorBoundary><FactionDetailPage entityType="state" /></ErrorBoundary>} />
              <Route path="factions" element={<ErrorBoundary><FactionsPage /></ErrorBoundary>} />
              <Route path="factions/new" element={<ErrorBoundary><FactionDetailPage /></ErrorBoundary>} />
              <Route path="factions/:factionId" element={<ErrorBoundary><FactionDetailPage /></ErrorBoundary>} />
              <Route path="dynasties" element={<ErrorBoundary><DynastiesPage /></ErrorBoundary>} />
              <Route path="dynasties/new" element={<ErrorBoundary><DynastyDetailPage /></ErrorBoundary>} />
              <Route path="dynasties/:dynastyId" element={<ErrorBoundary><DynastyDetailPage /></ErrorBoundary>} />
              <Route path="settings" element={<ErrorBoundary><ProjectSettingsPage /></ErrorBoundary>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default App;
