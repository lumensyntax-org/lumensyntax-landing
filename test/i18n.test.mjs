import { describe, it, expect } from 'vitest';
import { t, LANGS, DEFAULT_LANG } from '../src/content/i18n.ts';

describe('t()', () => {
  it('returns the EN string for lang=en', () => {
    expect(t({ en: 'Hello', es: 'Hola' }, 'en')).toBe('Hello');
  });
  it('returns the ES string for lang=es', () => {
    expect(t({ en: 'Hello', es: 'Hola' }, 'es')).toBe('Hola');
  });
  it('passes through a plain string unchanged (non-localized data)', () => {
    expect(t('10.5281/zenodo.19634358', 'es')).toBe('10.5281/zenodo.19634358');
  });
  it('exposes the language list and default', () => {
    expect(LANGS).toEqual(['en', 'es']);
    expect(DEFAULT_LANG).toBe('en');
  });
});
