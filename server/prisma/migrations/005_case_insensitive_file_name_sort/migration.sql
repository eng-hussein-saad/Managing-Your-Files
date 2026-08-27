ALTER TABLE "FILE"
ADD COLUMN "originalNameSortKey" TEXT
GENERATED ALWAYS AS (lower("originalName")) STORED;

DROP INDEX "FILE_ownerId_folderId_originalName_id_idx";

CREATE INDEX "FILE_ownerId_folderId_originalNameSortKey_id_idx"
ON "FILE"("ownerId", "folderId", "originalNameSortKey", "id");
