CREATE INDEX "USER_createdAt_id_idx" ON "USER"("createdAt", "id");
CREATE INDEX "USER_role_isEmailVerified_idx" ON "USER"("role", "isEmailVerified");

CREATE INDEX "VERIFICATION_CODE_userId_createdAt_idx" ON "VERIFICATION_CODE"("userId", "createdAt");
CREATE INDEX "VERIFICATION_CODE_userId_expiresAt_idx" ON "VERIFICATION_CODE"("userId", "expiresAt");

CREATE UNIQUE INDEX "REFRESH_TOKEN_tokenHash_key" ON "REFRESH_TOKEN"("tokenHash");
CREATE INDEX "REFRESH_TOKEN_userId_idx" ON "REFRESH_TOKEN"("userId");
CREATE INDEX "REFRESH_TOKEN_expiresAt_idx" ON "REFRESH_TOKEN"("expiresAt");

CREATE INDEX "FOLDER_ownerId_parentId_name_idx" ON "FOLDER"("ownerId", "parentId", "name");
CREATE INDEX "FOLDER_parentId_idx" ON "FOLDER"("parentId");

CREATE INDEX "FILE_ownerId_createdAt_id_idx" ON "FILE"("ownerId", "createdAt", "id");
CREATE INDEX "FILE_ownerId_folderId_originalName_id_idx" ON "FILE"("ownerId", "folderId", "originalName", "id");
CREATE INDEX "FILE_ownerId_mimeType_idx" ON "FILE"("ownerId", "mimeType");
CREATE INDEX "FILE_createdAt_id_idx" ON "FILE"("createdAt", "id");
CREATE INDEX "FILE_folderId_idx" ON "FILE"("folderId");

CREATE INDEX "AUDIT_LOG_createdAt_id_idx" ON "AUDIT_LOG"("createdAt", "id");
CREATE INDEX "AUDIT_LOG_actorId_createdAt_idx" ON "AUDIT_LOG"("actorId", "createdAt");
CREATE INDEX "AUDIT_LOG_action_createdAt_idx" ON "AUDIT_LOG"("action", "createdAt");
