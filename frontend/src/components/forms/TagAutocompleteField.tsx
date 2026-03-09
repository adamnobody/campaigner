import React from 'react';
import { Autocomplete, Chip, InputAdornment, TextField } from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

interface TagAutocompleteFieldProps {
  options: string[];
  value: string;
  pendingInput: string;
  label?: string;
  placeholder?: string;
  helperText?: string;
  margin?: 'none' | 'dense' | 'normal';
  onValueChange: (value: string) => void;
  onPendingInputChange: (value: string) => void;
}

export const TagAutocompleteField: React.FC<TagAutocompleteFieldProps> = ({
  options,
  value,
  pendingInput,
  label = 'Теги',
  placeholder = 'Выберите или введите...',
  helperText,
  margin = 'none',
  onValueChange,
  onPendingInputChange,
}) => {
  const parsedValue = value
    ? value.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <Autocomplete
      multiple
      freeSolo
      options={options}
      value={parsedValue}
      inputValue={pendingInput}
      onInputChange={(_, newValue) => onPendingInputChange(newValue)}
      onChange={(_, vals) => onValueChange(vals.join(', '))}
      renderTags={(selected, getTagProps) =>
        selected.map((opt, index) => (
          <Chip
            {...getTagProps({ index })}
            key={`${opt}-${index}`}
            label={opt}
            size="small"
            sx={{
              backgroundColor: 'rgba(130,130,255,0.2)',
              color: '#fff',
              fontSize: '0.75rem',
            }}
          />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          helperText={helperText}
          margin={margin}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <InputAdornment position="start">
                  <LocalOfferIcon sx={{ color: 'rgba(201,169,89,0.5)', fontSize: 18 }} />
                </InputAdornment>
                {params.InputProps.startAdornment}
              </>
            ),
          }}
        />
      )}
      noOptionsText="Введите новый тег"
      sx={{
        '& .MuiAutocomplete-clearIndicator': {
          color: 'rgba(255,255,255,0.3)',
        },
        '& .MuiAutocomplete-popupIndicator': {
          color: 'rgba(255,255,255,0.3)',
        },
      }}
    />
  );
};