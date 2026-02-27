import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StyleState {
  // Фон
  backgroundImage: string;
  backgroundOpacity: number;

  // Цвета
  accentColor: string;
  cardBackground: string;
  textOpacity: number;

  // Шрифт заголовков
  headerFont: string;

  // Actions
  setBackgroundImage: (url: string) => void;
  setBackgroundOpacity: (opacity: number) => void;
  setAccentColor: (color: string) => void;
  setCardBackground: (bg: string) => void;
  setTextOpacity: (opacity: number) => void;
  setHeaderFont: (font: string) => void;
  resetStyles: () => void;
}

const defaultStyles = {
  backgroundImage: '',
  backgroundOpacity: 0.3,
  accentColor: 'rgba(130,130,255,0.9)',
  cardBackground: 'rgba(255,255,255,0.04)',
  textOpacity: 0.5,
  headerFont: '"Cinzel", "Georgia", serif',
};

export const useStyleStore = create<StyleState>()(
  persist(
    (set) => ({
      ...defaultStyles,

      setBackgroundImage: (url) => set({ backgroundImage: url }),
      setBackgroundOpacity: (opacity) => set({ backgroundOpacity: opacity }),
      setAccentColor: (color) => set({ accentColor: color }),
      setCardBackground: (bg) => set({ cardBackground: bg }),
      setTextOpacity: (opacity) => set({ textOpacity: opacity }),
      setHeaderFont: (font) => set({ headerFont: font }),

      resetStyles: () => set(defaultStyles),
    }),
    {
      name: 'campaigner-styles',
    }
  )
);