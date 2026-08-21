"use client";
import { useRouter } from "next/navigation";
import { useToast } from "../toast/toast-provider";
import { useLogout } from "../../features/auth/hooks/use-logout";
/** Provides an accessible logout action that clears all local authentication state. */
export function LogoutButton() {
  const logout = useLogout();
  const router = useRouter();
  const { notify } = useToast();
  return (
    <button
      className="button secondary"
      disabled={logout.isPending}
      onClick={() =>
        logout.mutate(undefined, {
          onSettled: () => {
            notify("You have been signed out.", { kind: "success" });
            router.replace("/login");
          },
        })
      }
    >
      {logout.isPending ? "Signing out…" : "Sign out"}
    </button>
  );
}
