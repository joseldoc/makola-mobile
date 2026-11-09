import { TestBed } from '@angular/core/testing';

import { provideI18n } from '@core/i18n';
import { LanguageStore } from '@core/store/language/language.store';
import { Identifier, Role } from '@core/models/auth.model';

import { AccountSheetActions } from '../enums/account-sheet-actions.enum';
import { AccountSheetComponent, AccountSheetEvent } from './account-sheet';

const phone: Identifier = { channel: 'phone', value: '+242066123456' };

describe('AccountSheetComponent', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  async function setup(inputs: { name?: string; identifier?: Identifier; otherSpaces?: Role[] }) {
    TestBed.configureTestingModule({ providers: [provideI18n()] });
    const fixture = TestBed.createComponent(AccountSheetComponent);
    fixture.componentRef.setInput('name', inputs.name);
    fixture.componentRef.setInput('identifier', inputs.identifier ?? phone);
    fixture.componentRef.setInput('otherSpaces', inputs.otherSpaces ?? []);
    fixture.componentRef.setInput('language', 'en');
    const events: AccountSheetEvent[] = [];
    fixture.componentInstance.sheetAction.subscribe((event) => events.push(event));
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const text = (selector: string) =>
      Array.from(element.querySelectorAll(selector)).map((e) => e.textContent!.trim());
    const press = (label: string) =>
      Array.from(element.querySelectorAll<HTMLButtonElement>('button.row'))
        .find((row) => row.querySelector('.label')!.textContent!.trim() === label)!
        .click();
    return { fixture, element, events, text, press };
  }

  it('names the account and masks its identifier, as Identity does', async () => {
    const { text } = await setup({ name: 'NKOUKA Joseph' });

    expect(text('.title')).toEqual(['NKOUKA Joseph']);
    expect(text('.text')).toEqual(['+242 ••• ••56']);
  });

  it('without a name yet, the masked identifier is the title — an email keeps its domain', async () => {
    const { text } = await setup({
      identifier: { channel: 'email', value: 'aline.mbemba@example.cg' },
    });

    expect(text('.title')).toEqual(['a•••@example.cg']);
    expect(text('.text')).toEqual([]);
  });

  it('one role: no other space, sign out without a word about both spaces', async () => {
    const { text } = await setup({ otherSpaces: [] });

    expect(text('.row .label')).toEqual(['Join with an invitation code', 'Language', 'Sign out']);
    expect(text('.row .detail')).not.toContain('Closes both spaces on this phone.');
  });

  it('two roles: the other space comes first, and sign out says it closes both', async () => {
    const { text } = await setup({ otherSpaces: ['parent'] });

    expect(text('.row .label')).toEqual([
      'Parent space',
      'Join with an invitation code',
      'Language',
      'Sign out',
    ]);
    expect(text('.row .detail')).toContain('Closes both spaces on this phone.');
  });

  it('emits SwitchSpace with the role, JoinInvitation and SignOut', async () => {
    const { events, press } = await setup({ otherSpaces: ['teacher'] });

    press('Teacher space');
    press('Join with an invitation code');
    press('Sign out');

    expect(events).toEqual([
      { action: AccountSheetActions.SwitchSpace, role: 'teacher' },
      { action: AccountSheetActions.JoinInvitation },
      { action: AccountSheetActions.SignOut },
    ]);
  });

  it('emits ChangeLanguage from the language switch, used as is', async () => {
    const { element, events } = await setup({});

    element.querySelector<HTMLButtonElement>('app-language-switch button[lang="fr"]')!.click();
    // The language shown is not picked again.
    element.querySelector<HTMLButtonElement>('app-language-switch button[lang="en"]')!.click();

    expect(events).toEqual([{ action: AccountSheetActions.ChangeLanguage, language: 'fr' }]);
  });

  it('emits Close from the scrim, the handle and Escape — nothing else', async () => {
    const { element, events } = await setup({ otherSpaces: ['parent'] });

    element.querySelector<HTMLElement>('.scrim')!.click();
    element.querySelector<HTMLElement>('.handle')!.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    const close = { action: AccountSheetActions.Close };
    expect(events).toEqual([close, close, close]);
  });

  it('every action is a button with its text: a whole row is the target (§7.6)', async () => {
    const { element } = await setup({ otherSpaces: ['parent'] });

    const rows = Array.from(element.querySelectorAll('button.row'));
    expect(rows).toHaveLength(3);
    for (const row of rows) expect(row.getAttribute('type')).toBe('button');
  });

  it('speaks French', async () => {
    const { fixture, text } = await setup({ otherSpaces: ['parent'] });

    await TestBed.inject(LanguageStore).setLanguage('fr');
    await fixture.whenStable();

    expect(text('.row .label')).toEqual([
      'Espace parent',
      "Rejoindre avec un code d'invitation",
      'Langue',
      'Se déconnecter',
    ]);
  });
});
