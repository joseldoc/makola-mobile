# Checks that every translation key used in src/app exists in en.json and fr.json.
#   python3 scripts/i18n-check.py
import json, re, pathlib, sys

root = pathlib.Path(__file__).resolve().parent.parent
roots = set(json.load(open(root / 'src/i18n/en.json')).keys())

def flatten(node, prefix=''):
    out = set()
    for k, v in node.items():
        key = f'{prefix}{k}'
        out |= flatten(v, key + '.') if isinstance(v, dict) else {key}
    return out

langs = {l: flatten(json.load(open(root / f'src/i18n/{l}.json'))) for l in ('en', 'fr')}

used = set()
for f in (root / 'src/app').rglob('*'):
    if f.suffix not in ('.ts', '.html'):
        continue
    for m in re.finditer(r"['`]([a-zA-Z]+(?:\.[\w-]+)+)['`]", f.read_text()):
        k = m.group(1)
        if k.split('.')[0] in roots and '${' not in k:
            used.add(k)

# Keys built at runtime: every expansion must exist.
dynamic = set()
for intent in ('sign-up', 'sign-in', 'invitation'):
    for ch in ('phone', 'email'):
        dynamic |= {f'auth.identifier.{intent}.{ch}.{p}' for p in ('step', 'title', 'text')}
    dynamic.add(f'auth.code.step.{intent}')
for c in ('unknown-account', 'existing-account', 'wrong-code', 'unknown-invitation', 'offline', 'invitation-declined', 'unexpected'):
    dynamic.add(f'auth.errors.{c}')
for c in ('CG', 'KE'):
    dynamic.add(f'countries.{c}')
for s in ('identity', 'subjects', 'city'):
    dynamic |= {f'auth.profile.steps.{s}.{p}' for p in ('title', 'subtitle', 'intro')}
for k in ('lastName', 'firstName', 'subjects', 'levels', 'city', 'country'):
    dynamic.add(f'auth.profile.missing.{k}')
for a in ('newGrade', 'gradeBelowPass', 'testAnnounced', 'reportCardAvailable', 'weeklySummary'):
    dynamic |= {f'auth.alerts.options.{a}.label', f'auth.alerts.options.{a}.detail'}
for s in ('classrooms', 'offline', 'parents', 'reportCards'):
    dynamic |= {f'onboarding.slides.{s}.{p}' for p in ('kicker', 'title', 'text')}
for t in ('newGrade', 'gradeBelowPass', 'testAnnounced', 'reportCard'):
    dynamic.add(f'parentFeed.types.{t}')
for s in ('maths', 'physics', 'biology', 'french', 'english', 'history', 'philosophy', 'sport'):
    dynamic.add(f'subjects.{s}')
dynamic |= {'keypad.absent', 'keypad.ungraded'}

problems = 0
for lang, keys in langs.items():
    # A namespace root (e.g. `onboarding.slides.offline`) is completed in code with `.title`…
    namespaces = {k.rsplit('.', i)[0] for k in keys for i in range(1, k.count('.') + 1)}
    for k in sorted((used | dynamic) - keys - namespaces):
        print(f'[{lang}] missing: {k}')
        problems += 1
unused = sorted(langs['en'] - used - dynamic)
for k in unused:
    print(f'unused: {k}')
print(f'{len(used | dynamic)} keys used, {problems} missing, {len(unused)} unused')
sys.exit(1 if problems else 0)
