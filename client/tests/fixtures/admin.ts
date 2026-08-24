const FIXTURE_TIME = "2026-08-23T12:00:00.000Z";

/** Provides browser-safe administrator user metadata. */
export function adminUserResponseFixture() {
  return {
    id: "10000000-0000-4000-8000-000000000001",
    name: "Fixture Administrator",
    email: "administrator@example.invalid",
    role: "ADMIN" as const,
    isEmailVerified: true,
    createdAt: FIXTURE_TIME,
    updatedAt: FIXTURE_TIME,
  };
}

/** Provides browser-safe global file metadata without content capability. */
export function adminFileResponseFixture() {
  return {
    id: "50000000-0000-4000-8000-000000000005",
    owner: {
      id: "20000000-0000-4000-8000-000000000002",
      name: "Fixture Target",
      email: "target@example.invalid",
    },
    originalName: "fixture-report.pdf",
    mimeType: "application/pdf",
    type: "pdf" as const,
    sizeBytes: "4096",
    folder: {
      id: "40000000-0000-4000-8000-000000000004",
      name: "Nested fixture folder",
    },
    uploadedAt: FIXTURE_TIME,
    updatedAt: FIXTURE_TIME,
  };
}

/** Provides exact current administrator dashboard statistics. */
export function adminStatisticsResponseFixture() {
  return {
    totalUsers: 2,
    totalFiles: 1,
    storedBytes: "4096",
    typeDistribution: [{ type: "pdf" as const, count: 1 }],
    recentUploads: [adminFileResponseFixture()],
    computedAt: FIXTURE_TIME,
  };
}

/** Provides a sanitized audit response with a live actor projection. */
export function adminAuditResponseFixture() {
  return {
    id: "60000000-0000-4000-8000-000000000006",
    actor: {
      kind: "user" as const,
      id: adminUserResponseFixture().id,
      name: adminUserResponseFixture().name,
      email: adminUserResponseFixture().email,
    },
    action: "admin.user.role_changed",
    entityType: "USER" as const,
    entityId: "20000000-0000-4000-8000-000000000002",
    metadata: { outcome: "SUCCESS" as const, requestId: "fixture-request" },
    createdAt: FIXTURE_TIME,
  };
}
