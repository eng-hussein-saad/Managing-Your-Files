"use client";
import { useTheme } from "../../providers/theme-provider";

/** Offers an accessible keyboard-native light, dark, and system selector. */
export function ThemeSelector() {
  const theme = useTheme();
  return <label className="theme-selector"><span className="sr-only">Theme</span><select aria-label="Theme" value={theme.preference} onChange={(event) => theme.setPreference(event.target.value as "light" | "dark" | "system")}><option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option></select></label>;
}
