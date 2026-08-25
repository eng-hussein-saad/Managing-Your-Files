import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormStatus } from "../../src/components/auth/form-status";
import { AuthForm } from "../../src/components/auth/auth-form";
describe("registration flow outcomes", () => {
  it("announces delivery-pending failures and verification success", () => {
    const { rerender } = render(
      <FormStatus kind="error" message="Delivery is pending." />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Delivery is pending.");
    rerender(<FormStatus kind="success" message="Verified." />);
    expect(screen.getByRole("status")).toHaveTextContent("Verified.");
  });

  it("retains native validation and announces submitting, safe failure, and transition success", () => {
    const view = render(
      <AuthForm>
        <label>
          Email
          <input type="email" required />
        </label>
        <button disabled>Creating account…</button>
        <FormStatus message="If an account can be verified, a replacement code was sent." />
      </AuthForm>,
    );
    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(
      screen.getByRole("button", { name: "Creating account…" }),
    ).toBeDisabled();
    expect(screen.getByRole("status")).not.toHaveTextContent(
      /exists|token|code:/i,
    );
    view.rerender(
      <AuthForm>
        <FormStatus
          kind="error"
          message="Registration could not be completed."
        />
        <button type="button">Create account</button>
      </AuthForm>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Registration could not be completed.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
  });
});
