#!/usr/bin/env node
// Génère l'icône d'application et l'écran de lancement natifs (iOS + Android)
// à partir du signe @makola (le livre « m » — Design System, assets/logo-mark*.svg).
//
// Pourquoi Chrome et pas @capacitor/assets : ce dernier dépend de `sharp`, dont le
// script d'installation natif est bloqué par la politique `allow-scripts` de npm
// sur ce poste. Chrome headless rend le SVG au pixel près, sans dépendance.
//
//   node scripts/native-assets.mjs            (CHROME=/chemin/vers/chrome pour surcharger)

import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// Couleurs de base @makola (src/theme/tokens/colors.scss).
const BLEU = '#1B4FD8';
const ENCRE = '#101A2E';
const BLANC = '#FFFFFF';
const AMBRE_DILUE = '#F7E7CE'; // signet sur fond bleu (tone « blanc » du composant Logo)

// Tracé du signe — copié tel quel de components/brand/Logo.jsx.
const TRACE = 'M13.75 75.75V44a18.25 18.25 0 0 1 36.5 0v31.75M50.25 44a18.25 18.25 0 0 1 36.5 0v31.75M10 75.75h80.5';
const SIGNET = 'M45.25 79.5h10v15l-5-4.5-5 4.5z';

/** Le signe, centré, occupant `ratio` du plus petit côté. */
function page({ width, height, fond, ratio, rond = false, rayon = 0 }) {
  const cote = Math.min(width, height);
  const signe = cote * ratio;
  const bg = fond
    ? `<rect width="${width}" height="${height}" fill="${fond}" ${rond ? `rx="${cote / 2}"` : rayon ? `rx="${cote * rayon}"` : ''}/>`
    : '';
  return `<!doctype html><html><head><style>html,body{margin:0;background:transparent}svg{display:block}</style></head><body>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${bg}
  <svg x="${(width - signe) / 2}" y="${(height - signe) / 2}" width="${signe}" height="${signe}" viewBox="0.25 8.25 100 100">
    <path d="${TRACE}" fill="none" stroke="${BLANC}" stroke-width="7.5"/>
    <path d="${SIGNET}" fill="${AMBRE_DILUE}"/>
  </svg>
</svg></body></html>`;
}

const tmp = mkdtempSync(join(tmpdir(), 'makola-assets-'));
let n = 0;

function rendre(dest, spec) {
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
  console.error(`Chrome introuvable : ${CHROME}\nDéfinissez CHROME=/chemin/vers/chrome.`);
  process.exit(1);
}

// ── Icône ───────────────────────────────────────────────────────────────────
// Tuile bleue, signe blanc à 70 % (assets/logo-icon.svg). iOS arrondit lui-même :
// la tuile iOS est donc pleine, sans rayon.
rendre('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', { width: 1024, height: 1024, fond: BLEU, ratio: 0.7 });

const RES = 'android/app/src/main/res';
const DENSITES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [d, k] of Object.entries(DENSITES)) {
  // Icône héritée (< Android 8) : tuile au rayon de 22 % du Design System, et version ronde.
  rendre(`${RES}/mipmap-${d}/ic_launcher.png`, { width: 48 * k, height: 48 * k, fond: BLEU, ratio: 0.7, rayon: 0.22 });
  rendre(`${RES}/mipmap-${d}/ic_launcher_round.png`, { width: 48 * k, height: 48 * k, fond: BLEU, ratio: 0.62, rond: true });
  // Icône adaptative : premier plan transparent de 108 dp, signe dans la zone sûre de 66 dp.
  rendre(`${RES}/mipmap-${d}/ic_launcher_foreground.png`, { width: 108 * k, height: 108 * k, ratio: 0.46 });
}

// ── Écran de lancement ──────────────────────────────────────────────────────
// Signe blanc sur le bleu primaire (la vignette du Design System). Sombre : l'encre.
for (const f of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
  rendre(`ios/App/App/Assets.xcassets/Splash.imageset/${f}`, { width: 2732, height: 2732, fond: BLEU, ratio: 0.22 });
}
rendre('ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-dark.png', { width: 2732, height: 2732, fond: ENCRE, ratio: 0.22 });

// Android < 12 : image plein écran (Android 12+ utilise l'API système, voir styles.xml).
const SPLASH = {
  'drawable': [480, 320],
  'drawable-port-mdpi': [320, 480], 'drawable-port-hdpi': [480, 800], 'drawable-port-xhdpi': [720, 1280],
  'drawable-port-xxhdpi': [960, 1600], 'drawable-port-xxxhdpi': [1280, 1920],
  'drawable-land-mdpi': [480, 320], 'drawable-land-hdpi': [800, 480], 'drawable-land-xhdpi': [1280, 720],
  'drawable-land-xxhdpi': [1600, 960], 'drawable-land-xxxhdpi': [1920, 1280]
};
for (const [dir, [w, h]] of Object.entries(SPLASH)) {
  rendre(`${RES}/${dir}/splash.png`, { width: w, height: h, fond: BLEU, ratio: 0.3 });
}

rmSync(tmp, { recursive: true, force: true });
