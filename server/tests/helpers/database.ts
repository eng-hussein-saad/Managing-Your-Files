import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { PrismaClient } from "@prisma/client";
const execFileAsync = promisify(execFile);
/** Deploys canonical migrations into a disposable configured PostgreSQL database. */
export async function deployMigrations(): Promise<void> {
  await execFileAsync("pnpm", ["--filter", "server", "prisma:migrate:deploy"]);
}
/** Clears all canonical rows in foreign-key-safe order for integration isolation. */
export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.auditLog.deleteMany();
  await prisma.verificationCode.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.file.deleteMany();
  await prisma.folder.deleteMany();
  await prisma.user.deleteMany();
}
