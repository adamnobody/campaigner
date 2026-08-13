import './i18n';
import '@fontsource/cormorant-garamond/cyrillic-500.css';
import '@fontsource/cormorant-garamond/cyrillic-600.css';
import '@fontsource/cormorant-garamond/cyrillic-700.css';
import '@fontsource/ibm-plex-sans/cyrillic-300.css';
import '@fontsource/ibm-plex-sans/cyrillic-400.css';
import '@fontsource/ibm-plex-sans/cyrillic-500.css';
import '@fontsource/ibm-plex-sans/cyrillic-600.css';
import '@fontsource/ibm-plex-mono/cyrillic-400.css';
import '@fontsource/ibm-plex-mono/cyrillic-500.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AppThemeProvider } from './theme/AppThemeProvider';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { GlobalSnackbar } from './components/ui/GlobalSnackbar';
import { OnboardingOverlay } from './components/onboarding/OnboardingOverlay';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AppThemeProvider>
        <App />
        <ConfirmDialog />
        <GlobalSnackbar />
        <OnboardingOverlay />
      </AppThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);