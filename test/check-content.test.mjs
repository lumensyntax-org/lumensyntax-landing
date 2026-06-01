import { describe, it, expect } from 'vitest';
import { checkRequiredFields } from '../scripts/check-content.mjs';

const validSite = {
  paper1: { title: 'T', versionDOI: '10.x', license: 'CC BY 4.0', status: 's', date: 'd', authors: 'a', primaryLink: 'concept' },
  paper2: { title: 'T2', versionDOI: '10.y', license: 'CC BY 4.0', status: 's', date: 'd', authors: 'a', primaryLink: 'version' },
  ecclesia: { entries: 434, thematicDomains: 18, buildersProfiles: 17, repoUrl: 'u', license: 'l', showBreakdown: false },
  benchmark: { cases: 14950, categories: 8, repoUrl: 'u', datasetUrl: 'u', dataLicense: 'l', codeLicense: null, gated: true },
  held: [], links: [],
};

describe('checkRequiredFields', () => {
  it('passes a fully-populated site', () => {
    expect(checkRequiredFields(validSite)).toEqual([]);
  });
  it('reports an empty required field', () => {
    const bad = { ...validSite, paper1: { ...validSite.paper1, title: '' } };
    const errors = checkRequiredFields(bad);
    expect(errors.some(e => e.includes('paper1.title'))).toBe(true);
  });
  it('reports an ecclesia entry count that is not a positive integer', () => {
    const bad = { ...validSite, ecclesia: { ...validSite.ecclesia, entries: 0 } };
    expect(checkRequiredFields(bad).some(e => e.includes('ecclesia.entries'))).toBe(true);
  });
});

import { checkEcclesiaBreakdown } from '../scripts/check-content.mjs';

describe('checkEcclesiaBreakdown', () => {
  it('passes when breakdown is not shown', () => {
    expect(checkEcclesiaBreakdown({ ecclesia: { entries: 434, showBreakdown: false } })).toEqual([]);
  });
  it('fails when breakdown is shown but absent', () => {
    const errs = checkEcclesiaBreakdown({ ecclesia: { entries: 434, showBreakdown: true } });
    expect(errs.length).toBeGreaterThan(0);
  });
  it('fails when breakdown is shown but does not sum to entries', () => {
    const errs = checkEcclesiaBreakdown({ ecclesia: { entries: 434, showBreakdown: true, breakdown: { A: 200, B: 217 } } });
    expect(errs.some(e => e.includes('sum'))).toBe(true);
  });
  it('passes when breakdown is shown and sums to entries', () => {
    expect(checkEcclesiaBreakdown({ ecclesia: { entries: 434, showBreakdown: true, breakdown: { A: 217, B: 217 } } })).toEqual([]);
  });
});

import { checkHeldClaims, evaluateLinkResults } from '../scripts/check-content.mjs';

describe('checkHeldClaims', () => {
  const held = ['gradient selectivity', 'Nothing is gated'];
  it('passes clean html', () => {
    expect(checkHeldClaims('<p>The epistemic equator</p>', held)).toEqual([]);
  });
  it('catches a held phrase in html (case-insensitive)', () => {
    const errs = checkHeldClaims('<p>nothing is GATED here</p>', held);
    expect(errs.some(e => e.toLowerCase().includes('nothing is gated'))).toBe(true);
  });
  it('does NOT self-match when scanning a site object with held stripped (regression)', () => {
    // The gate serializes site WITHOUT `held`; simulate that. The held phrases must
    // NOT be found in the remaining content, or every build would fail.
    const site = { paper1: { title: 'The Epistemic Equator' }, held };
    const { held: h, ...rest } = site;
    expect(checkHeldClaims(JSON.stringify(rest), h)).toEqual([]);
  });
});

describe('evaluateLinkResults', () => {
  it('passes when all statuses are 2xx/3xx', () => {
    expect(evaluateLinkResults([{ url: 'a', status: 200 }, { url: 'b', status: 302 }])).toEqual([]);
  });
  it('fails on a 404 and reports the url', () => {
    const errs = evaluateLinkResults([{ url: 'x', status: 404 }]);
    expect(errs.some(e => e.includes('x') && e.includes('404'))).toBe(true);
  });
  it('fails on a network error (status 0)', () => {
    expect(evaluateLinkResults([{ url: 'y', status: 0 }]).length).toBe(1);
  });
});

import { checkSourceValues, stripTags } from '../scripts/check-content.mjs';

describe('checkHeldClaims split-markup', () => {
  it('catches a phrase split by inline tags', () => {
    const errs = checkHeldClaims('100% <strong>Open</strong> Source', ['100% Open Source']);
    expect(errs.length).toBe(1);
  });
});

describe('stripTags', () => {
  it('removes tags and collapses whitespace', () => {
    expect(stripTags('a <b>c</b>  d')).toBe('a c d');
  });
});

describe('checkSourceValues', () => {
  it('does NOT self-match the held array itself (pins the gate bug)', () => {
    const site = { paper1: { title: 'clean title' }, held: ['Nothing is gated'], links: [] };
    expect(checkSourceValues(site)).toEqual([]);
  });
  it('catches a held phrase that leaked into a rendered value', () => {
    const site = { paper1: { title: 'Nothing is gated here' }, held: ['Nothing is gated'], links: [] };
    expect(checkSourceValues(site).length).toBe(1);
  });
});

describe('checkRequiredFields benchmark.cases', () => {
  it('reports a non-positive benchmark.cases', () => {
    const base = {
      paper1: { title: 'T', versionDOI: '10.x', license: 'L', status: 's', date: 'd', authors: 'a', primaryLink: 'concept' },
      paper2: { title: 'T2', versionDOI: '10.y', license: 'L', status: 's', date: 'd', authors: 'a', primaryLink: 'version' },
      ecclesia: { entries: 434, showBreakdown: false },
      benchmark: { cases: 0, categories: 8 },
    };
    expect(checkRequiredFields(base).some(e => e.includes('benchmark.cases'))).toBe(true);
  });
});

describe('evaluateLinkResults mixed', () => {
  it('returns only the failures from a mixed array', () => {
    const errs = evaluateLinkResults([{ url: 'ok', status: 200 }, { url: 'bad', status: 500 }, { url: 'ok2', status: 301 }]);
    expect(errs.length).toBe(1);
    expect(errs[0]).toContain('bad');
  });
});
