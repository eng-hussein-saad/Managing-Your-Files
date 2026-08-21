import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageState } from "../../src/components/status/page-state";
import { VerificationCodeInput } from "../../src/components/auth/verification-code-input";
describe("accessible authentication states", () => {
  it("labels verification proof and exposes loading state", () => {
    render(
      <>
        <PageState title="Restoring your session" busy />
        <VerificationCodeInput />
      </>,
    );
    expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "true");
    expect(
      screen.getByLabelText("Eight-digit verification code"),
    ).toHaveAttribute("inputmode", "numeric");
  });
});
