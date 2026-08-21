import type { AccessSession } from "@gold-era/contracts/public";
export type AuthStatus = "loading" | "authenticated" | "anonymous";
export interface AuthState {
  status: AuthStatus;
  session: AccessSession | null;
}
