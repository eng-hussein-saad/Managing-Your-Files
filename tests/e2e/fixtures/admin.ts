import type { PrismaClient } from "@prisma/client";
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { passwordHasher } from "../../../server/src/infrastructure/security/password-hasher.js";
import {
  adminFileFixture,
  adminNestedFolderFixture,
  adminTargetUserFixture,
  adminUserFixture,
} from "../../../server/tests/fixtures/admin.js";

export const adminIdentities = {
  administrator: {
    email: "administrator@example.invalid",
    password: "Fixture Administrator Password 123!",
  },
  target: {
    email: "target@example.invalid",
    password: "Fixture Target Password 123!",
  },
  normalUser: {
    email: "normal-user@example.invalid",
    password: "Fixture Normal Password 123!",
  },
} as const;

/** Seeds deterministic administrator journey state into an empty test database. */
export async function seedAdminJourney(prisma: PrismaClient): Promise<void> {
  const [administratorHash, targetHash, normalHash] = await Promise.all([
    passwordHasher.hash(adminIdentities.administrator.password),
    passwordHasher.hash(adminIdentities.target.password),
    passwordHasher.hash(adminIdentities.normalUser.password),
  ]);
  await prisma.user.createMany({
    data: [
      adminUserFixture({ passwordHash: administratorHash }),
      adminTargetUserFixture({ passwordHash: targetHash }),
      adminTargetUserFixture({
        id: "20000000-0000-4000-8000-000000000020",
        name: "Fixture Normal User",
        email: adminIdentities.normalUser.email,
        passwordHash: normalHash,
      }),
    ],
  });
  await prisma.folder.create({
    data: adminNestedFolderFixture({ parentId: null }),
  });
  await prisma.file.create({ data: adminFileFixture() });
}

/** Signs in through the visible administrator journey using configured credentials. */
export async function signInAdministrator(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.E2E_ADMIN_EMAIL ?? adminIdentities.administrator.email);
  await page.getByLabel("Password").fill(process.env.E2E_ADMIN_PASSWORD ?? adminIdentities.administrator.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/admin|dashboard/);
}
