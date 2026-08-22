/** Provides stable folder cache keys. */
export const folderKeys = {
  all: ["folders"] as const,
  contents:
    /** Implements the contents callback for this configured operation. */ (
      parentId: string | null,
    ) => ["folders", "contents", parentId ?? "root"] as const,
};
