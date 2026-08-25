"use client";
import { useRouter } from "next/navigation";
import { useToast } from "../toast/toast-provider";
import { useLogout } from "../../features/auth/hooks/use-logout";
import { IconButton } from "../ui/controls";
import { LogoutIcon } from "../ui/icons";
/** Provides an accessible logout action that clears all local authentication state. */
export function LogoutButton() {
  const logout = useLogout();
  const router = useRouter();
  const { notify } = useToast();
  return (
    <IconButton
      label={logout.isPending ? "Signing out" : "Sign out"}
      disabled={logout.isPending}
      onClick={
        /** Starts logout and preserves safe settled-state navigation. */ () =>
          logout.mutate(undefined, {
            onSettled:
              /** Announces the completed local sign-out transition. */ () => {
                notify("You have been signed out.", { kind: "success" });
                router.replace("/login");
              },
          })
      }
    >
      <LogoutIcon />
    </IconButton>
  );
}
