import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import App from './App';
import { dndTheme } from './theme/muiTheme';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { GlobalSnackbar } from './components/ui/GlobalSnackbar';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ThemeProvider theme={dndTheme}>
        <CssBaseline />
        <App />
        <ConfirmDialog />
        <GlobalSnackbar />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);