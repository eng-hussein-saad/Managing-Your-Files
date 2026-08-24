import supertest from "supertest";
import { expect, it } from "vitest";
import { administratorHarness, administratorUserId, describeDatabase, primaryUserId } from "../helpers/integration.js";

describeDatabase("administrator user management", () => {
  const { app, prisma } = administratorHarness();
  it("queries deterministically without read audits and invalidates sessions on role change", async () => {
    await prisma.refreshToken.create({ data: { userId: primaryUserId, tokenHash: "session", expiresAt: new Date("2026-09-01T00:00:00Z"), createdAt: new Date() } });
    const page = await supertest(app).get("/api/v1/admin/users?search=primary&sort=name&direction=asc&pageSize=5").expect(200);
    const users = page.body.data as Array<{ id: string }>;
    expect(users.map((user) => user.id)).toEqual([primaryUserId]);
    expect(await prisma.auditLog.count()).toBe(0);
    const target = await prisma.user.findUniqueOrThrow({ where: { id: primaryUserId } });
    await supertest(app).patch(`/api/v1/admin/users/${primaryUserId}/role`).send({ role: "ADMIN", expectedUpdatedAt: target.updatedAt.toISOString() }).expect(200);
    expect(await prisma.refreshToken.count({ where: { userId: primaryUserId } })).toBe(0);
    const events = await prisma.auditLog.findMany({ where: { action: "admin.user.role_changed" } });
    expect(events).toHaveLength(1);
    expect(JSON.stringify(events[0]?.metadata)).not.toContain("primary@example.invalid");
  });
  it("rejects stale, self, and last-administrator commands", async () => {
    const target = await prisma.user.findUniqueOrThrow({ where: { id: primaryUserId } });
    await supertest(app).patch(`/api/v1/admin/users/${primaryUserId}/role`).send({ role: "ADMIN", expectedUpdatedAt: "2026-01-01T00:00:00.000Z" }).expect(409);
    const administrator = await prisma.user.findUniqueOrThrow({ where: { id: administratorUserId } });
    await supertest(app).patch(`/api/v1/admin/users/${administratorUserId}/role`).send({ role: "USER", expectedUpdatedAt: administrator.updatedAt.toISOString() }).expect(403);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: primaryUserId } })).role).toBe(target.role);
  });
});
