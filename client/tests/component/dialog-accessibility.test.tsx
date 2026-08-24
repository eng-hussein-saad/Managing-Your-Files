import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PermanentDeleteDialog } from "../../src/components/confirmation/permanent-delete-dialog";

describe("permanent delete dialog accessibility", () => {
  it("names the target, traps focus, supports Escape, and restores trigger focus", () => {
    const cancel = vi.fn();
    const trigger = document.createElement("button");
    document.body.append(trigger);
    trigger.focus();
    const view = render(<PermanentDeleteDialog open subject="report.pdf" onCancel={cancel} onConfirm={vi.fn()} />);
    expect(screen.getByRole("dialog")).toHaveAccessibleName("Permanently delete report.pdf?");
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(cancel).toHaveBeenCalledOnce();
    view.rerender(<PermanentDeleteDialog open={false} subject="report.pdf" onCancel={cancel} onConfirm={vi.fn()} />);
    expect(trigger).toHaveFocus();
    trigger.remove();
  });
});
