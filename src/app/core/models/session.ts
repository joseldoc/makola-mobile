import { Identifier, ROLES, ROLE_STATUSES, Role, RoleStatus, Session } from './auth.model';

/** The roles of the account, in `ROLES` order. */
export function heldRoles(session: Session): Role[] {
  return ROLES.filter((role) => session.roles[role] !== undefined);
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
