import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageState } from "../../src/components/status/page-state";
describe("administrator states", () => {
  it.each([
    "Checking administrator access",
    "Sign in to continue",
    "You do not have permission",
  ])("presents %s", (title) => {
    const { unmount } = render(<PageState title={title} />);
    expect(screen.getByRole("heading")).toHaveTextContent(title);
    unmount();
  });
});
