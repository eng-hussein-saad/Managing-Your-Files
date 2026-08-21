"use client";
import type { PropsWithChildren } from "react";
import { useAuthState } from "../../features/auth/auth-store";
import { AppNavigation } from "../../components/navigation/app-navigation";
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
      <AppNavigation role={auth.session.user.role} />
      {children}
    </>
  );
}
