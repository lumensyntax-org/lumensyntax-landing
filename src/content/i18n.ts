export const LANGS = ['en', 'es'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'en';

/** Route of each page per language; the language toggle and hreflang links use these. */
export const HOME_PATH: Record<Lang, string> = { en: '/', es: '/es/' };
export const PRIVACY_PATH: Record<Lang, string> = { en: '/privacy/', es: '/es/privacidad/' };

/** A localized string: distinct text per language. */
export type L10n = { en: string; es: string };

/**
 * Resolve a field to a language. If the field is a plain string (verified data
 * such as a DOI or number), it is returned unchanged — only L10n objects translate.
 */
export function t(field: L10n | string, lang: Lang): string {
  return typeof field === 'string' ? field : field[lang];
}
