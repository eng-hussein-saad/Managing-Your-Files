import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ToastProvider,
  useToast,
} from "../../src/components/toast/toast-provider";

/** Exposes toast controls for component-level interaction coverage. */
function ToastHarness() {
  const { notify } = useToast();
  return (
    <button onClick={() => notify("Saved successfully.", { kind: "success" })}>
      Notify
    </button>
  );
}

describe("toast notifications", () => {
  it("announces and dismisses a notification", () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Notify" }));
    expect(screen.getByRole("status")).toHaveTextContent("Saved successfully.");

    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss notification" }),
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
