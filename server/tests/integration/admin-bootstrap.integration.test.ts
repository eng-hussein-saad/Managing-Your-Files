import { expect, it } from "vitest";
import { AdminBootstrapService } from "../../src/modules/users/admin-bootstrap.service.js";
import { systemClock } from "../../src/infrastructure/runtime/clock.js";
import { systemIdentifiers } from "../../src/infrastructure/runtime/identifiers.js";
import { passwordHasher } from "../../src/infrastructure/security/password-hasher.js";
import {
  describeDatabase,
  integrationHarness,
} from "../helpers/integration.js";
describeDatabase("administrator bootstrap", () => {
  const { prisma } = integrationHarness();
  it("is repeatable and preserves an existing administrator", async () => {
    const service = new AdminBootstrapService(
      prisma,
      systemClock,
      systemIdentifiers,
      passwordHasher,
    );
    await expect(
      service.bootstrap({
        email: "admin@example.invalid",
        password: "administrator-pass",
        name: "Administrator",
      }),
    ).resolves.toEqual({ created: true });
    await expect(
      service.bootstrap({
        email: "admin@example.invalid",
        password: "different-password",
        name: "Changed",
      }),
    ).resolves.toEqual({ created: false });
    expect(
      (
        await prisma.user.findUniqueOrThrow({
          where: { email: "admin@example.invalid" },
        })
      ).name,
    ).toBe("Administrator");
  });
  it("refuses to promote a regular user", async () => {
    const now = new Date();
    await prisma.user.create({
      data: {
        name: "Regular",
        email: "admin@example.invalid",
        passwordHash: "encoded",
        role: "USER",
        isEmailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    });
    const service = new AdminBootstrapService(
      prisma,
      systemClock,
      systemIdentifiers,
      passwordHasher,
    );
    await expect(
      service.bootstrap({
        email: "admin@example.invalid",
        password: "administrator-pass",
        name: "Administrator",
      }),
    ).rejects.toThrow("ADMIN_EMAIL_CONFLICT");
  });
});
