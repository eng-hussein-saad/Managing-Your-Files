import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../../src/providers/theme-provider";
import { ThemeSelector } from "../../src/components/theme/theme-selector";

/** Installs a controllable system color-scheme boundary for theme tests. */
function installMatchMedia(initial = false) {
  let listener: (() => void) | undefined;
  const media = { matches: initial, addEventListener: vi.fn((_name: string, next: () => void) => { listener = next; }), removeEventListener: vi.fn() };
  vi.stubGlobal("matchMedia", vi.fn(() => media));
  return { media, change: () => listener?.() };
}

describe("theme provider and selector", () => {
  it("persists explicit selection and applies it accessibly", async () => {
    installMatchMedia();
    render(<ThemeProvider><ThemeSelector /></ThemeProvider>);
    fireEvent.change(screen.getByLabelText("Theme"), { target: { value: "dark" } });
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    expect(localStorage.getItem("fileora:theme")).toBe("dark");
  });
  it("follows live system changes while system remains saved", async () => {
    localStorage.setItem("fileora:theme", "system");
    const system = installMatchMedia(false);
    render(<ThemeProvider><ThemeSelector /></ThemeProvider>);
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("light"));
    system.media.matches = true;
    system.change();
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    expect(screen.getByLabelText("Theme")).toHaveValue("system");
  });
});
