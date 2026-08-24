/** Formats an ISO timestamp with the user's locale and timezone. */
export function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

/** Formats an integer count without unsafe number coercion. */
export function formatCount(value: number): string {
  return new Intl.NumberFormat().format(value);
}

/** Formats a decimal byte count with binary units while retaining large-value safety. */
export function formatBytes(value: string): string {
  const bytes = BigInt(value);
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  let unit = 0;
  let scaled = bytes;
  while (scaled >= 1024n && unit < units.length - 1) {
    scaled /= 1024n;
    unit += 1;
  }
  return `${new Intl.NumberFormat().format(scaled)} ${units[unit]}`;
}

/** Describes a bounded page for assistive and visual status text. */
export function formatPage(page: number, totalPages: number): string {
  return `Page ${page} of ${Math.max(totalPages, 1)}`;
}
