import express from "express";
import supertest from "supertest";
import { describe, expect, it } from "vitest";
import { exactOriginCors } from "../../src/http/middleware/cors.js";

describe("browser CORS policy", () => {
  const origin = "http://localhost:3000";
  const app = express().use(exactOriginCors([origin]));

  it.each(["PATCH", "DELETE"])(
    "allows %s preflight requests from the configured browser origin",
    async (method) => {
      const response = await supertest(app)
        .options("/api/v1/files/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")
        .set("Origin", origin)
        .set("Access-Control-Request-Method", method)
        .set("Access-Control-Request-Headers", "authorization,content-type")
        .expect(204);

      expect(response.headers["access-control-allow-origin"]).toBe(origin);
      expect(response.headers["access-control-allow-methods"]?.split(","))
        .toContain(method);
    },
  );
});
