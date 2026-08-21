import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageState } from "../../src/components/status/page-state";
describe("protected authentication states", () => {
  it("explains anonymous and loading outcomes", () => {
    const { rerender } = render(
      <PageState title="Restoring your session" busy />,
    );
    expect(screen.getByRole("heading")).toHaveTextContent("Restoring");
    rerender(<PageState title="Sign in to continue" />);
    expect(screen.getByRole("heading")).toHaveTextContent("Sign in");
  });
});
