import { parseDocument } from '@/components/document-editor/documentMeta';

/** Упрощённый текст превью вики-контента для карточек списка */
export function getPlainPreviewText(content: string): string {
  const { body } = parseDocument(content);
  return body
    .replace(/^#+\s+/gm, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_~`>#]/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
