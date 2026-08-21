import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormStatus } from "../../src/components/auth/form-status";
describe("registration flow outcomes", () => {
  it("announces delivery-pending failures and verification success", () => {
    const { rerender } = render(
      <FormStatus kind="error" message="Delivery is pending." />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Delivery is pending.");
    rerender(<FormStatus kind="success" message="Verified." />);
    expect(screen.getByRole("status")).toHaveTextContent("Verified.");
  });
});
