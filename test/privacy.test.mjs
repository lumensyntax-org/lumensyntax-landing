import { describe, it, expect } from 'vitest';
import { site } from '../src/content/site.ts';
import { LANGS, PRIVACY_PATH } from '../src/content/i18n.ts';

const p = site.privacy;
const localized = [
  p.title, p.updatedLabel, p.lead, p.contactLabel, p.backLabel,
  ...p.sections.flatMap((s) => [s.heading, s.body, ...(s.link ? [s.link.label] : [])]),
];

describe('privacy notice', () => {
  it('has text in every language for every field', () => {
    for (const field of localized) {
      for (const lang of LANGS) expect(field[lang]?.trim()).toBeTruthy();
    }
  });
  it('lists every external link it renders in site.links, so the build gate checks it', () => {
    for (const s of p.sections) if (s.link) expect(site.links).toContain(s.link.url);
  });
  it('dates its last change and gives a contact address', () => {
    expect(p.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(p.contact).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/);
  });
  it('has a route in every language', () => {
    for (const lang of LANGS) expect(PRIVACY_PATH[lang]).toMatch(/^\/.+\/$/);
  });
});
