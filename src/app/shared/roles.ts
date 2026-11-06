/**
 * Role surfaces of the @makola design system. The role of the screen sets the
 * tint — it is never a graphic choice. Token names (`--mk-role-*`) are kept as
 * published by the design system.
 */
export type SurfaceRole = 'teacher' | 'parent' | 'school' | 'neutral';

/** [surface, shape] — the diluted tint and its darker shape. Surfaces never carry text. */
export const ROLE_TINTS: Record<SurfaceRole, [surface: string, shape: string]> = {
  teacher: ['var(--mk-role-prof)', 'var(--mk-role-prof-forme)'],
  parent: ['var(--mk-role-parent)', 'var(--mk-role-parent-forme)'],
  school: ['var(--mk-role-etab)', 'var(--mk-role-etab-forme)'],
  neutral: ['var(--mk-role-neutre)', 'var(--mk-role-neutre-forme)']
};
