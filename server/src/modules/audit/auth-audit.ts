import type { AuditEvent } from "./audit.types.js";
/** Creates allowlisted authentication audit metadata without accepting request payloads. */
export function authAudit(
  action: AuditEvent["action"],
  outcome: AuditEvent["metadata"]["outcome"],
  input: Omit<AuditEvent, "action" | "metadata"> & {
    reasonCode?: string;
    requestId?: string;
  },
): AuditEvent {
  return {
    actorId: input.actorId,
    action,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: {
      outcome,
      reasonCode: input.reasonCode,
      requestId: input.requestId,
    },
  };
}
