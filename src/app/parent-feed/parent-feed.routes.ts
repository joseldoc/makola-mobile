import { Routes } from '@angular/router';

export const PARENT_FEED_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/parent-feed-page/parent-feed-page').then((m) => m.ParentFeedPageComponent),
  },
];
