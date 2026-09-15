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
- `pages/`, `components/`, `modele/` (interfaces), `enums/` as needed.

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
