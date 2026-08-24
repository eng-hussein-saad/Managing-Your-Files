import type { PrismaClient } from "@prisma/client";
import type { AdminRoleChange, AdminUserQuery } from "@gold-era/contracts/public";
import { isTransactionConflict, serializableOnce } from "../../infrastructure/persistence/transactions.js";
import type { Clock } from "../../infrastructure/runtime/clock.js";
import { AppError } from "../auth/auth.errors.js";
import type { AuditService } from "../audit/audit.service.js";
import { adminAudit } from "../audit/admin-audit.js";
import { toSafeUser } from "./user.mapper.js";
import { UserRepository } from "./user.repository.js";

/** Coordinates safe user administration without exposing persistence details. */
export class AdminUserService {
  /** Configures user administration over explicit transaction and audit boundaries. */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly audit: AuditService,
    private readonly clock: Clock,
    private readonly repository = new UserRepository(),
  ) {}
  /** Returns one deterministic user page without producing audit events. */
  async list(query: AdminUserQuery) {
    const page = await this.repository.adminList(this.prisma, query);
    return {
      data: page.rows.map(toSafeUser),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems: page.totalItems,
        totalPages: Math.ceil(page.totalItems / query.pageSize),
      },
    };
  }
  /** Returns one safe user detail without producing an audit event. */
  async detail(userId: string) {
    const user = await this.repository.adminDetail(this.prisma, userId);
    if (!user) throw new AppError(404, "RESOURCE_NOT_FOUND", "The user was not found.");
    return toSafeUser(user);
  }
  /** Changes a target role once with self, last-admin, and stale-state safeguards. */
  async changeRole(
    actorId: string,
    targetId: string,
    input: AdminRoleChange,
    requestId?: string,
  ) {
    if (actorId === targetId)
      throw new AppError(403, "AUTH_FORBIDDEN", "Administrators cannot change their own role.");
    let updated;
    try {
      updated = await serializableOnce(this.prisma, async (transaction) => {
      const target = await this.repository.lockedAdminTarget(transaction, targetId);
      if (!target)
        throw new AppError(404, "RESOURCE_NOT_FOUND", "The user was not found.");
      if (target.updatedAt.toISOString() !== input.expectedUpdatedAt)
        throw new AppError(409, "RESOURCE_CONFLICT", "The user changed. Reload and confirm again.");
      if (target.role === "ADMIN" && input.role === "USER") {
        const administrators = await this.repository.countAdministrators(transaction);
        if (administrators <= 1)
          throw new AppError(403, "AUTH_FORBIDDEN", "The last administrator cannot be demoted.");
      }
      if (target.role === input.role) return target;
      const result = await this.repository.updateRole(
        transaction,
        targetId,
        input.role,
        this.clock.now(),
      );
      await this.repository.removeRefreshSessions(transaction, targetId);
      return result;
      });
    } catch (error) {
      if (isTransactionConflict(error))
        throw new AppError(409, "RESOURCE_CONFLICT", "The user changed. Reload and confirm again.");
      throw error;
    }
    await this.audit.bestEffort(
      adminAudit("admin.user.role_changed", actorId, "USER", targetId, requestId),
    );
    return toSafeUser(updated);
  }
}
