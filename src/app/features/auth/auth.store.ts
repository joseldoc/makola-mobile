import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { AuthApi, AuthError, AuthErrorCode } from '@core/auth/auth-api';
import { Identifier, Intent, Invitation, ParentAlerts, Session, TeacherProfile } from '@core/auth/auth.model';
import { formatIdentifier } from '@core/auth/identifier';
import { Message } from '@core/i18n/translate';
import { SessionStore } from '@core/store/session/session.store';

/** Refusals of the flow: from the server, or decided on screen. */
export type FlowError = AuthErrorCode | 'invitation-declined' | 'unexpected';

interface AuthState {
  intent: Intent;
  identifier: Identifier | null;
  /** Timestamp (ms) from which a new code can be requested. */
  resendAllowedAt: number;
  invitation: Invitation | null;
  busy: boolean;
  error: FlowError | null;
}

const initialState: AuthState = {
  intent: 'sign-in',
  identifier: null,
  resendAllowedAt: 0,
  invitation: null,
  busy: false,
  error: null
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
        params: { identifier: id ? formatIdentifier(id) : '', channel: id?.channel ?? 'phone' }
      };
    })
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

    return {
      start(intent: Intent): void {
        patchState(store, { intent, error: null, ...(intent === 'invitation' ? {} : { invitation: null }) });
      },

      clearError(): void {
        if (store.error()) patchState(store, { error: null });
      },

      async requestCode(identifier: Identifier): Promise<boolean> {
        // The identifier is kept even on refusal: the message names it.
        patchState(store, { identifier });
        const request = await call(() => api.requestCode(identifier, store.intent()));
        if (!request) return false;
        patchState(store, { resendAllowedAt: Date.now() + request.resendIn * 1000 });
        return true;
      },

      async resendCode(): Promise<boolean> {
        const identifier = store.identifier();
        if (!identifier || Date.now() < store.resendAllowedAt()) return false;
        const request = await call(() => api.requestCode(identifier, store.intent()));
        if (!request) return false;
        patchState(store, { resendAllowedAt: Date.now() + request.resendIn * 1000 });
        return true;
      },

      async verifyCode(code: string): Promise<Session | null> {
        const identifier = store.identifier();
        if (!identifier) return null;
        const opened = await call(() => api.verifyCode(identifier, code, store.intent(), store.invitation() ?? undefined));
        if (opened) session.open(opened);
        return opened;
      },

      async checkInvitation(code: string): Promise<boolean> {
        const invitation = await call(() => api.checkInvitation(code));
        if (!invitation) return false;
        patchState(store, { invitation, intent: 'invitation' });
        return true;
      },

      declineInvitation(): void {
        patchState(store, { invitation: null, error: 'invitation-declined' });
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
      }
    };
  })
);
