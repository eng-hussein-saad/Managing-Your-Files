import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageState } from "../../src/components/status/page-state";
import { VerificationCodeInput } from "../../src/components/auth/verification-code-input";
import HomePage from "../../src/app/page";
import AuthLayout from "../../src/app/(auth)/layout";
import { ThemeProvider } from "../../src/providers/theme-provider";
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

  it("exposes the approved landing hierarchy, account entries, preview, and feature semantics", () => {
    render(
      <ThemeProvider>
        <HomePage />
      </ThemeProvider>,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Order for every file." }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Create your account" }),
    ).toHaveAttribute("href", "/register");
    expect(
      screen.getByRole("link", { name: "I already have an account" }),
    ).toHaveAttribute("href", "/login");
    expect(
      screen.getByRole("img", { name: "Fileora workspace preview" }),
    ).toBeVisible();
    expect(screen.getAllByRole("article")).toHaveLength(3);
  });

  it("uses the split authentication story and preserves access-outcome semantics", () => {
    render(
      <ThemeProvider>
        <AuthLayout>
          <PageState title="You do not have permission" tone="error">
            <a href="/login">Return to sign in</a>
          </PageState>
        </AuthLayout>
      </ThemeProvider>,
    );
    expect(
      screen.getByRole("complementary", { name: "About Fileora" }),
    ).toHaveTextContent("Your files. Organized your way.");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "You do not have permission",
    );
    expect(
      screen.getByRole("link", { name: "Return to sign in" }),
    ).toHaveAttribute("href", "/login");
  });

  it("limits verification entry to eight numeric characters", () => {
    render(<VerificationCodeInput defaultValue="" />);
    const input = screen.getByLabelText("Eight-digit verification code");
    fireEvent.input(input, { target: { value: "12ab3456789" } });
    expect(input).toHaveValue("12345678");
  });
});
