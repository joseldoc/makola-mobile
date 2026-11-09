import { Service } from '@angular/core';

import { ROLES, Role } from '@core/models/auth.model';

const KEY = 'mk.last-space';

/**
 * The last space each account used on this device (A-22, 8 November 2026): a
 * role per account id, nothing else — no sensitive data, hence Web Storage. It
 * outlives the session on purpose: signing out forgets the session, not the
 * space to reopen at the next sign-in. Two accounts on one phone keep their own.
 */
@Service()
export class SpaceMemory {
  /** The space `accountId` last used here; `null` when unknown or no longer a role. */
  recall(accountId: string): Role | null {
    const role = this.read()[accountId];
    return ROLES.includes(role as Role) ? (role as Role) : null;
  }

  remember(accountId: string, role: Role): void {
    const all = this.read();
    if (all[accountId] === role) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...all, [accountId]: role }));
    } catch {
      // Storage unavailable: the next sign-in falls back on the rule's other branches.
    }
  }

  private read(): Record<string, unknown> {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(KEY) ?? '{}');
      return typeof stored === 'object' && stored !== null && !Array.isArray(stored)
        ? (stored as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
}
