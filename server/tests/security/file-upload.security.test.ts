import supertest from "supertest";
import { expect, it } from "vitest";
import {
  describeDatabase,
  fileManagementHarness,
  primaryUserId,
} from "../helpers/integration.js";

const prohibited = [
  "supabase.co",
  "sb_secret_test-key",
  "postgresql://",
  "extracted-secret-marker",
  "multer",
  "\\Temp\\",
];

/** Proves upload responses, audits, and failures expose no private implementation data. */
describeDatabase("file upload security", () => {
  const { app, prisma, storage, extractor } = fileManagementHarness();

  /** Serializes a response and asserts every prohibited marker is absent. */
  const expectSafe = (value: unknown) => {
    const serialized = JSON.stringify(value);
    for (const marker of prohibited) expect(serialized).not.toContain(marker);
    expect(serialized).not.toMatch(/users\/[0-9a-f-]+\/files\/[0-9a-f-]+/i);
  };

  it("allowlists successful metadata while keeping keys and extracted content private", async () => {
    extractor.result = "extracted-secret-marker";
    const response = await supertest(app)
      .post("/api/v1/files")
      .attach("file", Buffer.from("safe text"), "../private\r\nname.txt")
      .expect(201);
    expectSafe(response.body);
    const row = await prisma.file.findUniqueOrThrow({
      where: { id: response.body.data.id },
    });
    expect(row.storageKey).toMatch(
      new RegExp(`^users/${primaryUserId}/files/[0-9a-f-]+$`, "i"),
    );
    expect(row.extractedContent).toBe("extracted-secret-marker");
    const audit = await prisma.auditLog.findFirstOrThrow({
      where: { action: "file.upload" },
    });
    expectSafe(audit.metadata);
  });

  it("returns a safe provider failure and leaves no partial row or object", async () => {
    storage.failNext = "upload";
    const response = await supertest(app)
      .post("/api/v1/files")
      .attach("file", Buffer.from("safe text"), "provider-url.txt")
      .expect(503);
    expectSafe(response.body);
    expect(await prisma.file.count()).toBe(0);
    expect(storage.objects.size).toBe(0);
  });

  it("rejects spoofed content without persisting filenames, paths, or credentials", async () => {
    const response = await supertest(app)
      .post("/api/v1/files")
      .attach(
        "file",
        Buffer.from([0, 1, 2, 3]),
        "credential-sb_secret_test-key.pdf",
      )
      .expect(415);
    expectSafe({ ...response.body, requestId: undefined });
    expect(await prisma.file.count()).toBe(0);
    expect(storage.calls).toHaveLength(0);
  });
});
