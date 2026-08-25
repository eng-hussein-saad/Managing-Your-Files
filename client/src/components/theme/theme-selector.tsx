"use client";
import { useTheme } from "../../providers/theme-provider";
import { MonitorIcon, MoonIcon, SunIcon } from "../ui/icons";

const appearanceOrder = ["system", "light", "dark"] as const;

/** Offers the approved single-action light, dark, and system cycle control. */
export function ThemeSelector() {
  const theme = useTheme();
  const index = appearanceOrder.indexOf(theme.preference);
  const next =
    appearanceOrder[(index + 1) % appearanceOrder.length] ?? "system";
  const label =
    theme.preference === "system"
      ? "System"
      : theme.preference === "light"
        ? "Light"
        : "Dark";
  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label={`Appearance: ${label}. Activate to use ${next}.`}
      title={`Appearance: ${label}`}
      onClick={
        /** Advances through the exact appearance order defined by the approved reference. */ () =>
          theme.setPreference(next)
      }
    >
      {theme.preference === "system" ? (
        <MonitorIcon />
      ) : theme.preference === "light" ? (
        <SunIcon />
      ) : (
        <MoonIcon />
      )}
      <span>{label}</span>
    </button>
  );
}
