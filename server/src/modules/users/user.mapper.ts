import type { User } from "@prisma/client";
import type { SafeUser } from "@gold-era/contracts/public";

/** Removes password persistence fields and serializes timestamps for public use. */
export function toSafeUser(user: User): SafeUser {
  if (user.role !== "USER" && user.role !== "ADMIN")
    throw new Error("Unsupported persisted role");
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
