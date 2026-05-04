export const SPLASH_TIP_KEYS = [
  't0',
  't1',
  't2',
  't3',
  't4',
  't5',
  't6',
  't7',
  't8',
  't9',
  't10',
  't11',
] as const;

export type SplashTipKey = (typeof SPLASH_TIP_KEYS)[number];
