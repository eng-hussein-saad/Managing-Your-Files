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

/** Composes the Express boundary around independently testable services. */
export function createApp(
  env: ServerEnv,
  prisma: PrismaClient,
  mailer: MailPort,
): Express {
  const accessTtl = durationSeconds(env.ACCESS_TOKEN_TTL);
  const refreshTtl = durationSeconds(env.REFRESH_TOKEN_TTL);
  const accessTokens = createAccessTokenService(
    env.JWT_ACCESS_SECRET,
    "gold-era-api",
    "gold-era-browser",
    accessTtl,
  );
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
  const logout = new LogoutService(prisma, systemClock, logger);
  const audit = new AuditService(prisma, systemClock, logger);
  const registrationHandlers = registrationController(
    registration,
    verification,
    resend,
  );
  const trustedHandlers = trustedAuthController(login, refresh, logout);
  const bearer = authenticate(accessTokens);
  const app = express();
  app.disable("x-powered-by");
  app.use(requestId);
  app.use(
    exactOriginCors(
      env.CORS_ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()),
    ),
  );
  app.use(express.json({ limit: "32kb", strict: true }));
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
    adminRoutes(bearer, requireAdmin(audit), adminAccessController),
  );
  app.use(notFound);
  app.use(errorHandler(logger));
  return app;
}
