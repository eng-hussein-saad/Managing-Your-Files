import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PageState } from "../../src/components/status/page-state";
import { ErrorPanel } from "../../src/components/status/error-panel";
import { PermanentDeleteDialog } from "../../src/components/confirmation/permanent-delete-dialog";

describe("shared asynchronous workflow states", () => {
  it.each([
    ["Loading files", true, "neutral"],
    ["No matching files", false, "empty"],
    ["Changes saved", false, "success"],
    ["Request failed", false, "error"],
  ] as const)("renders %s with its state semantics", (title, busy, tone) => {
    const view = render(<PageState title={title} busy={busy} tone={tone} />);
    expect(screen.getByRole(tone === "error" ? "alert" : "status")).toHaveTextContent(title);
    view.unmount();
  });
  it("offers retry for recoverable failures", () => {
    render(<ErrorPanel message="Try the request again." retry={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
  });
  it("names destructive targets and communicates pending work", () => {
    render(<PermanentDeleteDialog open subject="account@example.invalid" pending onCancel={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByRole("dialog")).toHaveAccessibleName(/account@example.invalid/);
    expect(screen.getByRole("button", { name: "Deleting…" })).toBeDisabled();
  });
});
