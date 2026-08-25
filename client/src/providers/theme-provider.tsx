"use client";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  readThemePreference,
  resolveTheme,
  writeThemePreference,
  type ThemePreference,
} from "../lib/theme/theme";

interface ThemeContextValue {
  preference: ThemePreference;
  setPreference: (value: ThemePreference) => void;
}
const ThemeContext = createContext<ThemeContextValue>({
  preference: "system",
  setPreference:
    /** Safely ignores selection outside the application provider. */ () =>
      undefined,
});

/** Keeps persisted theme selection synchronized with live system changes. */
export function ThemeProvider({ children }: PropsWithChildren) {
  const [preference, setPreference] = useState<ThemePreference>("system");
  useEffect(() => {
    const media =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-color-scheme: dark)")
        : undefined;
    const saved = readThemePreference();
    setPreference(saved);
    /** Applies the effective selection to document semantics. */
    const apply = () => {
      const effective = resolveTheme(saved, media?.matches ?? false);
      document.documentElement.dataset.theme = effective;
      document.documentElement.style.colorScheme = effective;
    };
    apply();
    media?.addEventListener("change", apply);
    return () => media?.removeEventListener("change", apply);
  }, [preference]);
  /** Persists a supported selection and triggers effective-theme recalculation. */
  const select = (value: ThemePreference) => {
    writeThemePreference(value);
    setPreference(value);
  };
  const value = useMemo(
    () => ({ preference, setPreference: select }),
    [preference],
  );
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/** Returns the current supported theme preference controls. */
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
