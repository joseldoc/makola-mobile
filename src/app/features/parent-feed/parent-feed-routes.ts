import { Routes } from '@angular/router';

export const PARENT_FEED_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages').then((m) => m.ParentFeedPageComponent)
  }
];
