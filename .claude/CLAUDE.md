# CLAUDE.md
Guidance for Claude Code (and anyone else) working in this repository — a generic **Angular + Ionic + Capacitor** mobile/hybrid app, built from scratch on **Angular 22** (current stable; Angular 21 is the minimum acceptable baseline if 22 isn't available in your toolchain yet) with **Ionic Framework 8+** and **Capacitor 7+**.

> This document is domain-agnostic on purpose: it says how code in this project should be structured and written, not what the app does. Treat every concrete name below (`feature`, `item`, `FeatureStore`, `/feature/items`, …) as a placeholder for whatever the real feature/domain is called — copy the *shape*, rename everything.
> 
> **State management note**: use **`@ngrx/signals` (`signalStore`)** for shared/cross-component domain state, and the built-in **`resource`/`httpResource`** APIs (stable since v22) for simple, store-less data fetching. Do **not** use classic `@ngrx/store`/`@ngrx/effects` (actions/reducers/effects/selectors) — that pattern predates signals and adds boilerplate this stack doesn't need.

## @makola — what this generic guide leaves out

This repository is `makola-mobile`, the mobile app of @makola (a teacher's grade book, with a read-only feed for parents; Republic of the Congo and Kenya). Everything specific to @makola — product rules (no rank, absent ≠ zero, offline never blocks…), the @makola design system, the contract with the backend services, and the known gaps between this guide and the code — lives in the brief of the **`angular-mobile-expert`** agent (`.claude/agents/angular-mobile-expert.md`), written in French like the rest of the project's documentation.

- **All front-end work goes through the `angular-mobile-expert` agent.** The effort level is chosen at each delegation according to the real complexity of the task (mechanical → low/medium; a full screen, a multi-screen flow, a real HTTP adapter or a native wrapper → high; offline replay, session/tokens, multi-role accounts, Kenyan parental consents, a reorganisation of the tree or an open arbitration → xhigh/max); details in the agent's brief.
- **Every change reaches `main` through a pull request** — never a direct push, not even for a one-line fix. Until a CI exists, `npm run build` and `npm test` must pass before the PR is opened.
- Design reference: `docs/design-system.md` (copy of the claude.ai/design project "@makola Design System"; export in the `joseldoc/makola-design` repository).

## Target stack

- **Angular 22** (Node.js **≥ 22.12** required; TypeScript 6)
- **Ionic Framework 8+** — standalone Ionic components (`IonHeader`, `IonContent`, `IonButton`, …), imported directly per-component, never through an `IonicModule` barrel import.
- **Capacitor 7+** for native platform access (camera, storage, geolocation, push, …) and for building/running the iOS and Android native shells.
- **Standalone everywhere** — no `NgModule`s. Bootstrap via `bootstrapApplication` + `provideIonicAngular()`, not `platformBrowserDynamic().bootstrapModule(AppModule)`.
- **Zoneless by default** — no `zone.js` dependency; `provideZonelessChangeDetection()` in the app config. (Verify your installed Ionic version has finished its own zoneless migration before flipping this on for a brand-new app — check the Ionic changelog/Angular MCP server rather than assuming.)
- **Signals-first reactivity** — `signal()`, `computed()`, `linkedSignal()`, signal `input()`/`output()`/`model()`, the new control-flow syntax (`@if`/`@for`/`@switch`), and `resource()`/`httpResource()` for async data.
- **`@ngrx/signals` `signalStore`** for feature/domain state — no actions/reducers/effects boilerplate.
- **Signal Forms** (stable since v22) instead of `ReactiveFormsModule`/`FormsModule` for every form in the app. Neither module is ever imported in this project.
- **Angular Aria** for accessible headless primitives where Ionic's own components don't already cover the need; Ionic components already ship with reasonable accessibility defaults, so reach for Aria primitives for anything bespoke (a custom picker, a non-Ionic overlay) rather than hand-rolling `role`/`aria-*`/keydown handling.
- **Functional router guards/interceptors**, `provideRouter(routes, withComponentInputBinding())`.
- **`loadComponent` for every lazy route, never `loadChildren`.** See "Routing" below.
- **Vitest** as the default unit/component test runner (`ng test`).
- **Playwright** for web e2e tests; for on-device/emulator e2e, see "Testing" below (Capacitor changes what "e2e" can mean).
- **esbuild/Vite-based application builder** (`@angular/build`) — not the deprecated Webpack-based `@angular-devkit/build-angular` builders.
- **Event-oriented dumb/smart architecture**: presentational ("dumb") components emit a single typed event tied to an enum member defined in that feature's `enums/` folder; routed ("smart") components listen to that event and `switch`/`case` on the enum to decide what to do. See "Event-oriented component architecture" below.

## Commands

```bash
npm install                 # install dependencies (Node >= 22.12)
npm start                     # ng serve — dev server at http://localhost:4200 (fastest loop for UI work)
npm run build                   # ng build --configuration production
npm test                          # ng test (Vitest) — unit/component tests
npx playwright test                # Playwright — web e2e tests (run `npx playwright install` once)
npx playwright test --ui              # Playwright's interactive UI mode
 
npx cap sync                            # copy the web build + sync native plugin config into ios/ and android/
npx cap run ios                           # build, sync and launch on an iOS simulator/device
npx cap run android                         # build, sync and launch on an Android emulator/device
npx cap open ios / android                    # open the native project in Xcode / Android Studio directly
```

## Architecture
Feature-oriented; every "module" is a folder of **standalone** components/services/stores — no `*.module.ts`, no `declarations`, no `StoreModule.forFeature`:
```
e2e/                              # Playwright specs — one file per user flow
playwright.config.ts
ios/ android/                       # Capacitor native shells — generated, don't hand-edit except native config
capacitor.config.ts                   # Capacitor app id/name, plugin config, server config per environment
src/app/
├── app.config.ts                  # bootstrapApplication's ApplicationConfig — provideIonicAngular() lives here
├── app.routes.ts                    # top-level Routes; every leaf route uses loadComponent (no loadChildren)
├── app.component.ts                   # standalone root component, hosts <ion-router-outlet>
├── <feature>/                           # one such folder per domain/feature (rename freely)
│   ├── components/                        # presentational, standalone, signal inputs/outputs, Ionic UI
│   ├── pages/                               # routed standalone components, inject the feature's signalStore
│   ├── <feature>.routes.ts                    # plain Route[] for this feature; each entry uses loadComponent
│   ├── enums/                                   # the event vocabulary: one enum per family of dumb-component events
│   ├── models/
│   ├── services/                                  # HttpClient wrappers, or Capacitor-plugin wrappers
│   └── state/
│       └── <feature>.store.ts                       # signalStore — the feature's single source of truth
├── core/
│   ├── guards/                                        # functional CanActivateFn
│   ├── interceptors/                                    # functional HttpInterceptorFn
│   └── services/                                          # app-wide singletons, incl. a thin Capacitor-platform wrapper
├── shared/                                                  # cross-feature presentational components (nav bars, tab bar, empty states)
└── (no src/app/state/app.state.ts)                            # signalStore doesn't need a composed root state
```

Key conventions:

- **No NgModules anywhere.** Every component is standalone by default and lists what it needs in its own `imports: [...]` — including individual Ionic components (`IonHeader`, `IonContent`, `IonButton`, `IonList`, …), never an `IonicModule` barrel import.
- **Pages vs. components**: `pages/**` are routed, `inject()` the feature's `signalStore`, and own the initial data load; `components/**` stay presentational, using signal `input()`/`output()` (or `model()` for two-way bindings).
- **Routing**: lazy-load **every** routed page individually with `loadComponent`; `*.routes.ts` files stay small, synchronously-imported `Route[]` arrays. See "Routing" below for the full pattern, including Ionic tabs.
- **Guards & interceptors are functions**, not classes.
- **One `signalStore` per feature**, built from `withState`, `withComputed`, `withMethods`, `withEntities`. See "signalStore reference shape" below.
- **Prefer `resource()`/`httpResource()`** for simple reads that don't need shared, mutable, cross-component state; reach for a `signalStore` when data is shared across routes, needs optimistic updates, or has non-trivial derived state.
- **Event-oriented dumb/smart split**: a dumb component's output carries an enum action (from `enums/`), not a pile of one-off `@Output()`s per operation; the owning smart (page) component listens to that single event and `switch`es on the enum. See "Event-oriented component architecture" below.
- **Default to dumb.** A new component is presentational until proven otherwise: no `inject()` of a store/service/router, only `input()`s in and enum-tagged `output()`s out. Only a routed `pages/**` component gets to be "smart."
- **Capacitor access stays behind a service.** Nothing outside `core/services`/`<feature>/services` calls a `@capacitor/*` plugin directly — components and stores depend on a thin wrapper service (e.g. `CameraService`, `StorageService`) so platform-availability checks, web fallbacks, and permission handling live in one place per capability. See "Capacitor platform access" below.
- **Config**: never hardcode an API base URL in a service. Keep a single source of truth (an `InjectionToken` provided per `ng build` configuration, or environment files) for `apiURL`, and a separate one for `capacitor.config.ts`'s per-environment `server.url` if you use live-reload against a remote dev server on-device.
## `signalStore` + `resource`/`httpResource` reference shape

```ts
// <feature>/state/<feature>.store.ts
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { withEntities, setAllEntities, addEntity, removeEntity } from '@ngrx/signals/entities';
import { computed, inject } from '@angular/core';
import { pipe, switchMap, tap, exhaustMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { Router } from '@angular/router';
import { ItemService } from '../services/item.service';
import { Item } from '../models/item.interface';
 
type FeatureStoreState = { loading: boolean; error: string | null };
 
export const FeatureStore = signalStore(
  { providedIn: 'root' },
  withState<FeatureStoreState>({ loading: false, error: null }),
  withEntities<Item>(),
  withComputed(({ entities }) => ({
    itemCount: computed(() => entities().length),
  })),
  withMethods((store, itemService = inject(ItemService), router = inject(Router)) => ({
    loadAll: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() =>
          itemService.getAll().pipe(
            tapResponse({
              next: (items) => patchState(store, setAllEntities(items), { loading: false }),
              error: (err: Error) => patchState(store, { error: err.message, loading: false }),
            }),
          ),
        ),
      ),
    ),
    add: rxMethod<Item>(
      pipe(
        exhaustMap((item) =>
          itemService.add(item).pipe(
            tapResponse({
              next: (created) => {
                patchState(store, addEntity(created));
                router.navigate(['items']);
              },
              error: (err: Error) => patchState(store, { error: err.message }),
            }),
          ),
        ),
      ),
    ),
    remove: rxMethod<string>(
      pipe(
        exhaustMap((id) =>
          itemService.delete(id).pipe(
            tapResponse({
              next: () => patchState(store, removeEntity(id)),
              error: (err: Error) => patchState(store, { error: err.message }),
            }),
          ),
        ),
      ),
    ),
  })),
);
```

For a **read-only, page-local** lookup, prefer `httpResource` over adding another store method:

```ts
// <feature>/pages/detail/detail.component.ts (excerpt)
import { httpResource } from '@angular/common/http';
 
const id = input<string | undefined>();
const itemResource = httpResource<Item>(() => (id() ? `${apiURL}/items/${id()}` : undefined));
// itemResource.value(), itemResource.isLoading(), itemResource.error() are all signals
```

## Routing — `loadComponent`, not `loadChildren`, incl. Ionic tabs

```ts
// <feature>/<feature>.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from '../core/guards/auth.guard';
 
export const FEATURE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/list/list.component').then((m) => m.ListComponent),
    canActivate: [authGuard],
  },
  {
    path: 'detail/:id',
    loadComponent: () => import('./pages/detail/detail.component').then((m) => m.DetailComponent),
    canActivate: [authGuard],
  },
];
```

```ts
// app.routes.ts
import { Routes } from '@angular/router';
import { FEATURE_ROUTES } from './feature/feature.routes';
// Importing the *.routes.ts file itself is a normal, synchronous import — it's just an array of
// Route objects, no component code. The lazy chunks come entirely from each entry's loadComponent.
 
export const routes: Routes = [
  { path: 'feature', children: FEATURE_ROUTES },
  {
    path: 'login',
    loadComponent: () => import('./auth/pages/login/login.component').then((m) => m.LoginComponent),
  },
  { path: '', redirectTo: 'feature', pathMatch: 'full' },
];
```

If the app uses Ionic's tab bar, each tab's own routes still follow the same rule — the tabs shell component is the only "grouping" piece, and every page under each tab is `loadComponent`:

```ts
// tabs/tabs.routes.ts
import { Routes } from '@angular/router';
 
export const TABS_ROUTES: Routes = [
  {
    path: 'tabs',
    loadComponent: () => import('./tabs.component').then((m) => m.TabsComponent),
    children: [
      { path: 'home', loadComponent: () => import('../home/pages/home.component').then((m) => m.HomeComponent) },
      { path: 'feature', children: FEATURE_ROUTES },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
];
```

```html
<!-- tabs/tabs.component.html -->
<ion-tabs>
  <ion-tab-bar slot="bottom">
    <ion-tab-button tab="home"><ion-icon name="home" /><ion-label>Home</ion-label></ion-tab-button>
    <ion-tab-button tab="feature"><ion-icon name="list" /><ion-label>Items</ion-label></ion-tab-button>
  </ion-tab-bar>
</ion-tabs>
```

Prefer Angular's `Router`/`routerLink` for all navigation (as above), including from Ionic components — `IonTabButton`'s `tab` attribute and Ionic's `NavController` are convenience wrappers around the same router; don't mix in raw `NavController.navigateForward(...)` calls for routes that already have a router path, so there's one source of truth for "where can this app go."

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


## Event-oriented component architecture

A dumb component emits **one** event shaped around an enum from that feature's `enums/` folder; the owning smart (page) component `switch`es on it. Never emit a separate `@Output()`/`output()` per action, and never invent ad-hoc string/boolean flags for a new action — add a member to the enum instead.

```ts
// <feature>/enums/item-row-actions.enum.ts
export enum ItemRowActions {
  View = 'VIEW',
  Delete = 'DELETE',
}
```

```ts
// <feature>/components/item-list/item-list.component.ts — DUMB: no store, no router, no service
import { Component, input, output } from '@angular/core';
import { IonList, IonItem, IonLabel, IonItemSliding, IonItemOptions, IonItemOption } from '@ionic/angular/standalone';
import { Item } from '../../models/item.interface';
import { ItemRowActions } from '../../enums/item-row-actions.enum';
 
@Component({
  selector: 'app-item-list',
  imports: [IonList, IonItem, IonLabel, IonItemSliding, IonItemOptions, IonItemOption],
  templateUrl: './item-list.component.html',
})
export class ItemListComponent {
  items = input.required<ReadonlyArray<Item>>();
  // a single output carrying the enum action + the row it applies to — not one output per action
  rowAction = output<{ item: Item; action: ItemRowActions }>();
  protected readonly ItemRowActions = ItemRowActions;
}
```

```html
<!-- <feature>/components/item-list/item-list.component.html -->
<ion-list>
  @for (item of items(); track item.id) {
    <ion-item-sliding>
      <ion-item (click)="rowAction.emit({ item, action: ItemRowActions.View })">
        <ion-label>{{ item.name }}</ion-label>
      </ion-item>
      <ion-item-options side="end">
        <ion-item-option color="danger" (click)="rowAction.emit({ item, action: ItemRowActions.Delete })">
          Delete
        </ion-item-option>
      </ion-item-options>
    </ion-item-sliding>
  } @empty {
    <ion-item><ion-label>Nothing here yet.</ion-label></ion-item>
  }
</ion-list>
```

```ts
// <feature>/pages/list/list.component.ts — SMART: injects the store/router, switches on the enum event
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { FeatureStore } from '../../state/feature.store';
import { ItemListComponent } from '../../components/item-list/item-list.component';
import { ItemRowActions } from '../../enums/item-row-actions.enum';
import { Item } from '../../models/item.interface';
 
@Component({
  selector: 'app-list',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, ItemListComponent],
  templateUrl: './list.component.html',
})
export class ListComponent {
  private readonly store = inject(FeatureStore);
  private readonly router = inject(Router);
 
  items = this.store.entities;
  loading = this.store.loading;
 
  constructor() {
    this.store.loadAll();
  }
 
  onRowAction({ item, action }: { item: Item; action: ItemRowActions }) {
    switch (action) {
      case ItemRowActions.View:
        this.router.navigate(['feature', 'detail', item.id]);
        return;
      case ItemRowActions.Delete:
        this.store.remove(item.id);
        return;
    }
  }
}
```

This generalizes to every dumb component with more than one kind of action: add an enum in that feature's `enums/` folder, emit one output typed against it, and let the owning smart component's `switch` be the only place that decides what actually happens.

## Capacitor platform access

```ts
// core/services/haptics.service.ts — thin wrapper: this is the ONLY place that imports @capacitor/haptics
import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
 
@Injectable({ providedIn: 'root' })
export class HapticsService {
  async impact(style: ImpactStyle = ImpactStyle.Light): Promise<void> {
    if (!Capacitor.isNativePlatform()) return; // no-op on web preview — don't let ng serve crash
    await Haptics.impact({ style });
  }
}
```

- **Every native capability (camera, filesystem, geolocation, push notifications, haptics, native storage, …) gets its own thin service** in `core/services` (app-wide) or `<feature>/services` (feature-specific), and nothing else imports that `@capacitor/*` package directly.
- **Always guard with `Capacitor.isNativePlatform()`** (or the plugin's own `isAvailable()`/capability check where one exists) before calling into a plugin, with a sane no-op or web fallback — `ng serve` and Playwright's web e2e both run in a browser context where most native plugins are unavailable or behave differently.
- **Request permissions explicitly and lazily** (at the point of use, not at app startup) via each plugin's own permission API, and surface a denied/restricted state back through the wrapper service rather than letting a raw plugin exception bubble into a component.
- **Prefer Capacitor's own plugins over a general web library** for anything that has a first-party plugin (storage, filesystem, network status) — they're the ones kept in sync with Capacitor's lifecycle and platform channels.

## Best practices to follow in this codebase

### Angular 21/22 fundamentals
1. **Standalone only.** No `NgModule` should ever be added.
2. **Zoneless.** Don't reintroduce `zone.js`. Because change detection isn't triggered implicitly by every async callback, every state mutation must flow through a `signal`/`patchState`/`model()` — a plain field assignment or a subscription that doesn't write to a signal will silently not update the view. This matters doubly for Capacitor plugin callbacks (e.g. a push-notification listener) — route their results through a signal or store method, never a bare instance field.
3. **OnPush is the default now** — make sure component inputs are signals or genuinely immutable.
4. **Signal inputs/outputs/model**, not decorators: `input()`, `input.required()`, `output()`, `model()`.
5. **New control flow** (`@if`, `@for ... track`, `@switch`, `@let`, `@defer`) everywhere — no `*ngIf`/`*ngFor`/`*ngSwitch`. Always provide a `track` expression on `@for`.
6. **`@defer` for anything heavy and below-the-fold or off-screen** — especially valuable on mobile, where deferring a rarely-used settings panel or a chart library keeps the initial bundle (and therefore app-start time on real devices) small.
7. **`inject()` over constructor-parameter DI** everywhere, including inside `withMethods` factory functions.
8. **`@Service` over `@Injectable({ providedIn: 'root' })`** for ordinary root-provided services going forward; keep `@Injectable` where you need constructor-parameter injection or non-root-level configuration.
9. **`injectAsync`** for anything heavy and rarely used, to keep it out of the main/initial bundle.
10. **Router**: adopt `withComponentInputBinding()` so route params bind straight to signal inputs instead of `ActivatedRoute` subscriptions.
11. **Always `loadComponent`, never `loadChildren`.**

### Ionic & Capacitor
1. **Import Ionic components individually from `@ionic/angular/standalone`**, never via `IonicModule` — this keeps bundles small and matches the standalone-everywhere rule above.
2. **Use Ionic's layout/navigation components as intended**: `ion-router-outlet` as the single routing host, `ion-tabs`/`ion-tab-bar` for tab navigation (routed per "Routing" above), `ion-nav`/modals/overlays through Ionic's `IonModal`/`IonPopover`/`ModalController`-equivalent standalone APIs rather than hand-built overlay components.
3. **Platform styling**: let Ionic's `mode` (`ios`/`md`) auto-detection drive platform-appropriate look and feel; don't fork templates per-platform unless a specific interaction genuinely differs.
4. **Safe areas**: use Ionic's CSS variables (`--ion-safe-area-top`, etc.) / the `env(safe-area-inset-*)` utilities Ionic exposes, rather than hardcoding paddings, so the app respects notches/home indicators on real devices.
5. **Keep `capacitor.config.ts` environment-aware** (dev server URL for live reload vs. the bundled build for release) and never ship a dev `server.url` in a release build.
6. **One wrapper service per native capability**, as in "Capacitor platform access" above — no direct `@capacitor/*` imports from components, stores, or pages.
7. **Test on real devices/simulators regularly**, not just in the browser preview — plugin behavior, safe areas, keyboard resizing, and performance all differ from `ng serve`.

### Event-oriented dumb/smart component architecture
1. **One enum per family of UI actions, in that feature's `enums/` folder.** This enum is the contract between a dumb component and whoever listens to it.
2. **A dumb component emits one `output()` carrying the enum** (plus whatever payload the action needs), never a separate output per possible action.
3. **The smart (page) component is the only place that `switch`es on the enum** and decides what actually happens (store call, navigation, native-plugin call via a wrapper service, …). A dumb component never imports a store, a service, or the router.
4. **"Rendre dumb quand il le faut" — default every new component to presentational.** Only `inject()` a store/service/router in a `pages/**` smart component. If a "dumb" component starts needing that kind of injection just to decide *what* to do, that's the signal either it belongs in `pages/**`, or the decision logic should move up into the smart parent's `switch`.
5. **Independent families of actions get independent components and enums** (e.g. list-row actions vs. toolbar actions) rather than one component with a combined enum.

### `@ngrx/signals` SignalStore
1. **One store per bounded feature**, mirroring the folder structure.
2. **`withEntities`** for collections; **`withComputed`** for everything derived; never recompute derived data in a component or template.
3. **All async work through `withMethods` + `rxMethod` + `tapResponse`**, never a bare `.subscribe()` in a method body.
4. **`exhaustMap` for mutating calls** (add/update/delete); **`switchMap`** for list/read reloads that should cancel a stale in-flight request.
5. **Only expose named methods and read signals** from a store's public surface — never export `patchState` itself for components to call directly.
6. **Surface errors as store state** (an `error` signal written from `tapResponse`'s `error` callback) instead of silently dropping failures.
7. **Use `resource()`/`httpResource()` instead of a store** for page-local, non-shared reads — don't force everything into a `signalStore`.

### Forms
1. **Signal Forms for every form in this app, with no exceptions.**
2. **Never import `FormsModule` or `ReactiveFormsModule`.** Validation goes through a schema (`required`, `minLength`, custom validators) passed to `form()`; template binding is `[formField]="someForm.someField"` (the `FormField` directive from `@angular/forms/signals` — the earlier `[field]` name does not exist in Angular 22.1); custom form controls implement the Signal Forms field contract instead of `ControlValueAccessor`. Where a field is rendered with an Ionic input (`ion-input`, `ion-select`, `ion-checkbox`, …), bind it through `[formField]` the same way — Ionic's form components support the standard control-value-accessor-compatible binding surface Signal Forms targets.
3. Treat Signal Forms as **stable but still evolving in edge cases** — check the Angular MCP server's `get_best_practices`/`search_documentation` tools before relying on a specific validator or API shape from training data.

### Accessibility
1. **Angular Aria** for any bespoke headless/custom interactive widget that doesn't already have a well-behaved Ionic equivalent.
2. **Prefer Ionic's own components** for standard patterns (lists, action sheets, alerts, modals, tabs) — they ship with reasonable ARIA/keyboard/touch-target behavior out of the box; don't rebuild them from primitives.
3. Keep `RouterLinkActive`'s built-in `aria-current` handling for any router-driven nav you build outside Ionic's own tab/segment components.

### Security
1. **Never commit real secrets/tokens.** API base URLs stay non-secret; backend credentials and signing secrets stay server-side.
2. **Prefer Capacitor's secure/native storage plugin over `localStorage`** for anything sensitive (auth tokens, refresh tokens) on native platforms — `localStorage` is still XSS-exposed and, on native, offers no real advantage over a dedicated secure-storage plugin; fall back to `localStorage` only for the web-preview build and keep that fallback behind the same wrapper service.
3. **Interceptor scoping.** Keep the auth header interceptor's URL matching explicit and deliberate — extend it consciously when adding calls to a new backend, rather than special-casing auth headers per call site.
4. **Validate deep links / custom URL schemes** (if used) before acting on them — treat their contents as untrusted input, same as any other external data.

### Testing — Vitest (unit/component) + Playwright (web e2e) + on-device checks
1. **Vitest** (`ng test`) is the default runner for unit and component tests.
2. **Test stores as isolated units**: provide a mocked service via `TestBed`, call a store method, assert on the resulting signals.
3. **Test dumb components by their emitted events, not by effects** — set inputs, trigger the interaction, assert the emitted `{ item, action }` payload; it should know nothing about the store, router, or any Capacitor plugin. Test the smart component's `switch`/`case` separately with mocked dependencies.
4. **Mock Capacitor plugins in unit/component tests** — don't let a Vitest run depend on a real native layer; stub the wrapper service (per "Capacitor platform access" above) rather than mocking the raw plugin at the component level.
5. **Playwright owns end-to-end flows in the web build** (login → browse → create → edit → delete, guard redirects, …). Specs live in `e2e/`, one file per user flow.
6. **Selectors**: prefer Playwright's role/label/text-based locators over CSS selectors for resilience; add `data-testid` only where a reliable accessible role/label isn't available.
7. **`playwright.config.ts`** should run against a served app via its `webServer` option, with a real or seeded/mocked backend documented as a prerequisite.
8. **Native-only behavior (camera, push, haptics, biometrics, …) isn't covered by Playwright** — verify it manually on a simulator/device per release, or, for critical flows, with a native-level e2e tool (e.g. Appium/XCUITest/Espresso) if the project's size justifies the investment; don't try to fake these through the web e2e suite.

### Build & tooling
1. **Use the esbuild/Vite application builder**; don't add Webpack-based builders.
2. **Lean on the Angular CLI's MCP server** when using an AI coding assistant on this repo: `get_best_practices`, `search_documentation`, and `find_examples` keep generated code aligned with current APIs — especially relevant for Signal Forms and Angular Aria. The `onpush_zoneless_migration` tool is the recommended way to plan any remaining zoneless migration work.
3. **TypeScript 6** — keep `tsconfig` strict-mode settings.
4. **Run `npx cap sync` after every dependency change that touches a native plugin**, and after every `npm run build` before testing on-device — a stale native shell is a common source of "it works on web but not on device" bugs.

### General hygiene
- `dist/`, `ios/App/Pods`, `android/.gradle`, and other native build artifacts are generated — never hand-edit them; regenerate via the commands above.
- Match naming: `kebab-case` file names, `app-` prefixed selectors, `XComponent`/`XService`/`XStore` suffixes.
- Prioritize clarity and consistency with the conventions above over introducing yet another pattern. Don't reintroduce `@ngrx/store`/`@ngrx/effects`, `NgModule`, `zone.js`, `IonicModule`, or direct `@capacitor/*` imports outside a wrapper service.
