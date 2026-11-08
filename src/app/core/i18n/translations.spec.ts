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

/**
 * Voice and typography of the interface (text review of 7 November 2026): simple
 * checks that give no false positives on the current texts — not a style guide.
 * The rules themselves are written at the top of `scripts/i18n-source.py`.
 */
describe('Interface texts — voice and typography', () => {
  const CHECKS: { name: string; languages: ('en' | 'fr')[]; pattern: RegExp }[] = [
    // The product has no mood: no exclamation mark, anywhere.
    { name: 'no exclamation mark', languages: ['en', 'fr'], pattern: /!/ },
    // « vous », never « tu » nor « nous » — and in English, never "we".
    {
      name: 'no « tu » nor « nous »',
      languages: ['fr'],
      pattern: /(^|[^\p{L}])(tu|toi|ton|ta|tes|te|nous|notre|nos)(?!\p{L})/iu,
    },
    { name: 'no "we"', languages: ['en'], pattern: /(^|[^\p{L}])(we|our|us)(?!\p{L})/iu },
    // The phrases the design system forbids, in both languages.
    {
      name: 'no forbidden phrase',
      languages: ['en', 'fr'],
      pattern:
        /champ invalide|aucun résultat|bien noté|oups|invalid field|no results?\b|oops|well done/i,
    },
    // French: a non-breaking space before : ; ? ! and inside « » (fr_typography).
    {
      name: 'no ordinary space before : ; ? ! or inside « »',
      languages: ['fr'],
      pattern: / [:;?!»]|« /,
    },
    // English: no space before punctuation, no French guillemets.
    { name: 'no space before : ; ?', languages: ['en'], pattern: / [:;?]/ },
    { name: 'no guillemets', languages: ['en'], pattern: /[«»]/ },
    // One apostrophe, the straight one, as in the design system and typed data.
    { name: 'no curly apostrophe', languages: ['en', 'fr'], pattern: /’/ },
    // No Unicode glyph standing for an icon, no emoji (design system, iconography).
    {
      name: 'no arrow, symbol or emoji',
      languages: ['en', 'fr'],
      pattern: /[↑↓→←▲▼✓✔★]|\p{Extended_Pictographic}/u,
    },
    // Glossary: « professeur », never « enseignant ».
    {
      name: 'no « enseignant »',
      languages: ['fr'],
      pattern: /(^|[^\p{L}])enseignante?s?(?!\p{L})/iu,
    },
    {
      name: 'no double, leading or trailing space',
      languages: ['en', 'fr'],
      pattern: / {2}|^\s|\s$/,
    },
  ];
  const trees = { en, fr };

  for (const check of CHECKS) {
    for (const language of check.languages) {
      it(`${language}: ${check.name}`, () => {
        const offending = texts(trees[language])
          .filter(([, text]) => check.pattern.test(text))
          .map(([key]) => key);
        expect(offending).toEqual([]);
      });
    }
  }
});
