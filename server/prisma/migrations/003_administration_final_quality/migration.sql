DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "USER" WHERE "deletedAt" IS NOT NULL) THEN
    RAISE EXCEPTION 'Cannot remove USER.deletedAt while legacy lifecycle values exist';
  END IF;
END $$;

ALTER TABLE "USER" DROP COLUMN "deletedAt";
