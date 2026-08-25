"use client";
import { useState } from "react";
import type { AdminUser } from "@gold-era/contracts/public";
import { apiErrorCode, apiErrorMessage } from "../../../lib/api/api-error";
import { useToast } from "../../../components/toast/toast-provider";
import {
  useChangeAdminUserRole,
  useDeleteAdminUser,
} from "../hooks/use-admin-users";
import { Dialog } from "../../../components/overlays/overlay";
import { Button, Field } from "../../../components/ui/controls";

/** Presents target-specific guarded administrator user mutations. */
export function AdminUserActions({
  user,
  onStale,
}: {
  user: AdminUser;
  onStale: () => void;
}) {
  const [mode, setMode] = useState<"role" | "delete" | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const role = useChangeAdminUserRole();
  const deletion = useDeleteAdminUser();
  const toast = useToast();
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
        input: {
          role: user.role === "ADMIN" ? "USER" : "ADMIN",
          expectedUpdatedAt: user.updatedAt,
        },
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
        input: {
          expectedUpdatedAt: user.updatedAt,
          confirmationEmail: confirmation,
        },
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
      <Button variant="secondary" type="button" onClick={() => setMode("role")}>
        Change role
      </Button>
      <Button variant="danger" type="button" onClick={() => setMode("delete")}>
        Delete
      </Button>
      {mode ? (
        <Dialog
          open
          title={
            mode === "role"
              ? `Change ${user.name}'s role?`
              : `Permanently delete ${user.name}?`
          }
          description={
            mode === "role"
              ? "Changing role invalidates active sessions."
              : "This removes the account and its owned data permanently."
          }
          onClose={close}
          dismissible={!pending}
        >
          {mode === "delete" ? (
            <Field
              label={`Type ${user.email} to confirm`}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
            />
          ) : (
            <p>
              The new role will be{" "}
              {user.role === "ADMIN" ? "User" : "Administrator"}. Active
              sessions will be invalidated.
            </p>
          )}
          {error ? <p role="alert">{apiErrorMessage(error)}</p> : null}
          <div className="dialog-actions">
            <Button
              variant="secondary"
              type="button"
              onClick={close}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              variant={mode === "delete" ? "danger" : "primary"}
              type="button"
              disabled={
                pending || (mode === "delete" && confirmation !== user.email)
              }
              onClick={() =>
                void (mode === "role" ? confirmRole() : confirmDelete())
              }
            >
              {pending ? "Saving…" : "Confirm"}
            </Button>
          </div>
        </Dialog>
      ) : null}
    </div>
  );
}
