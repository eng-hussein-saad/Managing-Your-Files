import { z } from "zod";
export const folderIdSchema = z.uuid();
/** Rejects path separators and control characters from display-only folder names. */
function hasSafeFolderCharacters(value: string): boolean {
  return ![...value].some((character) => {
    const code = character.codePointAt(0) ?? 0;
    return character === "/" || character === "\\" || code < 32 || code === 127;
  });
}
export const folderNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .refine(
    hasSafeFolderCharacters,
    "Folder names cannot contain path separators or control characters",
  );
export const createFolderSchema = z
  .object({ name: folderNameSchema, parentId: z.uuid().nullable() })
  .strict();
export const renameFolderSchema = z.object({ name: folderNameSchema }).strict();
export const moveFileSchema = z
  .object({ folderId: z.uuid().nullable() })
  .strict();
export const folderListQuerySchema = z
  .object({ parentId: z.uuid().optional() })
  .strict();
