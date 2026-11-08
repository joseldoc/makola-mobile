import en from '../../../i18n/en.json';
import fr from '../../../i18n/fr.json';

/** Every text of a translation tree, with its key. */
function texts(node: unknown, prefix = ''): [string, string][] {
  if (typeof node === 'string') return [[prefix, node]];
  return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) =>
    texts(v, prefix ? `${prefix}.${k}` : k),
  );
}

/**
 * RM-11 and US-P09 as amended (6 and 7 November 2026): the class average is
 * shown — beside each assignment, on the subject card of the parent feed and on
 * the report card — only the rank stays forbidden. No text may still say otherwise.
 */
const FORBIDDEN = [
  /no class average/i,
  /without (a |the )?class average/i,
  /aucune moyenne de (la )?classe/i,
  /ni moyenne de (la )?classe/i,
  /pas de moyenne de (la )?classe/i,
  /sans moyenne de (la )?classe/i,
];

describe('Interface texts — the class average is no longer denied (RM-11 as amended)', () => {
  for (const [language, tree] of [
    ['en', en],
    ['fr', fr],
  ] as const) {
    it(`no ${language} text denies the class average`, () => {
      const offending = texts(tree)
        .map(([key, text]) => [key, text.replace(/ /g, ' ')] as const)
        .filter(([, text]) => FORBIDDEN.some((pattern) => pattern.test(text)))
        .map(([key]) => key);
      expect(offending).toEqual([]);
    });
  }
});
