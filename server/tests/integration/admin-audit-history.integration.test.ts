import supertest from "supertest";
import { expect, it } from "vitest";
import { administratorHarness, administratorUserId, describeDatabase } from "../helpers/integration.js";

describeDatabase("administrator retained audit history", () => {
  const { app, prisma } = administratorHarness();
  it("projects live, deleted, and system actors with allowlisted metadata and no read audit", async () => {
    const now = new Date("2026-08-23T00:00:00Z");
    await prisma.auditLog.createMany({ data: [
      { actorId: administratorUserId, action: "file.upload", entityType: "FILE", entityId: "uploaded-file", metadata: { outcome: "SUCCESS", password: "must-not-project" }, createdAt: now },
      { actorId: null, action: "file.delete", entityType: "FILE", entityId: "deleted-file", metadata: { outcome: "SUCCESS", actorState: "DELETED" }, createdAt: new Date(now.getTime() + 1) },
      { actorId: null, action: "admin.bootstrap", entityType: "USER", entityId: "system", metadata: { outcome: "SUCCESS" }, createdAt: new Date(now.getTime() + 2) },
      { actorId: administratorUserId, action: "auth.login", entityType: "USER", entityId: administratorUserId, metadata: { outcome: "SUCCESS" }, createdAt: new Date(now.getTime() + 3) },
    ] });
    const response = await supertest(app).get("/api/v1/admin/audit-events?pageSize=5").expect(200);
    const events = response.body.data as Array<{ actor: { kind: string } }>;
    expect(events.map((event) => event.actor.kind)).toEqual(["system", "deleted", "user"]);
    expect(response.body.data).toHaveLength(3);
    expect(JSON.stringify(response.body)).not.toContain("must-not-project");
    expect(await prisma.auditLog.count()).toBe(4);
  });
});
