import express, { type Express } from "express";
import type { PrismaClient } from "@prisma/client";
import type { ServerEnv } from "./config/env.js";
import type { MailPort } from "./modules/auth/ports/mail.port.js";
import { durationSeconds } from "./config/env.js";
import { systemClock } from "./infrastructure/runtime/clock.js";
import { systemIdentifiers } from "./infrastructure/runtime/identifiers.js";
import { passwordHasher } from "./infrastructure/security/password-hasher.js";
import { createAccessTokenService } from "./infrastructure/security/access-tokens.js";
import { logger } from "./infrastructure/observability/logger.js";
import { AuditService } from "./modules/audit/audit.service.js";
import { RegistrationService } from "./modules/auth/registration.service.js";
import { VerificationService } from "./modules/auth/verification.service.js";
import { VerificationResendService } from "./modules/auth/verification-resend.service.js";
import { LoginService } from "./modules/auth/login.service.js";
import { RefreshService } from "./modules/auth/refresh.service.js";
import { LogoutService } from "./modules/auth/logout.service.js";
import { registrationController } from "./http/controllers/registration.controller.js";
import { trustedAuthController } from "./http/controllers/trusted-auth.controller.js";
import { profileController } from "./http/controllers/profile.controller.js";
import { adminAccessController } from "./http/controllers/admin.controller.js";
import { requestId } from "./http/middleware/request-id.js";
import { exactOriginCors } from "./http/middleware/cors.js";
import { requireBffTrust } from "./http/middleware/bff-trust.js";
import { authenticate } from "./http/middleware/authenticate.js";
import { requireAdmin } from "./http/middleware/authorize-role.js";
import { errorHandler, notFound } from "./http/middleware/errors.js";
import { healthRoutes } from "./http/routes/health.routes.js";
import { authPublicRoutes } from "./http/routes/auth-public.routes.js";
import { authInternalRoutes } from "./http/routes/auth-internal.routes.js";
import { userRoutes } from "./http/routes/user.routes.js";
import { adminRoutes } from "./http/routes/admin.routes.js";
import { fileRoutes } from "./http/routes/file.routes.js";
import { fileUploadController } from "./http/controllers/file-upload.controller.js";
import { UploadFileService } from "./modules/files/services/upload-file.service.js";
import { FindFilesService } from "./modules/files/services/find-files.service.js";
import { fileQueryController } from "./http/controllers/file-query.controller.js";
import { GetFileContentService } from "./modules/files/services/get-file-content.service.js";
import { fileContentController } from "./http/controllers/file-content.controller.js";
import { DeleteFileService } from "./modules/files/services/delete-file.service.js";
import { fileDeleteController } from "./http/controllers/file-delete.controller.js";
import { folderController } from "./http/controllers/folder.controller.js";
import { folderRoutes } from "./http/routes/folder.routes.js";
import { ManageFoldersService } from "./modules/folders/services/manage-folders.service.js";
import { fileStatisticsController } from "./http/controllers/file-statistics.controller.js";
import { fileStatisticsRoutes } from "./http/routes/file-statistics.routes.js";
import { FileStatisticsService } from "./modules/statistics/file-statistics.service.js";
import { MoveFileService } from "./modules/files/services/move-file.service.js";
import { fileMoveController } from "./http/controllers/file-move.controller.js";
import { DeleteFolderService } from "./modules/folders/services/delete-folder.service.js";
import type { StoragePort } from "./modules/files/ports/storage.port.js";
import type { ExtractionPort } from "./modules/files/ports/extraction.port.js";
import { AdminUserService } from "./modules/users/admin-user.service.js";
import { AdminUserDeletionService } from "./modules/users/admin-user-deletion.service.js";
import { adminUserController } from "./http/controllers/admin-user.controller.js";
import { AdminFileService } from "./modules/files/services/admin-file.service.js";
import { adminFileController } from "./http/controllers/admin-file.controller.js";
import { AdminStatisticsService } from "./modules/statistics/admin-statistics.service.js";
import { adminMonitoringController } from "./http/controllers/admin-monitoring.controller.js";

export interface FileManagementDependencies {
  storage?: StoragePort;
  extractor?: ExtractionPort;
  audit?: AuditService;
  authenticatedUserId?: string;
  authenticatedRole?: "USER" | "ADMIN";
}

/** Composes the Express boundary around independently testable services. */
export function createApp(
  env: ServerEnv,
  prisma: PrismaClient,
  mailer: MailPort,
  fileManagement: FileManagementDependencies = {},
): Express {
  const accessTtl = durationSeconds(env.ACCESS_TOKEN_TTL);
  const refreshTtl = durationSeconds(env.REFRESH_TOKEN_TTL);
  const accessTokens = createAccessTokenService(
    env.JWT_ACCESS_SECRET,
    "gold-era-api",
    "gold-era-browser",
    accessTtl,
  );
  const audit =
    fileManagement.audit ?? new AuditService(prisma, systemClock, logger);
  const registration = new RegistrationService(
    prisma,
    systemClock,
    systemIdentifiers,
    passwordHasher,
    mailer,
  );
  const verification = new VerificationService(
    prisma,
    systemClock,
    passwordHasher,
  );
  const resend = new VerificationResendService(
    prisma,
    systemClock,
    systemIdentifiers,
    passwordHasher,
    mailer,
  );
  const login = new LoginService(
    prisma,
    systemClock,
    systemIdentifiers,
    passwordHasher,
    accessTokens,
    accessTtl,
    refreshTtl,
  );
  const refresh = new RefreshService(
    prisma,
    systemClock,
    systemIdentifiers,
    accessTokens,
    accessTtl,
    refreshTtl,
  );
  const logout = new LogoutService(prisma, systemClock);
  const adminDeletion = fileManagement.storage
    ? new AdminUserDeletionService(prisma, fileManagement.storage, audit)
    : undefined;
  const adminFileDeletion = fileManagement.storage
    ? new DeleteFileService(prisma, fileManagement.storage, audit)
    : undefined;
  const adminUsers = adminUserController(
    new AdminUserService(prisma, audit, systemClock),
    adminDeletion,
  );
  const adminFiles = adminFileController(
    new AdminFileService(prisma, adminFileDeletion),
  );
  const adminMonitoring = adminMonitoringController(
    new AdminStatisticsService(prisma),
    audit,
  );
  const registrationHandlers = registrationController(
    registration,
    verification,
    resend,
  );
  const trustedHandlers = trustedAuthController(login, refresh, logout);
  /** Uses an explicit deterministic identity only in an injected test harness. */
  const bearer: ReturnType<typeof authenticate> =
    fileManagement.authenticatedUserId
      ? (_request, response, next) => {
          response.locals.identity = {
            subject: fileManagement.authenticatedUserId,
            role: fileManagement.authenticatedRole ?? "USER",
          };
          next();
        }
      : authenticate(accessTokens, prisma);
  const app = express();
  app.set("fileManagement", fileManagement);
  app.disable("x-powered-by");
  app.use(requestId);
  app.use(
    exactOriginCors(
      env.CORS_ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()),
    ),
  );
  app.use(express.json({ limit: "32kb", strict: true }));
  if (fileManagement.storage && fileManagement.extractor) {
    const upload = new UploadFileService(
      prisma,
      fileManagement.storage,
      fileManagement.extractor,
      audit,
      systemClock,
      systemIdentifiers,
      env.FILE_EXTRACTION_MAX_BYTES,
    );
    const uploadController = fileUploadController(upload, {
      maxFileSizeBytes: env.UPLOAD_MAX_FILE_SIZE_BYTES.toString(),
      maxFilesPerBatch: env.UPLOAD_MAX_FILES_PER_BATCH,
      allowedMimeTypes: env.UPLOAD_ALLOWED_MIME_TYPES,
    });
    app.use(
      "/api/v1/files",
      fileRoutes(
        bearer,
        uploadController,
        fileQueryController(new FindFilesService(prisma)),
        fileContentController(
          new GetFileContentService(prisma, fileManagement.storage),
        ),
        fileDeleteController(
          new DeleteFileService(prisma, fileManagement.storage, audit),
        ),
        fileMoveController(new MoveFileService(prisma, systemClock, audit)),
      ),
    );
    app.use(
      "/api/v1/folders",
      folderRoutes(
        bearer,
        folderController(
          new ManageFoldersService(
            prisma,
            systemClock,
            systemIdentifiers,
            audit,
          ),
          new DeleteFolderService(prisma, audit),
        ),
      ),
    );
    app.use(
      "/api/v1/file-statistics",
      fileStatisticsRoutes(
        bearer,
        fileStatisticsController(new FileStatisticsService(prisma)),
      ),
    );
  }
  app.use(healthRoutes());
  app.use("/api/v1/auth", authPublicRoutes(registrationHandlers));
  app.use(
    "/internal/v1/auth",
    requireBffTrust(env.BFF_SHARED_SECRET),
    authInternalRoutes(trustedHandlers),
  );
  app.use("/api/v1/users", userRoutes(bearer, profileController(prisma)));
  app.use(
    "/api/v1/admin",
    adminRoutes(
      bearer,
      requireAdmin(),
      adminAccessController,
      adminUsers,
      adminFiles,
      adminMonitoring,
    ),
  );
  app.use(notFound);
  app.use(errorHandler(logger));
  return app;
}
