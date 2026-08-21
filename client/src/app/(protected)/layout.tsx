"use client";
import type { PropsWithChildren } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthState } from "../../features/auth/auth-store";
import { LogoutButton } from "../../components/auth/logout-button";
import { PageState } from "../../components/status/page-state";
/** Provides a UX guard while Express remains the protected-data authority. */
export default function ProtectedLayout({ children }: PropsWithChildren) {
  const auth = useAuthState();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (auth.status === "anonymous")
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [auth.status, pathname, router]);
  if (auth.status === "loading")
    return (
      <PageState title="Restoring your session" busy>
        <p>Checking your secure session…</p>
      </PageState>
    );
  if (auth.status === "anonymous")
    return (
      <PageState title="Sign in to continue">
        <p>Your session is no longer active.</p>
      </PageState>
    );
  return (
    <>
      <header className="app-header">
        <a className="brand" href="/dashboard">
          Gold Era<span>.</span>
        </a>
        <nav aria-label="Account">
          <a href="/dashboard">Dashboard</a>
          <a href="/profile">Profile</a>
          <LogoutButton />
        </nav>
      </header>
      {children}
    </>
  );
}
