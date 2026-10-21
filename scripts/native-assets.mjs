#!/usr/bin/env node
// Generates the native app icon and launch screen (iOS + Android) from the
// @makola mark (the "m" book — design system, assets/logo-mark*.svg).
//
// Why Chrome and not @capacitor/assets: the latter depends on `sharp`, whose
// native install script is blocked by npm's `allow-scripts` policy on this
// machine. Headless Chrome renders the SVG pixel-perfect, with no dependency.
//
//   node scripts/native-assets.mjs            (CHROME=/path/to/chrome to override)

import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// @makola base colours (src/theme/tokens/colors.scss).
const BLUE = '#1B4FD8';
const INK = '#101A2E';
const WHITE = '#FFFFFF';
const DILUTED_AMBER = '#F7E7CE'; // bookmark on blue (the Logo component's `white` tone)

// Path of the mark — copied as is from components/brand/Logo.jsx.
const STROKE = 'M13.75 75.75V44a18.25 18.25 0 0 1 36.5 0v31.75M50.25 44a18.25 18.25 0 0 1 36.5 0v31.75M10 75.75h80.5';
const BOOKMARK = 'M45.25 79.5h10v15l-5-4.5-5 4.5z';

/** The mark, centred, filling `ratio` of the shorter side. */
function page({ width, height, background, ratio, round = false, radius = 0 }) {
  const side = Math.min(width, height);
  const mark = side * ratio;
  const bg = background
    ? `<rect width="${width}" height="${height}" fill="${background}" ${round ? `rx="${side / 2}"` : radius ? `rx="${side * radius}"` : ''}/>`
    : '';
  return `<!doctype html><html><head><style>html,body{margin:0;background:transparent}svg{display:block}</style></head><body>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${bg}
  <svg x="${(width - mark) / 2}" y="${(height - mark) / 2}" width="${mark}" height="${mark}" viewBox="0.25 8.25 100 100">
    <path d="${STROKE}" fill="none" stroke="${WHITE}" stroke-width="7.5"/>
    <path d="${BOOKMARK}" fill="${DILUTED_AMBER}"/>
  </svg>
</svg></body></html>`;
}

const tmp = mkdtempSync(join(tmpdir(), 'makola-assets-'));
let n = 0;

function render(dest, spec) {
  const html = join(tmp, `p${n++}.html`);
  writeFileSync(html, page(spec));
  execFileSync(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--default-background-color=00000000',
    `--window-size=${spec.width},${spec.height}`,
    `--screenshot=${join(ROOT, dest)}`,
    `file://${html}`
  ], { stdio: 'ignore' });
  console.log(`✔ ${dest} (${spec.width}×${spec.height})`);
}

if (!existsSync(CHROME)) {
  console.error(`Chrome not found: ${CHROME}\nSet CHROME=/path/to/chrome.`);
  process.exit(1);
}

// ── Icon ────────────────────────────────────────────────────────────────────
// Blue tile, white mark at 70 % (assets/logo-icon.svg). iOS rounds corners
// itself: the iOS tile is therefore full, without radius.
render('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', { width: 1024, height: 1024, background: BLUE, ratio: 0.7 });

const RES = 'android/app/src/main/res';
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [d, k] of Object.entries(DENSITIES)) {
  // Legacy icon (< Android 8): tile with the design system's 22 % radius, and a round version.
  render(`${RES}/mipmap-${d}/ic_launcher.png`, { width: 48 * k, height: 48 * k, background: BLUE, ratio: 0.7, radius: 0.22 });
  render(`${RES}/mipmap-${d}/ic_launcher_round.png`, { width: 48 * k, height: 48 * k, background: BLUE, ratio: 0.62, round: true });
  // Adaptive icon: transparent 108 dp foreground, mark inside the 66 dp safe zone.
  render(`${RES}/mipmap-${d}/ic_launcher_foreground.png`, { width: 108 * k, height: 108 * k, ratio: 0.46 });
}

// ── Launch screen ───────────────────────────────────────────────────────────
// White mark on primary blue (the design system thumbnail). Dark: ink.
for (const f of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
  render(`ios/App/App/Assets.xcassets/Splash.imageset/${f}`, { width: 2732, height: 2732, background: BLUE, ratio: 0.22 });
}
render('ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-dark.png', { width: 2732, height: 2732, background: INK, ratio: 0.22 });

// Android < 12: full-screen image (Android 12+ uses the system API, see styles.xml).
const SPLASH = {
  'drawable': [480, 320],
  'drawable-port-mdpi': [320, 480], 'drawable-port-hdpi': [480, 800], 'drawable-port-xhdpi': [720, 1280],
  'drawable-port-xxhdpi': [960, 1600], 'drawable-port-xxxhdpi': [1280, 1920],
  'drawable-land-mdpi': [480, 320], 'drawable-land-hdpi': [800, 480], 'drawable-land-xhdpi': [1280, 720],
  'drawable-land-xxhdpi': [1600, 960], 'drawable-land-xxxhdpi': [1920, 1280]
};
for (const [dir, [w, h]] of Object.entries(SPLASH)) {
  render(`${RES}/${dir}/splash.png`, { width: w, height: h, background: BLUE, ratio: 0.3 });
}

rmSync(tmp, { recursive: true, force: true });
