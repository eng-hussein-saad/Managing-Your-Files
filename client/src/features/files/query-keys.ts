/** Keeps file-related query cache keys stable and scoped. */
export const fileKeys = {
  all: ["files"] as const,
  list: /** Implements the list callback for this configured operation. */ (
    params: object,
  ) => ["files", "list", params] as const,
  detail: /** Implements the detail callback for this configured operation. */ (
    id: string,
  ) => ["files", "detail", id] as const,
};
