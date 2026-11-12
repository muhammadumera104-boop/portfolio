// Makes the fixed CV file: node build/make-cv.mjs   (or: npm run cv)
//
// It renders the CV from src/data/content.js (see src/render/cv.js) and prints it to public/cv/Muhammad-Umer-Rizwan-CV.pdf
// with the Chrome or Edge that is already on your computer, so no extra package is needed. Run it again after you change
// your education, skills, projects or certificates, then commit the new PDF. The download button always serves this file.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { cvHtml, CV_FILE } from '../src/render/cv.js';

const root = resolve(import.meta.dirname, '..');
const SITE_URL = process.env.SITE_URL || 'https://muhammad-umer-portfolio-rouge.vercel.app';

const candidates = [
  process.env.CV_BROWSER,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const browser = candidates.find((path) => existsSync(path));
if (!browser) {
  console.error('No Chrome or Edge found. Set CV_BROWSER to the browser program, for example:\n  CV_BROWSER="C:/path/to/chrome.exe" npm run cv');
  process.exit(1);
}

const work = mkdtempSync(join(tmpdir(), 'cv-'));
try {
  const html = join(work, 'cv.html');
  writeFileSync(html, cvHtml(SITE_URL));
  const outDir = join(root, 'public', 'cv');
  mkdirSync(outDir, { recursive: true });
  const out = join(outDir, CV_FILE);
  execFileSync(browser, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--user-data-dir=${join(work, 'profile')}`, `--print-to-pdf=${out}`, pathToFileURL(html).href], {
    stdio: 'ignore',
    timeout: 60_000,
  });
  console.log(`Wrote ${out} (${Math.round(statSync(out).size / 1024)} KB)`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
