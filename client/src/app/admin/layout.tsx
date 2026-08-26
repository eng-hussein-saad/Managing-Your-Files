"use client";
import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "../../features/auth/auth-store";
import { ConnectedAppNavigation } from "../../components/navigation/connected-app-navigation";
import { PageState } from "../../components/status/page-state";
/** Provides an administrator UX guard without replacing server authorization. */
export default function AdminLayout({ children }: PropsWithChildren) {
  const auth = useAuthState();
  const router = useRouter();
  useEffect(() => {
    if (auth.status === "anonymous") router.replace("/");
  }, [auth.status, router]);
  if (auth.status === "loading")
    return <PageState title="Checking administrator access" busy />;
  if (auth.status === "anonymous")
    return <PageState title="Returning to the home page" busy />;
  if (auth.session?.user.role !== "ADMIN")
    return (
      <PageState title="You do not have permission">
        <p>This area is reserved for administrators.</p>
      </PageState>
    );
  return (
    <div className="authenticated-app restricted-app">
      <ConnectedAppNavigation session={auth.session} />
      <div className="app-shell-content">{children}</div>
    </div>
  );
}
