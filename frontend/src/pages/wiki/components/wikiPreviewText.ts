/** Упрощённый текст превью вики-контента для карточек списка */
export function getPlainPreviewText(content: string): string {
  return content
    .replace(/^#+\s+/gm, '')
    .replace(/$$([^$$]+)\]$\/__note__\/\d+$/g, '$1')
    .replace(/$$([^$$]+)\]$[^)]+$/g, '$1')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
