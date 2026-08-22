import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PermanentDeleteDialog } from "../../src/components/confirmation/permanent-delete-dialog";

describe("irreversible confirmation", () => {
  it("changes nothing on cancel and restores focus", () => {
    const cancel = vi.fn();
    const trigger = document.createElement("button");
    document.body.append(trigger);
    trigger.focus();
    const { rerender } = render(
      <PermanentDeleteDialog
        open
        subject="report.txt"
        onCancel={cancel}
        onConfirm={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(cancel).toHaveBeenCalled();
    rerender(
      <PermanentDeleteDialog
        open={false}
        subject="report.txt"
        onCancel={cancel}
        onConfirm={vi.fn()}
      />,
    );
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
  it("announces retry guidance and disables actions while pending", () => {
    render(
      <PermanentDeleteDialog
        open
        subject="folder"
        pending
        error="Folder is not empty"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/not empty/i);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /deleting/i })).toBeDisabled();
  });
  it("requires a distinct permanent-delete confirmation action", () => {
    const confirm = vi.fn();
    render(
      <PermanentDeleteDialog
        open
        subject="report.txt"
        onCancel={vi.fn()}
        onConfirm={confirm}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /delete permanently/i }),
    );
    expect(confirm).toHaveBeenCalledOnce();
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });
});
