import {
  DEFAULT_SPACE,
  Identifier,
  ROLES,
  ROLE_STATUSES,
  Role,
  RoleStatus,
  Session,
} from './auth.model';

/** The roles of the account, in `ROLES` order. */
export function heldRoles(session: Session): Role[] {
  return ROLES.filter((role) => session.roles[role] !== undefined);
}

/**
 * The space a sign-in opens (A-22, decided on 8 November 2026). The server knows
 * no active space: the app decides, in this order —
 * 1. the last space this account used on this device, if the account still holds it;
 * 2. else a space whose step 2 is still to do (`ROLES` order);
 * 3. else the teacher space (`DEFAULT_SPACE`), or the only role held.
 */
export function spaceAtSignIn(session: Session, lastUsed: Role | null): Role {
  const held = heldRoles(session);
  if (lastUsed && held.includes(lastUsed)) return lastUsed;
  const pending = held.find((role) => session.roles[role] === 'setup');
  if (pending) return pending;
  return held.includes(DEFAULT_SPACE) ? DEFAULT_SPACE : held[0];
}

/**
 * « NKOUKA Joseph » → « NJ »: the first letter of the first two words, for the
 * account button. Empty without a name — the button then shows an icon.
 */
export function initialsOf(name: string | undefined): string {
  return (name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toLocaleUpperCase())
    .join('');
}

/**
 * `role` takes `status` — added if the account did not hold it. The space shown
 * does not change.
 */
export function withRole(session: Session, role: Role, status: RoleStatus): Session {
  // Adding or updating a role never removes the active one: the result is a
  // Session. TypeScript cannot follow a computed key across the union, hence the cast.
  return { ...session, roles: { ...session.roles, [role]: status } } as Session;
}

/** The same session showing `role`'s space; `null` when the account does not hold it. */
export function showing(session: Session, role: Role): Session | null {
  if (session.roles[role] === undefined) return null;
  // `role` is held: the active role stays one of the account's.
  return { ...session, activeRole: role } as Session;
}

/**
 * A session read from storage, which TypeScript cannot vouch for. The current
 * form is checked — every role known, every status known, the active role held;
 * the single-role form of earlier versions (`{ role, profileComplete }`) is
 * converted: one role, its step 2 done or not, shown. Anything else: `null`.
 */
export function parseSession(value: unknown): Session | null {
  if (!isRecord(value)) return null;
  const { id, identifier, name } = value;
  if (typeof id !== 'string' || !isIdentifier(identifier)) return null;
  const base = {
    id,
    identifier: { channel: identifier.channel, value: identifier.value },
    ...(typeof name === 'string' ? { name } : {}),
  };

  const { roles, activeRole, role, profileComplete } = value;
  if (isRecord(roles)) {
    const known = Object.entries(roles).every(([held, status]) => isRole(held) && isStatus(status));
    if (!known || !isRole(activeRole) || roles[activeRole] === undefined) return null;
    return { ...base, activeRole, roles: { ...roles } } as Session;
  }

  // Before ID-02: a single role, and whether its step 2 was done.
  if (isRole(role) && typeof profileComplete === 'boolean') {
    // The only role is the active one (cast: a computed key, as in `withRole`).
    return {
      ...base,
      activeRole: role,
      roles: { [role]: profileComplete ? 'ready' : 'setup' },
    } as Session;
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIdentifier(value: unknown): value is Identifier {
  return (
    isRecord(value) &&
    (value['channel'] === 'phone' || value['channel'] === 'email') &&
    typeof value['value'] === 'string'
  );
}

function isRole(value: unknown): value is Role {
  return ROLES.includes(value as Role);
}

function isStatus(value: unknown): value is RoleStatus {
  return ROLE_STATUSES.includes(value as RoleStatus);
}
