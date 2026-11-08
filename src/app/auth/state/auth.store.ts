import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { AuthApi, AuthError, AuthErrorCode } from '@core/services/auth-api';
import {
  Identifier,
  Intent,
  Invitation,
  ParentAlerts,
  ParentalConsent,
  Session,
  TeacherProfile,
} from '@core/models/auth.model';
import { formatIdentifier } from '@core/models/identifier';
import { Message } from '@core/i18n/translate';
import { SessionStore } from '@core/store/session/session.store';

import { ContactNext } from '../models/auth.model';

/** Refusals of the flow: from the server, or decided on screen. */
export type FlowError = AuthErrorCode | 'invitation-declined' | 'consents-declined' | 'unexpected';

/** Why a parent turns an invitation down: not their child (US-PA01), or no consent (RI-20). */
export type DeclineReason = Extract<FlowError, 'invitation-declined' | 'consents-declined'>;

interface AuthState {
  intent: Intent;
  identifier: Identifier | null;
  /** Timestamp (ms) from which a new code can be requested. */
  resendAllowedAt: number;
  invitation: Invitation | null;
  /**
   * Parental consents the acceptance asks for, for this invitation and this
   * contact (RI-20) — `null` until the server has answered.
   */
  requiredConsents: ParentalConsent[] | null;
  /** Consents the parent gave on screen, passed to the acceptance. */
  givenConsents: ParentalConsent[];
  busy: boolean;
  error: FlowError | null;
}

/** Consents belong to one invitation and one contact: forgotten when either changes. */
const NO_CONSENTS = { requiredConsents: null, givenConsents: [] } satisfies Partial<AuthState>;

const initialState: AuthState = {
  intent: 'sign-in',
  identifier: null,
  resendAllowedAt: 0,
  invitation: null,
  ...NO_CONSENTS,
  busy: false,
  error: null,
};

/**
 * State of the entry flow (sign-up, sign-in, parent invitation), shared by the
 * `/auth` screens — provided at route level, forgotten when leaving it.
 * The opened session lives in `SessionStore`.
 */
export const AuthFlowStore = signalStore(
  withState(initialState),
  withComputed(({ error, identifier }) => ({
    /** The refusal as a translatable message — it always says what to do. */
    errorMessage: computed<Message | null>(() => {
      const code = error();
      if (!code) return null;
      const id = identifier();
      return {
        key: `auth.errors.${code}`,
        params: { identifier: id ? formatIdentifier(id) : '', channel: id?.channel ?? 'phone' },
      };
    }),
  })),
  withMethods((store, api = inject(AuthApi), session = inject(SessionStore)) => {
    /** Runs a server call: one at a time, refusal stored in `error`. */
    async function call<T>(action: () => Promise<T>, onError?: () => void): Promise<T | null> {
      if (store.busy()) return null;
      patchState(store, { busy: true, error: null });
      try {
        return await action();
      } catch (e) {
        onError?.();
        patchState(store, { error: e instanceof AuthError ? e.code : 'unexpected' });
        return null;
      } finally {
        patchState(store, { busy: false });
      }
    }

    /** Sends the code to the contact entered; starts the anti-spam delay. */
    async function sendCode(identifier: Identifier): Promise<boolean> {
      const request = await call(() => api.requestCode(identifier, store.intent()));
      if (!request) return false;
      patchState(store, { resendAllowedAt: Date.now() + request.resendIn * 1000 });
      return true;
    }

    return {
      /** A screen that takes the contact opens: consents asked for an earlier one no longer hold. */
      start(intent: Intent): void {
        patchState(store, {
          intent,
          error: null,
          ...NO_CONSENTS,
          ...(intent === 'invitation' ? {} : { invitation: null }),
        });
      },

      clearError(): void {
        if (store.error()) patchState(store, { error: null });
      },

      /**
       * The contact is entered. For an invitation, the server first says which
       * parental consents the acceptance will ask for (RI-20): when there are
       * some, they come next and no code leaves before them — a parent who does
       * not consent costs no SMS. Otherwise, as for any sign-in, the code is sent.
       */
      async submitContact(identifier: Identifier): Promise<ContactNext | null> {
        // The identifier is kept even on refusal: the message names it.
        patchState(store, { identifier, ...NO_CONSENTS });
        const invitation = store.invitation();
        // One busy span for both calls: the button does not flicker between them.
        const outcome = await call(async () => {
          const required = invitation ? await api.requiredConsents(identifier, invitation) : [];
          if (required.length) return { required, request: null };
          return { required, request: await api.requestCode(identifier, store.intent()) };
        });
        if (!outcome) return null;
        patchState(store, { requiredConsents: outcome.required });
        if (!outcome.request) return 'consents';
        patchState(store, { resendAllowedAt: Date.now() + outcome.request.resendIn * 1000 });
        return 'code';
      },

      /** The parent gave the consents asked: they go with the acceptance, and the code is sent. */
      async giveConsents(consents: ParentalConsent[]): Promise<boolean> {
        const identifier = store.identifier();
        if (!identifier || !store.requiredConsents()?.length) return false;
        patchState(store, { givenConsents: [...consents] });
        return sendCode(identifier);
      },

      async resendCode(): Promise<boolean> {
        const identifier = store.identifier();
        if (!identifier || Date.now() < store.resendAllowedAt()) return false;
        return sendCode(identifier);
      },

      async verifyCode(code: string): Promise<Session | null> {
        const identifier = store.identifier();
        if (!identifier) return null;
        const invitation = store.invitation();
        const acceptance = invitation ? { invitation, consents: store.givenConsents() } : undefined;
        const opened = await call(() =>
          api.verifyCode(identifier, code, store.intent(), acceptance),
        );
        if (opened) session.open(opened);
        return opened;
      },

      async checkInvitation(code: string): Promise<boolean> {
        const invitation = await call(() => api.checkInvitation(code));
        if (!invitation) return false;
        patchState(store, { invitation, intent: 'invitation', ...NO_CONSENTS });
        return true;
      },

      /** No link is made; the invitation code screen says why and what to do. */
      declineInvitation(reason: DeclineReason = 'invitation-declined'): void {
        patchState(store, { invitation: null, ...NO_CONSENTS, error: reason });
      },

      async completeProfile(profile: TeacherProfile): Promise<boolean> {
        const current = session.session();
        if (!current) return false;
        const active = await call(() => api.completeProfile(current, profile));
        if (active) session.open(active);
        return active !== null;
      },

      async saveAlerts(alerts: ParentAlerts): Promise<boolean> {
        const current = session.session();
        if (!current) return false;
        const active = await call(() => api.saveAlerts(current, alerts));
        if (active) session.open(active);
        return active !== null;
      },
    };
  }),
);
