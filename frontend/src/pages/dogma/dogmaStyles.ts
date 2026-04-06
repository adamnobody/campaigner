import { useTheme } from '@mui/material';

export const useImportanceColors = () => {
  const theme = useTheme();
  return {
    fundamental: theme.palette.error.main,
    major: theme.palette.warning.main,
    minor: theme.palette.info.main,
  };
};
