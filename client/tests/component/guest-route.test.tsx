import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GuestRoute } from "../../src/components/auth/guest-route";
import {
  clearSession,
  setAuthState,
  setSession,
} from "../../src/features/auth/auth-store";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

afterEach(() => {
  clearSession();
  replace.mockClear();
});

describe("guest-only routes", () => {
  it("waits for session restoration before showing guest content", () => {
    setAuthState({ status: "loading", session: null });
    render(<GuestRoute>Guest content</GuestRoute>);

    expect(screen.getByText("Restoring your session")).toBeVisible();
    expect(screen.queryByText("Guest content")).toBeNull();
  });

  it("shows guest content to anonymous visitors", () => {
    clearSession();
    render(<GuestRoute>Guest content</GuestRoute>);

    expect(screen.getByText("Guest content")).toBeVisible();
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects an authenticated user to the dashboard", async () => {
    setSession({
      accessToken: "access-token",
      tokenType: "Bearer",
      expiresIn: 900,
      user: {
        id: "d2e2ad88-7d91-4209-94cf-0d0c7fcbfa32",
        name: "Ada",
        email: "ada@example.com",
        role: "USER",
        isEmailVerified: true,
        createdAt: "2026-08-20T00:00:00.000Z",
        updatedAt: "2026-08-20T00:00:00.000Z",
      },
    });

    render(<GuestRoute>Guest content</GuestRoute>);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
    expect(screen.queryByText("Guest content")).toBeNull();
  });
});
