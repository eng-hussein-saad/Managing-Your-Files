import type { AccessSession } from "@gold-era/contracts/public";
export type AuthStatus = "loading" | "authenticated" | "anonymous";
export type AuthState =
  | { status: "loading"; session: null }
  | { status: "anonymous"; session: null }
  | { status: "authenticated"; session: AccessSession };
