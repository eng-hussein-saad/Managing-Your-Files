import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../../src/providers/theme-provider";
import { ThemeSelector } from "../../src/components/theme/theme-selector";

/** Installs a controllable system color-scheme boundary for theme tests. */
function installMatchMedia(initial = false) {
  let listener: (() => void) | undefined;
  const media = {
    matches: initial,
    addEventListener: vi.fn((_name: string, next: () => void) => {
      listener = next;
    }),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => media),
  );
  return { media, change: () => listener?.() };
}

describe("theme provider and selector", () => {
  it("cycles through system, light, and dark using the approved toggle", async () => {
    installMatchMedia();
    render(
      <ThemeProvider>
        <ThemeSelector />
      </ThemeProvider>,
    );
    const toggle = screen.getByRole("button", { name: /Appearance: System/i });
    fireEvent.click(toggle);
    await waitFor(() =>
      expect(toggle).toHaveAccessibleName(/Appearance: Light/i),
    );
    fireEvent.click(toggle);
    await waitFor(() =>
      expect(toggle).toHaveAccessibleName(/Appearance: Dark/i),
    );
    fireEvent.click(toggle);
    await waitFor(() =>
      expect(toggle).toHaveAccessibleName(/Appearance: System/i),
    );
  });
  it("persists explicit selection and applies it accessibly", async () => {
    installMatchMedia();
    render(
      <ThemeProvider>
        <ThemeSelector />
      </ThemeProvider>,
    );
    const toggle = screen.getByRole("button", { name: /Appearance: System/i });
    fireEvent.click(toggle);
    fireEvent.click(toggle);
    await waitFor(() =>
      expect(document.documentElement.dataset.theme).toBe("dark"),
    );
    expect(localStorage.getItem("fileora:theme")).toBe("dark");
  });
  it("follows live system changes while system remains saved", async () => {
    localStorage.setItem("fileora:theme", "system");
    const system = installMatchMedia(false);
    render(
      <ThemeProvider>
        <ThemeSelector />
      </ThemeProvider>,
    );
    await waitFor(() =>
      expect(document.documentElement.dataset.theme).toBe("light"),
    );
    system.media.matches = true;
    system.change();
    await waitFor(() =>
      expect(document.documentElement.dataset.theme).toBe("dark"),
    );
    expect(
      screen.getByRole("button", { name: /Appearance: System/i }),
    ).toBeVisible();
  });

  it("exposes token schemes and disables nonessential reduced-motion animation", () => {
    const styles = readFileSync(
      resolve(process.cwd(), "client/src/app/globals.css"),
      "utf8",
    );
    expect(styles).toMatch(/:root\s*\{[^}]*--color-text:/s);
    expect(styles).toMatch(
      /:root\[data-theme="dark"\]\s*\{[^}]*--color-text:/s,
    );
    expect(styles).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*animation-duration:\s*0\.01ms/,
    );
  });
});
