import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { SplashScreenService } from '@core/services/splash-screen.service';

import { LaunchStore } from './launch.store';

describe('LaunchStore', () => {
  it('hides the launch screen at the end of the first navigation, through SplashScreenService', async () => {
    const hide = vi.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: SplashScreenService, useValue: { hide } }],
    });
    const store = TestBed.inject(LaunchStore);
    expect(store.ready()).toBe(false);

    await TestBed.inject(Router).navigateByUrl('/');

    expect(store.ready()).toBe(true);
    expect(hide).toHaveBeenCalledTimes(1);
  });
});
