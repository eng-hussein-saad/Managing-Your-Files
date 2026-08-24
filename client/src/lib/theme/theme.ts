export const themeStorageKey = "fileora:theme";
export type ThemePreference = "light" | "dark" | "system";
export type EffectiveTheme = "light" | "dark";

/** Parses only the three supported persisted theme values. */
export function parseThemePreference(value: unknown): ThemePreference {
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

/** Resolves a saved preference against the current operating-system scheme. */
export function resolveTheme(preference: ThemePreference, systemDark: boolean): EffectiveTheme {
  return preference === "system" ? (systemDark ? "dark" : "light") : preference;
}

/** Reads browser theme storage safely when it is unavailable or inaccessible. */
export function readThemePreference(): ThemePreference {
  try {
    return parseThemePreference(window.localStorage.getItem(themeStorageKey));
  } catch {
    return "system";
  }
}

/** Writes browser theme storage without disrupting the interface on access failure. */
export function writeThemePreference(preference: ThemePreference): void {
  try {
    window.localStorage.setItem(themeStorageKey, preference);
  } catch {
    /* Browser storage is an optional non-sensitive preference boundary. */
  }
}
