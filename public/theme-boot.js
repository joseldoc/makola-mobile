// Dark mode before the first paint (9 November 2026). Loaded by index.html, in
// <head>, before the app and its styles: on a phone set to dark, the first frame
// is already dark. ThemeStore (src/app/core/store/theme/theme.store.ts) takes
// over once the app has started; both read the same key and set the same
// attribute (src/app/core/models/appearance.ts, checked by theme-boot.spec.ts).
// Plain ES5, no module: it runs before anything else is loaded.
(function () {
  var saved = null;
  try {
    saved = localStorage.getItem('mk.appearance');
  } catch (e) {
    // Storage unavailable: the phone's setting decides.
  }
  var dark =
    saved === 'dark' ||
    (saved !== 'light' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (dark) document.documentElement.setAttribute('data-mk-theme', 'sombre');
})();
