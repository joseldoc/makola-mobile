import { TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';

import { SplashScreenService } from './splash-screen.service';

describe('SplashScreenService', () => {
  it('is a no-op on the web: hide() resolves without throwing', async () => {
    expect(Capacitor.isNativePlatform()).toBe(false);
    const service = TestBed.inject(SplashScreenService);

    await expect(service.hide()).resolves.toBeUndefined();
  });
});
