import { TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';

import { StatusBarService } from './status-bar.service';

describe('StatusBarService', () => {
  it('is a no-op on the web: setTheme() resolves without throwing', async () => {
    expect(Capacitor.isNativePlatform()).toBe(false);
    const service = TestBed.inject(StatusBarService);

    await expect(service.setTheme('dark')).resolves.toBeUndefined();
    await expect(service.setTheme('light')).resolves.toBeUndefined();
  });
});
