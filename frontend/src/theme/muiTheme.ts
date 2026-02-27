import { createTheme } from '@mui/material/styles';

export const dndTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#C9A959',       // Золотой — D&D стиль
      light: '#E0CA82',
      dark: '#A08030',
      contrastText: '#1A1A2E',
    },
    secondary: {
      main: '#8B4513',       // Кожаный коричневый
      light: '#A0522D',
      dark: '#6B3410',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#0F0F1A',    // Тёмный фон
      paper: '#1A1A2E',      // Чуть светлее для карточек
    },
    text: {
      primary: '#E8E8E8',
      secondary: '#B0B0B0',
    },
    error: {
      main: '#FF6B6B',
    },
    warning: {
      main: '#F7DC6F',
    },
    success: {
      main: '#82E0AA',
    },
    info: {
      main: '#85C1E9',
    },
    divider: 'rgba(201, 169, 89, 0.2)',
  },
  typography: {
    fontFamily: '"Roboto", "Arial", sans-serif',
    h1: {
      fontFamily: '"Cinzel", "Georgia", serif',
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontFamily: '"Cinzel", "Georgia", serif',
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontFamily: '"Cinzel", "Georgia", serif',
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h4: {
      fontFamily: '"Cinzel", "Georgia", serif',
      fontWeight: 500,
      fontSize: '1.25rem',
    },
    h5: {
      fontFamily: '"Cinzel", "Georgia", serif',
      fontWeight: 500,
      fontSize: '1.1rem',
    },
    h6: {
      fontFamily: '"Cinzel", "Georgia", serif',
      fontWeight: 500,
      fontSize: '1rem',
    },
    body1: {
      fontFamily: '"Crimson Text", "Georgia", serif',
      fontSize: '1.05rem',
      lineHeight: 1.7,
    },
    body2: {
      fontSize: '0.9rem',
    },
    button: {
      fontFamily: '"Cinzel", "Georgia", serif',
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.05em',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '8px 20px',
        },
        contained: {
          boxShadow: '0 2px 8px rgba(201, 169, 89, 0.3)',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(201, 169, 89, 0.4)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(201, 169, 89, 0.15)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          '&:hover': {
            borderColor: 'rgba(201, 169, 89, 0.4)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#16162A',
          borderRight: '1px solid rgba(201, 169, 89, 0.15)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#16162A',
          borderBottom: '1px solid rgba(201, 169, 89, 0.15)',
          boxShadow: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(201, 169, 89, 0.3)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(201, 169, 89, 0.5)',
            },
          },
        },
      },
    },
  },
});