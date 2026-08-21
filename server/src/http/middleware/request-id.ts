import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";
/** Assigns or reflects a bounded correlation identifier for every request. */
export const requestId: RequestHandler = (request, response, next) => {
  const incoming = request.header("x-request-id");
  const value = incoming && incoming.length <= 128 ? incoming : randomUUID();
  response.locals.requestId = value;
  response.setHeader("x-request-id", value);
  next();
};
