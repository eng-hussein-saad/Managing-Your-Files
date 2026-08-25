"use client";
import { useSyncExternalStore } from "react";
import type { AccessSession } from "@gold-era/contracts/public";
import type { AuthState } from "./auth.types";

let state: AuthState = { status: "loading", session: null };
const serverState: AuthState = { status: "loading", session: null };
const listeners = new Set<() => void>();
/** Updates memory-only authentication state and notifies subscribed views. */
export function setAuthState(next: AuthState): void {
  state = next;
  listeners.forEach((listener) => listener());
}
/** Returns the current access token without browser persistence. */
export function accessToken(): string | null {
  return state.session?.accessToken ?? null;
}
/** Stores one authenticated session exclusively in module memory. */
export function setSession(session: AccessSession): void {
  setAuthState({ status: "authenticated", session });
}
/** Clears all browser-readable authenticated state. */
export function clearSession(): void {
  setAuthState({ status: "anonymous", session: null });
}
/** Subscribes a React component to memory-only authentication state. */
export function useAuthState(): AuthState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => serverState,
  );
}
