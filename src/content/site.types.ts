import type { L10n } from './i18n';

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
  label: L10n;
  value: L10n;       // prose-with-numbers; the sentence structure differs by language
  method: L10n;
  caveat?: L10n;
}

export interface SiteContent {
  paper1: Paper;
  paper2: Paper;
  /** five structural properties */
  properties: { name: string; statement: L10n; illustration: L10n }[];
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
  scaleFloor: { family: string; rate: string; note: L10n };
  /** the documented exception, named honestly */
  exception: { family: string; rate: string; reason: L10n };
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
  gatedNote: L10n;
  /** claims kept in data but forbidden from rendering; gate fails if any string here appears in built HTML */
  held: string[];
  /** every external URL the gate must verify resolves */
  links: string[];
  lab: {
    name: string;
    tagline: L10n;
    intro: L10n;
    rules: {
      classificationsHeading: L10n;
      classifications: { name: string; meaning: L10n; action: string }[];
      movesHeading: L10n;
      moves: { name: L10n; statement: L10n }[];
    };
    positions: {
      structureRationale: { heading: L10n; body: L10n };
      futureOfEpistemicSafety: { heading: L10n; body: L10n };
      whyItMatters: { heading: L10n; body: L10n };
    };
    labels: {
      verifiedFact: L10n;
      labsReading: L10n;
      research: L10n;
      approach: L10n;
      executionRules: L10n;
      availability: L10n;
    };
    ui: {
      publications: L10n;
      ecclesiaHeading: L10n;
      ecclesiaBody: L10n;        // takes {entries}/{domains}/{builders}/{license}/{repo} via the component
      benchmarkHeading: L10n;
      benchmarkBody: L10n;
      crossFamilyHeading: L10n;
      crossFamilyLead: L10n;     // "Publicly-reproducible families — X — reach Y."
      scaleFloorLabel: L10n;     // "Scale floor" / "Piso de escala"
      exceptionLabel: L10n;      // "Documented exception" / "Excepción documentada"
      operationalTestLabel: L10n;
      operationalTest: L10n;
    };
  };
}
