// Build gate: validates site.ts content before Astro builds. Pure functions + a runnable main.

export function checkRequiredFields(site) {
  const errors = [];
  const need = (path, val) => {
    if (val === undefined || val === null || val === '') errors.push(`empty required field: ${path}`);
  };
  for (const p of ['paper1', 'paper2']) {
    need(`${p}.title`, site[p]?.title);
    need(`${p}.versionDOI`, site[p]?.versionDOI);
    need(`${p}.license`, site[p]?.license);
  }
  if (!Number.isInteger(site.ecclesia?.entries) || site.ecclesia.entries <= 0) {
    errors.push('ecclesia.entries must be a positive integer');
  }
  if (!Number.isInteger(site.benchmark?.cases) || site.benchmark.cases <= 0) {
    errors.push('benchmark.cases must be a positive integer');
  }
  return errors;
}

export function checkEcclesiaBreakdown(site) {
  const e = site.ecclesia;
  if (!e?.showBreakdown) return [];
  if (!e.breakdown || typeof e.breakdown !== 'object') {
    return ['ecclesia.showBreakdown is true but ecclesia.breakdown is missing'];
  }
  const sum = Object.values(e.breakdown).reduce((a, b) => a + Number(b), 0);
  if (sum !== e.entries) {
    return [`ecclesia.breakdown sum (${sum}) does not equal ecclesia.entries (${e.entries})`];
  }
  return [];
}

// Collapse HTML tags + whitespace so a phrase split by inline markup can't hide.
export function stripTags(content) {
  return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
}

export function checkHeldClaims(content, held) {
  const lower = stripTags(content).toLowerCase();
  return held
    .filter((phrase) => lower.includes(phrase.toLowerCase()))
    .map((phrase) => `held claim appears: "${phrase}"`);
}

// Scan the site's RENDERED values (everything except the `held` list itself) for held phrases.
// Stripping `held` is essential: it contains the forbidden phrases, so serializing the whole
// object would self-match and fail every build. This is tested directly so the guard is real.
export function checkSourceValues(site) {
  const { held, ...rest } = site;
  return checkHeldClaims(JSON.stringify(rest), held);
}

export function evaluateLinkResults(results) {
  return results
    .filter((r) => !(r.status >= 200 && r.status < 400))
    .map((r) => `link not OK (${r.status}): ${r.url}`);
}

async function fetchOnce(url) {
  const opts = {
    redirect: 'follow',
    headers: { 'User-Agent': 'lumensyntax-landing-content-gate' },
    signal: AbortSignal.timeout(15000),
  };
  try {
    let res = await fetch(url, { ...opts, method: 'HEAD' });
    // Some hosts reject HEAD or bot-gate it; retry with GET on these.
    if ([403, 405, 429, 501].includes(res.status)) {
      res = await fetch(url, { ...opts, method: 'GET' });
    }
    return res.status;
  } catch {
    return 0; // network error / timeout
  }
}

// One retry on a status-0 (transient timeout/network). A persistently-down link
// still returns 0 twice and fails the gate; a slow-first-byte host gets a second
// chance, so the gate doesn't cry wolf on a healthy link under concurrent load.
async function fetchStatus(url) {
  let status = await fetchOnce(url);
  if (status === 0) status = await fetchOnce(url);
  return { url, status };
}

// Check links SEQUENTIALLY, not concurrently. A simultaneous burst of ~9 HEAD requests
// makes rate-limited hosts (e.g. doi.org) slow past the timeout and return 0, failing the
// gate on healthy links. One-at-a-time is plenty fast for a handful of links and is reliable.
async function checkLinksSequentially(urls) {
  const results = [];
  for (const url of urls) {
    results.push(await fetchStatus(url));
  }
  return results;
}

async function collectTextFiles(dir) {
  const { readdir } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const results = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      results.push(...(await collectTextFiles(full)));
    } else if (/\.(html|txt)$/i.test(e.name)) {
      results.push(full);
    }
  }
  return results;
}

async function main() {
  const offline = process.argv.includes('--offline');
  const verifyHtml = process.argv.includes('--verify-html');
  const { site } = await import('../src/content/site.ts');

  // --verify-html: POST-BUILD scan of ALL rendered text output (html + txt, e.g. llms.txt).
  // This is the MEANINGFUL held-claim protection — it sees what visitors actually receive.
  if (verifyHtml) {
    const { readFile } = await import('node:fs/promises');
    const { fileURLToPath } = await import('node:url');
    const { dirname, join } = await import('node:path');
    const distDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
    const files = await collectTextFiles(distDir);
    if (files.length === 0) {
      console.error('BUILT-HTML GATE FAILED:\n  - no dist/ output found — run a build first');
      process.exit(1);
    }
    const leaks = [];
    for (const f of files) {
      const content = await readFile(f, 'utf8');
      leaks.push(...checkHeldClaims(content, site.held).map((e) => `${e} (in ${f})`));
    }
    if (leaks.length) {
      console.error('BUILT-HTML GATE FAILED:\n' + leaks.map((e) => '  - ' + e).join('\n'));
      process.exit(1);
    }
    console.log(`[check-content] built output OK — scanned ${files.length} text files, no held claims.`);
    return;
  }

  const errors = [
    ...checkRequiredFields(site),
    ...checkEcclesiaBreakdown(site),
    ...checkSourceValues(site),
  ];

  if (!offline) {
    const results = await checkLinksSequentially(site.links);
    errors.push(...evaluateLinkResults(results));
  } else {
    console.log('[check-content] --offline: skipping live link checks');
  }

  if (errors.length) {
    console.error('CONTENT GATE FAILED:\n' + errors.map((e) => '  - ' + e).join('\n'));
    process.exit(1);
  }
  console.log(`[check-content] OK — ${site.links.length} links, all required fields present, no held claims.`);
}

import { fileURLToPath } from 'node:url';
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error('CONTENT GATE FAILED (unexpected error):\n  - ' + (err?.message || err));
    process.exit(1);
  });
}
