export const auditActions = [
  "admin.bootstrap",
  "admin.user.role_changed",
  "admin.user.permanently_deleted",
  "admin.file.permanently_deleted",
  "file.upload",
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
    outcome: "SUCCESS";
    reasonCode?: string;
    requestId?: string;
  };
}
