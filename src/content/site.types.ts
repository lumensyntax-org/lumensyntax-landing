export interface Paper {
  title: string;
  /** display headline — the part before the colon */
  headline: string;
  /** display subtitle — the part after the colon (may be empty) */
  subtitle: string;
  authors: string;
  versionDOI: string;
  conceptDOI?: string;
  license: string;
  status: string;
  date: string;
  /** which DOI the primary link uses; concept stays valid across versions */
  primaryLink: 'concept' | 'version';
  framing?: string;
}

export interface SelfMetric {
  label: string;
  value: string;
  method: string;   // e.g. "raw automated semantic, N=300" or "author-adjusted manual review, 2026-03-16"
  caveat?: string;
}

export interface SiteContent {
  paper1: Paper;
  paper2: Paper;
  /** five structural properties */
  properties: { name: string; statement: string; illustration: string }[];
  models: {
    hfOrgUrl: string;
    families: string[];
    count: number;
    countIsSoft: boolean;   // true => render as "currently N", never as a hard asset claim
    note: string;
  };
  /** families where the fine-tune cleanly replicates (publicly reproducible) */
  publicFamilies: string[];
  /** the honestly-labeled metric for publicFamilies (behavioral, NOT non-fabrication) */
  publicFamiliesMetric: string;
  /** the smallest-scale config where non-fabrication does NOT hold — named honestly */
  scaleFloor: { family: string; rate: string; note: string };
  /** the documented exception, named honestly */
  exception: { family: string; rate: string; reason: string };
  ecclesia: {
    entries: number;
    thematicDomains: number;
    buildersProfiles: number;
    repoUrl: string;
    license: string;
    showBreakdown: boolean;   // false unless regenerated-from-repo and asserted to sum to `entries`
  };
  benchmark: {
    cases: number;
    categories: number;
    repoUrl: string;
    datasetUrl: string;
    dataLicense: string;
    codeLicense: string | null;   // null => do not claim a code license
    gated: boolean;
  };
  probe: {
    name: string;
    examples: number;
    domains: number;
    balance: string;
    license: string;
    gated: boolean;
    companionTo: 'paper1' | 'paper2';
    url: string;
  };
  selfMetrics: SelfMetric[];
  /** availability honesty: what is open vs gated */
  gatedNote: string;
  /** claims kept in data but forbidden from rendering; gate fails if any string here appears in built HTML */
  held: string[];
  /** every external URL the gate must verify resolves */
  links: string[];
}
