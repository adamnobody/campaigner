export type FontPresetOption = {
  id: string;
  label: string;
  bodyFamily: string;
  headingFamily: string;
  cssUrl: string;
};

export const FONT_PRESET_OPTIONS: FontPresetOption[] = [
  {
    id: 'default-inter-cinzel',
    label: 'Inter + Cinzel (по умолчанию)',
    bodyFamily: '"Inter", "Roboto", sans-serif',
    headingFamily: '"Cinzel", serif',
    cssUrl: '',
  },
  {
    id: 'kode-mono',
    label: 'Kode Mono (Google Fonts)',
    bodyFamily: '"Kode Mono", "Fira Code", monospace',
    headingFamily: '"Kode Mono", "Fira Code", monospace',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Kode+Mono:wght@400;700&display=swap',
  },
  {
    id: 'playfair',
    label: 'Playfair Display + Inter',
    bodyFamily: '"Inter", "Roboto", sans-serif',
    headingFamily: '"Playfair Display", "Georgia", serif',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@600;700&display=swap',
  },
  {
    id: 'cinzel-crimson',
    label: 'Cinzel + Crimson Text',
    bodyFamily: '"Crimson Text", "Georgia", serif',
    headingFamily: '"Cinzel", serif',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Crimson+Text:wght@400;600;700&display=swap',
  },
  {
    id: 'gothic-noir',
    label: 'Gothic Noir (UnifrakturCook + Cormorant)',
    bodyFamily: '"Cormorant Garamond", "Georgia", serif',
    headingFamily: '"UnifrakturCook", "Cinzel", serif',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=UnifrakturCook:wght@700&display=swap',
  },
  {
    id: 'fantasy-realm',
    label: 'Fantasy Realm (MedievalSharp + Marcellus)',
    bodyFamily: '"Marcellus", "Georgia", serif',
    headingFamily: '"MedievalSharp", "Cinzel", serif',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Marcellus&family=MedievalSharp&display=swap',
  },
  {
    id: 'scifi-terminal',
    label: 'Sci‑Fi Terminal (Orbitron + Rajdhani)',
    bodyFamily: '"Rajdhani", "Inter", sans-serif',
    headingFamily: '"Orbitron", "Inter", sans-serif',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;800&family=Rajdhani:wght@400;500;600;700&display=swap',
  },
  {
    id: 'handwritten-journal',
    label: 'Handwritten Journal (Caveat + Patrick Hand)',
    bodyFamily: '"Patrick Hand", "Comic Sans MS", cursive',
    headingFamily: '"Caveat", "Patrick Hand", cursive',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Patrick+Hand&display=swap',
  },
  {
    id: 'local-template',
    label: 'Локальный шрифт из /public/fonts',
    bodyFamily: '"MyLocalFont", serif',
    headingFamily: '"MyLocalFont", serif',
    cssUrl: '/fonts/my-local-font.css',
  },
];
