"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type PropsWithChildren } from "react";
import { ToastProvider } from "../components/toast/toast-provider";
import { AuthProvider } from "./auth-provider";
import { ThemeProvider } from "./theme-provider";
/** Provides one stable query cache and the authentication lifecycle. */
export function AppProviders({ children }: PropsWithChildren) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider><ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider></ThemeProvider>
    </QueryClientProvider>
  );
}
