export const auditActions = [
  "auth.registration",
  "auth.verification",
  "auth.verification_delivery_failed",
  "auth.login",
  "auth.logout",
  "admin.bootstrap",
  "auth.authorization_denied",
] as const;
export type AuditAction = (typeof auditActions)[number];
export interface AuditEvent {
  actorId?: string;
  action: AuditAction;
  entityType?: "USER" | "REFRESH_TOKEN";
  entityId?: string;
  metadata: {
    outcome: "SUCCESS" | "FAILURE" | "DENIED";
    reasonCode?: string;
    requestId?: string;
  };
}
