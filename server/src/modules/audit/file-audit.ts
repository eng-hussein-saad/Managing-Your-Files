import type { AuditEvent } from "./audit.types.js";
type FileAuditAction = Extract<
  AuditEvent["action"],
  | "file.upload"
  | "file.download"
  | "file.move"
  | "file.delete"
  | "folder.create"
  | "folder.rename"
  | "folder.delete"
>;
/** Creates a minimal allowlisted audit event for a file-management outcome. */
export function fileAudit(
  action: FileAuditAction,
  actorId: string,
  entityType: "FILE" | "FOLDER",
  entityId: string,
  outcome: AuditEvent["metadata"]["outcome"],
  reasonCode?: string,
): AuditEvent {
  return {
    actorId,
    action,
    entityType,
    entityId,
    metadata: { outcome, reasonCode },
  };
}
