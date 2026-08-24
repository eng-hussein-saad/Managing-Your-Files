import type { AuditEvent } from "./audit.types.js";

type AdminAuditAction = Extract<
  AuditEvent["action"],
  | "admin.user.role_changed"
  | "admin.user.permanently_deleted"
  | "admin.file.permanently_deleted"
>;

/** Creates a sanitized allowlisted administrator mutation audit event. */
export function adminAudit(
  action: AdminAuditAction,
  actorId: string,
  entityType: "USER" | "FILE",
  entityId: string,
  requestId?: string,
): AuditEvent {
  return {
    actorId,
    action,
    entityType,
    entityId,
    metadata: { outcome: "SUCCESS", requestId },
  };
}
