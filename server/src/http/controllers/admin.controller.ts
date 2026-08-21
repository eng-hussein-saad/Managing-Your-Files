import type { RequestHandler } from "express";
import { success } from "../respond.js";
/** Confirms that server-side administrator authorization succeeded. */
export const adminAccessController: RequestHandler = (_request, response) =>
  success(response, 200, { allowed: true });
