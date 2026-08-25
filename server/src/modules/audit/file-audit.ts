import type { AuditEvent } from "./audit.types.js";
type FileAuditAction = Extract<
  AuditEvent["action"],
  | "file.upload"
  | "file.move"
  | "file.delete"
  | "folder.create"
  | "folder.rename"
  | "folder.delete"
>;
/** Creates a minimal allowlisted audit event for a successful file or folder mutation. */
export function fileAudit(
  action: FileAuditAction,
  actorId: string,
  entityType: "FILE" | "FOLDER",
  entityId: string,
  reasonCode?: string,
): AuditEvent {
  return {
    actorId,
    action,
    entityType,
    entityId,
    metadata: { outcome: "SUCCESS", reasonCode },
  };
}
