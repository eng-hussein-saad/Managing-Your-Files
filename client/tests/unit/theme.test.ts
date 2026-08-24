import { describe, expect, it, vi } from "vitest";
import { parseThemePreference, readThemePreference, resolveTheme, themeStorageKey } from "../../src/lib/theme/theme";

describe("theme preference resolution", () => {
  it.each([["light", "light"], ["dark", "dark"], ["system", "system"], ["invalid", "system"], [null, "system"]])("parses %s", (input, expected) => {
    expect(parseThemePreference(input)).toBe(expected);
  });
  it("resolves system while preserving the saved system selection", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });
  it("falls back safely when storage is inaccessible", () => {
    vi.stubGlobal("window", { localStorage: { getItem: () => { throw new Error("denied"); } } });
    expect(readThemePreference()).toBe("system");
    expect(themeStorageKey).toBe("fileora:theme");
    vi.unstubAllGlobals();
  });
});
