 # Project guidelines
 As an Angular architect build angular and ionic 
## Stack 
 - Angular
 - Ionic
 - Capacitor
 - Typescript
 - RxJS
 - Angular Signals
 - Signal Store

## Architecture
- ionic 9
- Capacitor 9
- Angular 22, standalone components only (no NgModules), built on the Angular CLI `application` builder.
- Use standalone components
- always us Strategy OnPush
- use container component and dumb or presentation components.
### Path aliases

`tsconfig.json` defines `@core/*` → `src/app/core/*`. (`@shared/*` and `@modules/*` are also declared but point at directories that don't exist — everything currently lives under `@core/shared/*`; 
don't use those two aliases.) Feature code under `src/app/features/*` is imported by relative path, not by alias.

### Feature module structure

Each feature under `src/app/features/<name>/` follows the same shape:

- `<name>-routes.ts` — exports a `Routes`/`Route[]` constant (e.g. `AUTH_ROUTES`, `USERS_ROUTES`, `LEVEL_VOLTAGES`) using `loadComponent`/`loadChildren` for lazy loading, wired into `app.routes.ts`.
- `index.ts` barrel files at the feature root and at `pages/` — components are imported via `import('./pages').then(m => m.XComponent)`, not by direct file path.
- `pages/`, `components/`, `model/` (interfaces), `enums/` as needed.

`core/shared/components/` follows the same barrel (`index.ts`) convention per component group (`buttons/`, `forms/`, `inputs/`, `modal/`). Prefer re-exporting new shared components through the relevant group's `index.ts`.

### State: NgRx Signals stores

Global/cross-cutting state uses `@ngrx/signals` `signalStore`, not services with BehaviorSubjects. Existing stores:

- `LoaderStore` (`core/store/loaders/`) — tracks a global loading flag, driven by `withHooks(onInit)` subscribing to `Router` events (`NavigationStart`/`NavigationEnd`) via `rxMethod`. Exposes `isLoadingBarProgress` / `isLoadingButton` as `withComputed` signals for the top progress bar vs. button spinners.
- `NavigationStore` (`core/layouts/layout/store/`) — tracks which sidebar nav item is active, refreshed via `withHooks(onInit)` off `router.url`.

Both are `{ providedIn: 'root' }`. Follow this `withState` / `withComputed` / `withMethods` / `withHooks` pattern (state → derived signals → mutating methods via `patchState` → router-driven side effects) for new global stores instead of introducing services with manual subjects.

## Manage features
```
features/
├── feature-page.ts           # feature container (all logic and call to store must be here)
├── /components  # all dumbs components (presentation components, no logic on this components)
├── feature.route.ts        # App bootstrap
└── feature.store.ts    # Global styles
└── model.ts    # all model feature
```
## Capacitor
Capacitor should only be used for native functionality.
Do not use Capacitor APIs when a standard browser/Web API is sufficient.

### Forms
Using signal forms

### Language of the code
All code is written in English: file and folder names, classes, variables,
routes, CSS classes and comments. Two exceptions:
- the `--mk-*` design tokens in `src/theme/tokens/` keep the names published by
  the @makola design system (they are copied verbatim from it);
- school data (student names, class labels such as "4ème B", school names)
  stays as entered — it is data, not interface.

### Translations (i18n)
- Transloco (`@jsverse/transloco`), languages `en` (default) and `fr`.
- Never hard-code user-facing text: templates use the `transloco` pipe, text
  built in TypeScript uses `injectTranslate()` from `@core/i18n` inside a
  `computed()` so it follows language changes.
- Translation files `src/i18n/en.json` and `src/i18n/fr.json` are generated:
  edit `scripts/i18n-source.py` (one entry per key, English and French side by
  side), then run `python3 scripts/i18n-source.py && python3 scripts/i18n-check.py`.
  The check fails on any key used in code but missing from a language.
- Numbers and dates go through `formatDecimal()` / `formatDate()` from
  `@core/i18n` (12.4 in English, 12,4 in French).
- The language is held by `LanguageStore` (`core/store/language/`) and switched
  with the `app-language-switch` component.
