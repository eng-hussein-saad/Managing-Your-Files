"use client";
import { useEffect, useRef, useState } from "react";
import type { AdminUser } from "@gold-era/contracts/public";
import { apiErrorCode, apiErrorMessage } from "../../../lib/api/api-error";
import { useToast } from "../../../components/toast/toast-provider";
import { useChangeAdminUserRole, useDeleteAdminUser } from "../hooks/use-admin-users";

/** Presents target-specific guarded administrator user mutations. */
export function AdminUserActions({ user, onStale }: { user: AdminUser; onStale: () => void }) {
  const [mode, setMode] = useState<"role" | "delete" | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const firstControl = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const role = useChangeAdminUserRole();
  const deletion = useDeleteAdminUser();
  const toast = useToast();
  useEffect(() => {
    if (mode) {
      previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      firstControl.current?.focus();
      return;
    }
    previousFocus.current?.focus();
  }, [mode]);
  /** Closes the mutation dialog and clears target confirmation state. */
  const close = () => {
    setMode(null);
    setConfirmation("");
    role.reset();
    deletion.reset();
  };
  /** Handles conflict recovery consistently across administrator mutations. */
  const recover = (error: unknown) => {
    if (apiErrorCode(error) === "RESOURCE_CONFLICT") {
      close();
      onStale();
    }
  };
  /** Applies the inverse target role after explicit confirmation. */
  const confirmRole = async () => {
    try {
      await role.mutateAsync({
        id: user.id,
        input: { role: user.role === "ADMIN" ? "USER" : "ADMIN", expectedUpdatedAt: user.updatedAt },
      });
      toast.notify("User role updated.", { kind: "success" });
      close();
    } catch (error) {
      recover(error);
    }
  };
  /** Applies permanent deletion only when the typed email matches exactly. */
  const confirmDelete = async () => {
    try {
      await deletion.mutateAsync({
        id: user.id,
        input: { expectedUpdatedAt: user.updatedAt, confirmationEmail: confirmation },
      });
      toast.notify("User permanently deleted.", { kind: "success" });
      close();
    } catch (error) {
      recover(error);
    }
  };
  const pending = role.isPending || deletion.isPending;
  const error = role.error ?? deletion.error;
  return (
    <div className="admin-actions">
      <button type="button" onClick={() => setMode("role")}>Change role</button>
      <button className="danger" type="button" onClick={() => setMode("delete")}>Delete permanently</button>
      {mode ? (
        <div className="dialog-backdrop" onKeyDown={(event) => event.key === "Escape" && !pending && close()}>
          <section className="app-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-user-action-title">
            <h2 id="admin-user-action-title">
              {mode === "role" ? `Change ${user.name}'s role?` : `Permanently delete ${user.name}?`}
            </h2>
            {mode === "delete" ? (
              <label>
                Type {user.email} to confirm
                <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" />
              </label>
            ) : (
              <p>The new role will be {user.role === "ADMIN" ? "User" : "Administrator"}. Active sessions will be invalidated.</p>
            )}
            {error ? <p role="alert">{apiErrorMessage(error)}</p> : null}
            <div className="dialog-actions">
              <button ref={firstControl} type="button" onClick={close} disabled={pending}>Cancel</button>
              <button
                className={mode === "delete" ? "danger" : undefined}
                type="button"
                disabled={pending || (mode === "delete" && confirmation !== user.email)}
                onClick={() => void (mode === "role" ? confirmRole() : confirmDelete())}
              >
                {pending ? "Saving…" : "Confirm"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
