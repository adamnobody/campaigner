import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';
import i18n from '@/i18n';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="50vh"
          p={4}
        >
          <Paper
            sx={{
              p: 4,
              maxWidth: 500,
              textAlign: 'center',
              backgroundColor: 'rgba(255,50,50,0.05)',
              border: '1px solid rgba(255,50,50,0.2)',
              borderRadius: 3,
            }}
          >
            <ErrorOutlineIcon sx={{ fontSize: 64, color: 'rgba(255,100,100,0.6)', mb: 2 }} />

            <Typography
              variant="h5"
              sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: '#fff', mb: 1 }}
            >
              {i18n.t('errorBoundary.title')}
            </Typography>

            <Typography
              variant="body2"
              sx={{ color: 'rgba(255,255,255,0.5)', mb: 3 }}
            >
              {i18n.t('errorBoundary.description')}
            </Typography>

            {this.state.error && (
              <Paper
                sx={{
                  p: 2, mb: 3, textAlign: 'left',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  borderRadius: 1,
                  maxHeight: 120,
                  overflow: 'auto',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255,100,100,0.7)', fontFamily: 'monospace', fontSize: '0.7rem' }}
                >
                  {this.state.error.message}
                </Typography>
              </Paper>
            )}

            <Box display="flex" gap={2} justifyContent="center">
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={this.handleReset}
                sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
              >
                {i18n.t('errorBoundary.retry')}
              </Button>
              <Button
                variant="contained"
                startIcon={<HomeIcon />}
                onClick={this.handleGoHome}
                sx={{
                  backgroundColor: 'rgba(130,130,255,0.3)',
                  '&:hover': { backgroundColor: 'rgba(130,130,255,0.5)' },
                }}
              >
                {i18n.t('errorBoundary.home')}
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}