import type { Prisma } from "@prisma/client";

const ADMIN_FIXTURE_TIME = new Date("2026-08-23T12:00:00.000Z");

/** Builds a deterministic verified administrator row for administration tests. */
export function adminUserFixture(
  overrides: Partial<Prisma.UserUncheckedCreateInput> = {},
): Prisma.UserUncheckedCreateInput {
  return {
    id: "10000000-0000-4000-8000-000000000001",
    name: "Fixture Administrator",
    email: "administrator@example.invalid",
    passwordHash: "fixture-password-hash",
    role: "ADMIN",
    isEmailVerified: true,
    createdAt: ADMIN_FIXTURE_TIME,
    updatedAt: ADMIN_FIXTURE_TIME,
    ...overrides,
  };
}

/** Builds a deterministic verified target account for administrator mutations. */
export function adminTargetUserFixture(
  overrides: Partial<Prisma.UserUncheckedCreateInput> = {},
): Prisma.UserUncheckedCreateInput {
  return {
    id: "20000000-0000-4000-8000-000000000002",
    name: "Fixture Target",
    email: "target@example.invalid",
    passwordHash: "fixture-password-hash",
    role: "USER",
    isEmailVerified: true,
    createdAt: ADMIN_FIXTURE_TIME,
    updatedAt: ADMIN_FIXTURE_TIME,
    ...overrides,
  };
}

/** Builds a deterministic active refresh session owned by the target account. */
export function adminSessionFixture(
  overrides: Partial<Prisma.RefreshTokenUncheckedCreateInput> = {},
): Prisma.RefreshTokenUncheckedCreateInput {
  return {
    id: "30000000-0000-4000-8000-000000000003",
    userId: String(adminTargetUserFixture().id),
    tokenHash: "fixture-refresh-token-hash",
    expiresAt: new Date("2026-08-24T12:00:00.000Z"),
    revokedAt: null,
    createdAt: ADMIN_FIXTURE_TIME,
    ...overrides,
  };
}

/** Builds a deterministic nested folder owned by the target account. */
export function adminNestedFolderFixture(
  overrides: Partial<Prisma.FolderUncheckedCreateInput> = {},
): Prisma.FolderUncheckedCreateInput {
  return {
    id: "40000000-0000-4000-8000-000000000004",
    ownerId: String(adminTargetUserFixture().id),
    parentId: "40000000-0000-4000-8000-000000000040",
    name: "Nested fixture folder",
    createdAt: ADMIN_FIXTURE_TIME,
    updatedAt: ADMIN_FIXTURE_TIME,
    ...overrides,
  };
}

/** Builds deterministic metadata for a private object owned by the target. */
export function adminFileFixture(
  overrides: Partial<Prisma.FileUncheckedCreateInput> = {},
): Prisma.FileUncheckedCreateInput {
  const id = String(
    overrides.id ?? "50000000-0000-4000-8000-000000000005",
  );
  const ownerId = String(overrides.ownerId ?? adminTargetUserFixture().id);
  return {
    id,
    ownerId,
    folderId: adminNestedFolderFixture().id,
    originalName: "fixture-report.pdf",
    storageKey: `users/${ownerId}/files/${id}`,
    mimeType: "application/pdf",
    size: 4096n,
    extractedContent: "Fixture report text",
    createdAt: ADMIN_FIXTURE_TIME,
    updatedAt: ADMIN_FIXTURE_TIME,
    ...overrides,
  };
}

/** Builds a deterministic sanitized audit row for monitoring and cleanup tests. */
export function adminAuditEventFixture(
  overrides: Partial<Prisma.AuditLogUncheckedCreateInput> = {},
): Prisma.AuditLogUncheckedCreateInput {
  return {
    id: "60000000-0000-4000-8000-000000000006",
    actorId: adminUserFixture().id,
    action: "admin.user.role_changed",
    entityType: "USER",
    entityId: adminTargetUserFixture().id,
    metadata: { outcome: "SUCCESS", requestId: "fixture-request" },
    createdAt: ADMIN_FIXTURE_TIME,
    ...overrides,
  };
}

/** Projects the deterministic administrator fixture into browser-safe metadata. */
export function safeAdminUserFixture() {
  const user = adminUserFixture();
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    role: user.role as "ADMIN",
    isEmailVerified: user.isEmailVerified,
    createdAt: (user.createdAt as Date).toISOString(),
    updatedAt: (user.updatedAt as Date).toISOString(),
  };
}

/** Projects deterministic file state into metadata-only administrator output. */
export function safeAdminFileFixture() {
  const file = adminFileFixture();
  return {
    id: String(file.id),
    owner: { id: String(file.ownerId), name: "Fixture Target", email: "target@example.invalid" },
    originalName: file.originalName,
    mimeType: file.mimeType,
    type: "pdf" as const,
    sizeBytes: String(file.size),
    folder: { id: String(file.folderId), name: "Nested fixture folder" },
    uploadedAt: (file.createdAt as Date).toISOString(),
    updatedAt: (file.updatedAt as Date).toISOString(),
  };
}

/** Provides exact deterministic administrator monitoring statistics. */
export function safeAdminStatisticsFixture() {
  return { totalUsers: 2, totalFiles: 1, storedBytes: "4096", typeDistribution: [{ type: "pdf" as const, count: 1 }], recentUploads: [safeAdminFileFixture()], computedAt: ADMIN_FIXTURE_TIME.toISOString() };
}

/** Provides one retained sanitized browser-safe audit event. */
export function safeAdminAuditFixture() {
  const administrator = safeAdminUserFixture();
  return { id: String(adminAuditEventFixture().id), actor: { kind: "user" as const, id: administrator.id, name: administrator.name, email: administrator.email }, action: "admin.user.role_changed", entityType: "USER" as const, entityId: String(adminTargetUserFixture().id), metadata: { outcome: "SUCCESS" as const, requestId: "fixture-request" }, createdAt: ADMIN_FIXTURE_TIME.toISOString() };
}
