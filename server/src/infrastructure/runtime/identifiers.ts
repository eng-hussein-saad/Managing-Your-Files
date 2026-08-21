import { randomUUID } from "node:crypto";
export interface Identifiers {
  uuid(): string;
}
export const systemIdentifiers: Identifiers = {
  /** Produces an RFC 4122 UUID. */ uuid: randomUUID,
};
