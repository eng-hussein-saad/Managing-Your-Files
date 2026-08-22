import { describe, expect, it } from "vitest";
import express from "express";
import supertest from "supertest";
import { setContentHeaders } from "../../src/infrastructure/file-content/content-response.js";
describe("private content headers", () => {
  it("removes control and path characters from fallback download names", async () => {
    const app = express();
    app.get("/", (_request, response) => {
      setContentHeaders(response, {
        name: "a\r\n/evil.pdf",
        mimeType: "application/pdf",
        size: 1,
        disposition: "attachment",
      });
      response.end("x");
    });
    const result = await supertest(app).get("/");
    expect(result.headers["content-disposition"]).toContain(
      'filename="a___evil.pdf"',
    );
    expect(result.headers["content-disposition"]).not.toContain("%0D");
    expect(result.headers["cache-control"]).toBe("private, no-store");
  });
});
