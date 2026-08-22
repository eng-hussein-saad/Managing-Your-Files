import type { PrismaClient } from "@prisma/client";
import type { ServerEnv } from "../../src/config/env.js";
import { createApp } from "../../src/app.js";
import { FakeMailer } from "../fakes/fake-mailer.js";
import type { FileManagementDependencies } from "../../src/app.js";
/** Creates an Express test harness with deterministic in-process mail capture. */
export function testApp(
  env: ServerEnv,
  prisma: PrismaClient,
  fileManagement: FileManagementDependencies = {},
) {
  const mailer = new FakeMailer();
  return { app: createApp(env, prisma, mailer, fileManagement), mailer };
}
