import { readFileSync } from "node:fs";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UploadDropzone } from "../../src/features/files/components/upload-dropzone";
import { UploadQueue } from "../../src/features/files/components/upload-queue";
import { FileQueryToolbar } from "../../src/features/files/components/file-query-toolbar";
import { PermanentDeleteDialog } from "../../src/components/confirmation/permanent-delete-dialog";

/** Converts an sRGB channel into relative-luminance space. */
const linear = (channel: number) => {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

/** Calculates WCAG contrast for two six-digit hexadecimal colors. */
const contrast = (foreground: string, background: string) => {
  const luminance = (hex: string) => {
    const channels = [1, 3, 5].map((index) =>
      Number.parseInt(hex.slice(index, index + 2), 16),
    );
    return (
      0.2126 * linear(channels[0]!) +
      0.7152 * linear(channels[1]!) +
      0.0722 * linear(channels[2]!)
    );
  };
  const values = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a,
  );
  return (values[0]! + 0.05) / (values[1]! + 0.05);
};

describe("file-management accessibility", () => {
  it("keeps light-theme text contrast, visible focus, responsive rules, and reduced motion", () => {
    const css = readFileSync("client/src/app/globals.css", "utf8");
    expect(contrast("#171714", "#f6f3ea")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#68675f", "#f6f3ea")).toBeGreaterThanOrEqual(4.5);
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline:/s);
    expect(css).toContain("@media (max-width:760px)");
    expect(css).toContain("@media (prefers-reduced-motion:reduce)");
  });

  it("labels selection, announces progress/errors, and exposes keyboard-operable recovery", () => {
    const retry = vi.fn();
    render(
      <>
        <UploadDropzone onFiles={vi.fn()} error="Choose at most ten files" />
        <UploadQueue
          items={[
            {
              id: "one",
              file: new File(["x"], "one.txt"),
              status: "error",
              progress: 35,
              error: "Retry upload",
            },
          ]}
          onRetry={retry}
        />
      </>,
    );
    expect(screen.getByLabelText(/select files/i)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/at most ten/i);
    expect(screen.getByRole("list", { name: /upload queue/i })).toHaveAttribute(
      "aria-live",
      "polite",
    );
    const button = screen.getByRole("button", { name: /retry one.txt/i });
    button.focus();
    fireEvent.keyDown(button, { key: "Enter" });
    fireEvent.click(button);
    expect(retry).toHaveBeenCalledWith("one");
  });

  it("provides labeled responsive view controls and modal focus/error recovery", () => {
    const onView = vi.fn();
    render(
      <FileQueryToolbar
        query={{ page: 1, pageSize: 20 }}
        view="list"
        onChange={vi.fn()}
        onView={onView}
      />,
    );
    const grid = screen.getByRole("button", { name: "Grid" });
    fireEvent.click(grid);
    expect(onView).toHaveBeenCalledWith("grid");
    expect(screen.getByRole("button", { name: "List" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    render(
      <PermanentDeleteDialog
        open
        subject="report.txt"
        error="Deletion failed; retry."
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("alert")).toHaveTextContent(/retry/i);
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  });
});
