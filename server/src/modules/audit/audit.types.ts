export const auditActions = [
  "auth.registration",
  "auth.verification",
  "auth.verification_delivery_failed",
  "auth.login",
  "auth.logout",
  "admin.bootstrap",
  "admin.user.role_changed",
  "admin.user.permanently_deleted",
  "admin.file.permanently_deleted",
  "auth.authorization_denied",
  "file.upload",
  "file.download",
  "file.move",
  "file.delete",
  "folder.create",
  "folder.rename",
  "folder.delete",
] as const;
export type AuditAction = (typeof auditActions)[number];
export interface AuditEvent {
  actorId?: string;
  action: AuditAction;
  entityType?: "USER" | "REFRESH_TOKEN" | "FILE" | "FOLDER";
  entityId?: string;
  metadata: {
    outcome: "SUCCESS" | "FAILURE" | "DENIED";
    reasonCode?: string;
    requestId?: string;
  };
}
