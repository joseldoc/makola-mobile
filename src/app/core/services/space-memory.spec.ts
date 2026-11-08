import { TestBed } from '@angular/core/testing';

import { SpaceMemory } from './space-memory';

describe('SpaceMemory — the last space used, per account, on this device (A-22)', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const memory = () => TestBed.inject(SpaceMemory);

  it('recalls the space each account last used, and nothing for an account never seen', () => {
    memory().remember('a1', 'parent');
    memory().remember('a2', 'teacher');
    memory().remember('a1', 'teacher');

    expect(memory().recall('a1')).toBe('teacher');
    expect(memory().recall('a2')).toBe('teacher');
    expect(memory().recall('a3')).toBeNull();
  });

  it('ignores what it cannot read: a role the app no longer knows, a damaged entry', () => {
    localStorage.setItem('mk.last-space', JSON.stringify({ a1: 'admin', a2: 'parent' }));
    expect(memory().recall('a1')).toBeNull();
    expect(memory().recall('a2')).toBe('parent');

    localStorage.setItem('mk.last-space', '{not json');
    expect(memory().recall('a2')).toBeNull();
    memory().remember('a2', 'teacher');
    expect(memory().recall('a2')).toBe('teacher');
  });

  it('storage unavailable: nothing is thrown, the sign-in falls back on the rule', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });

    expect(() => memory().remember('a1', 'parent')).not.toThrow();
    expect(memory().recall('a1')).toBeNull();
  });
});
