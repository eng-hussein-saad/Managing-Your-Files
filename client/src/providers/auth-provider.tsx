"use client";
import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { installRenewalInterceptor } from "../lib/api/renewal-interceptor";
import { expressClient } from "../lib/api/express-client";
import { useRestoreSession } from "../features/auth/hooks/use-restore-session";
/** Initializes reload restoration and one shared Express renewal interceptor. */
export function AuthProvider({ children }: PropsWithChildren) {
  useRestoreSession();
  useEffect(() => {
    const id = installRenewalInterceptor(expressClient);
    return () => expressClient.interceptors.response.eject(id);
  }, []);
  return children;
}
