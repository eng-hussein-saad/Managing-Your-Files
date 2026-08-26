import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { accessToken, clearSession } from "../../src/features/auth/auth-store";
import { LogoutButton } from "../../src/components/auth/logout-button";
import { ToastProvider } from "../../src/components/toast/toast-provider";

const mocks = vi.hoisted(() => ({ replace: vi.fn(), mutate: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("../../src/features/auth/hooks/use-logout", () => ({
  useLogout: () => ({
    isPending: false,
    mutate: mocks.mutate.mockImplementation(
      (_input: undefined, options: { onSettled: () => void }) =>
        options.onSettled(),
    ),
  }),
}));

describe("logout state", () => {
  it("is idempotently anonymous", () => {
    clearSession();
    clearSession();
    expect(accessToken()).toBeNull();
  });

  it("returns an administrator to the public home page", () => {
    render(
      <ToastProvider>
        <LogoutButton redirectTo="/" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(mocks.replace).toHaveBeenCalledWith("/");
  });
});
