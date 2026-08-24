/** Keeps administrator caches complete, normalized, and independently invalidatable. */
export const adminKeys = {
  all: ["admin"] as const,
  users: /** Builds the shared administrator-user cache prefix. */ () => ["admin", "users"] as const,
  userList: /** Builds one normalized administrator-user page key. */ (query: object) =>
    ["admin", "users", "list", query] as const,
  userDetail: /** Builds one administrator-user detail key. */ (id: string) =>
    ["admin", "users", "detail", id] as const,
  files: /** Builds the shared global-file cache prefix. */ () => ["admin", "files"] as const,
  fileList: /** Builds one normalized global-file page key. */ (query: object) =>
    ["admin", "files", "list", query] as const,
  fileDetail: /** Builds one global-file detail key. */ (id: string) =>
    ["admin", "files", "detail", id] as const,
  statistics: /** Builds the exact platform-statistics key. */ () =>
    ["admin", "statistics"] as const,
  audit: /** Builds the shared audit-history prefix. */ () => ["admin", "audit"] as const,
  auditList: /** Builds one normalized audit-history page key. */ (query: object) =>
    ["admin", "audit", query] as const,
};
