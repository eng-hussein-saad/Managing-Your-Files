import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VerifyEmailForm } from "../../src/features/auth/components/verify-email-form";
import { ToastProvider } from "../../src/components/toast/toast-provider";

const replace = vi.fn();
const verification = {
  mutate: vi.fn(),
  isPending: false,
  isSuccess: false,
  error: null,
};
const resend = {
  mutate: vi.fn(),
  isPending: false,
  error: null,
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () =>
    new URLSearchParams("email=ada%40example.com&cooldown=60"),
}));

vi.mock("../../src/features/auth/hooks/use-registration", () => ({
  useVerifyEmail: () => verification,
  useResendVerification: () => resend,
}));

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("verification resend countdown", () => {
  it("shows when resend becomes available and enables it at zero", async () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <VerifyEmailForm />
      </ToastProvider>,
    );

    expect(
      screen.getByRole("button", { name: "Send a new code in 60s" }),
    ).toBeDisabled();

    await act(async () => vi.advanceTimersByTimeAsync(60_000));

    expect(
      screen.getByRole("button", { name: "Send a new code" }),
    ).toBeEnabled();
  });
});
