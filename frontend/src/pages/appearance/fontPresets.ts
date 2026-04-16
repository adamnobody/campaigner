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
    id: 'arcane-spectral',
    label: 'Arcane Spectral (Philosopher + Spectral)',
    bodyFamily: '"Spectral", "Crimson Text", serif',
    headingFamily: '"Philosopher", "Cinzel", serif',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Spectral:wght@400;500;600;700&family=Philosopher:wght@400;700&display=swap',
  },
  {
    id: 'imperial-serif',
    label: 'Imperial Serif (Playfair Display + Source Serif 4)',
    bodyFamily: '"Source Serif 4", "Crimson Text", serif',
    headingFamily: '"Playfair Display", "Cinzel", serif',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Serif+4:wght@400;500;600&display=swap',
  },
  {
    id: 'holo-tech',
    label: 'Holo Tech (Chakra Petch + Sora)',
    bodyFamily: '"Sora", "Inter", sans-serif',
    headingFamily: '"Chakra Petch", "Sora", sans-serif',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Chakra+Petch:wght@400;500;600;700&display=swap',
  },
  {
    id: 'industrial-condensed',
    label: 'Industrial Condensed (Space Grotesk + IBM Plex Sans Condensed)',
    bodyFamily: '"IBM Plex Sans Condensed", "Inter", sans-serif',
    headingFamily: '"Space Grotesk", "Inter", sans-serif',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans+Condensed:wght@400;500;600&display=swap',
  },
  {
    id: 'noir-print',
    label: 'Noir Print (Libre Baskerville + Source Sans 3)',
    bodyFamily: '"Source Sans 3", "Inter", sans-serif',
    headingFamily: '"Libre Baskerville", "Georgia", serif',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@400;500;600;700&display=swap',
  },
  {
    id: 'solar-clean',
    label: 'Solar Clean (Manrope + Nunito)',
    bodyFamily: '"Nunito", "Inter", sans-serif',
    headingFamily: '"Manrope", "Nunito", sans-serif',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Nunito:wght@400;500;700&display=swap',
  },
  {
    id: 'local-template',
    label: 'Локальный шрифт из /public/fonts',
    bodyFamily: '"MyLocalFont", serif',
    headingFamily: '"MyLocalFont", serif',
    cssUrl: '/fonts/my-local-font.css',
  },
];
