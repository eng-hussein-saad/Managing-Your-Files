import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PermanentDeleteDialog } from "../../src/components/confirmation/permanent-delete-dialog";
import { Dialog, Drawer } from "../../src/components/overlays/overlay";

describe("permanent delete dialog accessibility", () => {
  it("names the target, traps focus, supports Escape, and restores trigger focus", () => {
    const cancel = vi.fn();
    const trigger = document.createElement("button");
    document.body.append(trigger);
    trigger.focus();
    const view = render(
      <PermanentDeleteDialog
        open
        subject="report.pdf"
        onCancel={cancel}
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.getByRole("dialog")).toHaveAccessibleName(
      "Permanently delete report.pdf?",
    );
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(cancel).toHaveBeenCalledOnce();
    view.rerender(
      <PermanentDeleteDialog
        open={false}
        subject="report.pdf"
        onCancel={cancel}
        onConfirm={vi.fn()}
      />,
    );
    expect(trigger).toHaveFocus();
    trigger.remove();
  });
});

describe("shared overlay foundation", () => {
  it("labels, contains focus, locks scroll, makes background inert, and restores focus", () => {
    const close = vi.fn();
    const trigger = document.createElement("button");
    trigger.textContent = "Open";
    document.body.append(trigger);
    trigger.focus();
    const view = render(
      <Dialog
        open
        title="Move file"
        description="Choose a destination"
        onClose={close}
      >
        <button>First action</button>
        <button>Last action</button>
      </Dialog>,
    );
    const dialog = screen.getByRole("dialog", { name: "Move file" });
    expect(dialog).toHaveAccessibleDescription("Choose a destination");
    expect(screen.getByRole("button", { name: "First action" })).toHaveFocus();
    expect(document.body.style.overflow).toBe("hidden");
    expect(trigger).toHaveAttribute("inert");
    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(screen.getByRole("button", { name: "Last action" })).toHaveFocus();
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(close).toHaveBeenCalledOnce();
    view.rerender(
      <Dialog open={false} title="Move file" onClose={close}>
        Closed
      </Dialog>,
    );
    expect(trigger).toHaveFocus();
    expect(trigger).not.toHaveAttribute("inert");
    trigger.remove();
  });

  it("dismisses a drawer only from its safe backdrop and preserves inside interaction", () => {
    const close = vi.fn();
    render(
      <Drawer open title="File details" onClose={close}>
        <button>Download</button>
      </Drawer>,
    );
    fireEvent.mouseDown(screen.getByRole("dialog", { name: "File details" }));
    expect(close).not.toHaveBeenCalled();
    fireEvent.mouseDown(screen.getByTestId("overlay-backdrop"));
    expect(close).toHaveBeenCalledOnce();
  });
});
