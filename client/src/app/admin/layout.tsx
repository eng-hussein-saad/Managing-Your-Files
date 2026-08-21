"use client";
import type { PropsWithChildren } from "react";
import { useAuthState } from "../../features/auth/auth-store";
import { LogoutButton } from "../../components/auth/logout-button";
import { PageState } from "../../components/status/page-state";
/** Provides an administrator UX guard without replacing server authorization. */
export default function AdminLayout({ children }: PropsWithChildren) {
  const auth = useAuthState();
  if (auth.status === "loading")
    return <PageState title="Checking administrator access" busy />;
  if (auth.status === "anonymous")
    return (
      <PageState title="Sign in to continue">
        <a className="button" href="/login">
          Sign in
        </a>
      </PageState>
    );
  if (auth.session?.user.role !== "ADMIN")
    return (
      <PageState title="You do not have permission">
        <p>This area is reserved for administrators.</p>
      </PageState>
    );
  return (
    <>
      <header className="app-header">
        <a className="brand" href="/admin">
          Gold Era<span>.</span>
        </a>
        <nav aria-label="Account">
          <a href="/admin">Admin</a>
          <a href="/dashboard">Dashboard</a>
          <a href="/profile">Profile</a>
          <LogoutButton />
        </nav>
      </header>
      {children}
    </>
  );
}
