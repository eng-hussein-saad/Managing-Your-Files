"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "../../features/auth/auth-store";
import { PageState } from "../status/page-state";

/** Keeps authenticated users out of guest-only entry routes. */
export function GuestRoute({ children }: { children: ReactNode }) {
  const auth = useAuthState();
  const router = useRouter();

  useEffect(() => {
    if (auth.status === "authenticated") router.replace("/dashboard");
  }, [auth.status, router]);

  if (auth.status === "loading")
    return <PageState title="Restoring your session" busy />;

  if (auth.status === "authenticated")
    return <PageState title="Opening your dashboard" busy />;

  return children;
}
