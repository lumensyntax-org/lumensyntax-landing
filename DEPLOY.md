# Deploy — lumensyntax.com landing

**Source of truth:** this `landing/` directory. To be extracted to the public repo
`github.com/lumensyntax-org/lumensyntax-landing` and deployed to Vercel **via git integration only**.

## The rule that replaces the old practice

NO MORE `vercel deploy --prod` from an uncommitted local copy. The old live landing
(`LumenSyntax_Core/packages/landing/`, a Vite SPA) had no git repo — DEPLOY.md said
"deploys directly from source files" — and its deployed claims drifted from any committed
source (it served text like "Nothing is gated" and a stale 18-domain Ecclesia table that
existed in no file). This landing deploys only from a committed `main`, and a build-time
gate refuses to ship a drifted claim.

## Build

- `npm install`
- `npm run build` — runs the content gate (`check:content`) → `astro build` → `postbuild`
  (`--verify-html`). The build **FAILS** if:
  - any external link in `site.ts` is dead (one retry on a transient timeout, then fail),
  - a required content field is empty,
  - a held/forbidden phrase ("gradient selectivity", "Nothing is gated", "100% Open Source")
    appears in any rendered `dist/**/*.{html,txt}` file,
  - an Ecclesia per-domain breakdown is shown but does not sum to the headline count.
- Output: `dist/` — static HTML; the real text + every DOI/link present **with no JavaScript**
  (verify: `grep zenodo dist/index.html`). This is the machine-readability the page promises.

## Known gate limitation (follow-up)

The link check validates the `site.links` array, **not** the `href`s the components actually
render (which are built from other fields like `paper.versionDOI`, `benchmark.datasetUrl`).
Today they are consistent, but editing a DOI field without also updating `site.links` could
let the gate pass while the page renders a dead link. The honest scope is "the listed links
resolve," not "every rendered link resolves." Follow-up: derive `site.links` from the same
fields the components use, or scan the built `dist/**/*.html` for `href`s and check those.

## Content

All claims live in `src/content/site.ts` (typed by `site.types.ts`). To change any claim,
count, DOI, or license: edit that one file. Components render from it; nothing is hardcoded.
Every value there was verified against live primary sources (Zenodo/HuggingFace/GitHub APIs)
in the 2026-05-31 verification workflow — see `plaza/GROUND-TRUTH.md` and
`docs/superpowers/specs/2026-05-29-landing-consolidation-design.md` in the working repo.

## Rafael's deploy steps (require Rafael's accounts — not automatable here)

1. Create the **public** repo `lumensyntax-org/lumensyntax-landing`; push this `landing/` tree to it.
2. In Vercel: new project from that repo, framework preset = **Astro**, connect git integration.
3. Repoint the `lumensyntax.com` domain to the new Vercel project. Verify on the preview URL first.
4. Confirm the live URL returns real content to a plain `curl` with no JS — the machine-readability
   test (the old SPA failed this: a fetch saw an empty skeleton).

## Vercel build settings

- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`
- Node version: 22

## Related one-surface fixes (Rafael's repo edits, tracked separately)

- Benchmark **data license**: resolved to **CC BY 4.0**. Edit the GitHub
  `instrument-trap-benchmark` README + LICENSE from CC BY-NC 4.0 → CC BY 4.0 to match the HF card.
- Benchmark **code license**: the repo has no SPDX LICENSE file; `site.ts` therefore does not
  claim a code license. Add an OSI license to the repo if "open code" is to be stated.
