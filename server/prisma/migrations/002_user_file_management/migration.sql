-- Approved lifecycle-only Phase 2 migration.
-- Refuse to discard legacy soft-delete data: an operator must resolve it first.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "FILE" WHERE "deletedAt" IS NOT NULL) THEN
    RAISE EXCEPTION 'Cannot remove FILE.deletedAt while legacy soft-deleted rows exist';
  END IF;
  IF EXISTS (SELECT 1 FROM "FOLDER" WHERE "deletedAt" IS NOT NULL) THEN
    RAISE EXCEPTION 'Cannot remove FOLDER.deletedAt while legacy soft-deleted rows exist';
  END IF;
END $$;

ALTER TABLE "USER" ADD COLUMN "deletedAt" TIMESTAMPTZ(3);
ALTER TABLE "FILE" DROP COLUMN "deletedAt";
ALTER TABLE "FOLDER" DROP COLUMN "deletedAt";
