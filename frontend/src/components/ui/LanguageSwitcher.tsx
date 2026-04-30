import React, { useCallback } from 'react';
import type { BoxProps } from '@mui/material/Box';
import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { AppLanguage } from '@/i18n/types';
import { isSupportedLanguage, saveLanguage } from '@/i18n/language';

const OPTIONS: readonly AppLanguage[] = ['en', 'ru'];

type LanguageSwitcherProps = {
  sx?: BoxProps['sx'];
};

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ sx }) => {
  const { t, i18n } = useTranslation('common');

  const raw = i18n.resolvedLanguage ?? i18n.language;
  const value: AppLanguage = isSupportedLanguage(raw) ? raw : 'en';

  const handleChange = useCallback(
    (event: SelectChangeEvent<AppLanguage>) => {
      const next = event.target.value;
      if (!isSupportedLanguage(next)) return;
      saveLanguage(next);
      void i18n.changeLanguage(next);
    },
    [i18n]
  );

  return (
    <Box sx={{ minWidth: 140, ...sx }}>
      <FormControl size="small" fullWidth variant="outlined">
        <InputLabel id="language-switcher-label" shrink>
          {t('language')}
        </InputLabel>
        <Select<AppLanguage>
          labelId="language-switcher-label"
          label={t('language')}
          id="language-switcher-select"
          value={value}
          onChange={handleChange}
          inputProps={{
            'aria-label': t('selectLanguage'),
          }}
        >
          {OPTIONS.map((code) => (
            <MenuItem key={code} value={code}>
              {code === 'en' ? t('english') : t('russian')}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};
