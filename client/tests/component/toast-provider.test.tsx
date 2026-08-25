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

/** Emits more notices than the bounded visible queue permits. */
function ToastBurstHarness() {
  const { notify } = useToast();
  return (
    <button
      onClick={() => {
        for (let index = 1; index <= 5; index += 1)
          notify(`Notice ${index}`, { duration: 0 });
      }}
    >
      Notify five
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

  it("keeps announcements atomic and bounds the visible queue", () => {
    render(
      <ToastProvider>
        <ToastBurstHarness />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Notify five" }));
    expect(screen.getAllByRole("status")).toHaveLength(4);
    expect(screen.getAllByRole("status")[0]).toHaveAttribute(
      "aria-atomic",
      "true",
    );
    expect(screen.queryByText("Notice 1")).toBeNull();
  });
});
