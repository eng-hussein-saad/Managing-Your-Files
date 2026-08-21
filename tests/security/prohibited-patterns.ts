import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export const prohibitedValues = [
  /Bearer\s+[A-Za-z0-9._-]{40,}/,
  /postgres(?:ql)?:\/\/[^\s"']+:[^\s"']+@/,
  /"refreshToken"\s*:\s*"[A-Za-z0-9_-]{40,}"/,
  /"code"\s*:\s*"\d{8}"/,
];
/** Recursively returns text files under existing scan roots while excluding dependencies and maps. */
export function scanFiles(
  roots: string[],
): Array<{ path: string; content: string }> {
  const output: Array<{ path: string; content: string }> = [];
  const visit = (path: string) => {
    let stat;
    try {
      stat = statSync(path);
    } catch {
      return;
    }
    if (stat.isDirectory()) {
      if (path.includes("node_modules") || path.includes(".git")) return;
      for (const entry of readdirSync(path)) visit(join(path, entry));
      return;
    }
    if (path.endsWith(".map") || stat.size > 2_000_000) return;
    try {
      output.push({ path, content: readFileSync(path, "utf8") });
    } catch {
      /* Binary artifacts are not text-scanned. */
    }
  };
  roots.forEach(visit);
  return output;
}
