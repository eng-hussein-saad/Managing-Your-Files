import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProfilePage from "../../src/app/(protected)/profile/page";

const useProfileMock = vi.hoisted(() => vi.fn());

vi.mock("../../src/features/auth/hooks/use-profile", () => ({
  useProfile: useProfileMock,
}));

describe("profile loading state", () => {
  it("keeps the profile layout and shows skeletons instead of a spinner", () => {
    useProfileMock.mockReturnValue({ isLoading: true });

    const { container } = render(<ProfilePage />);

    expect(
      screen.getByRole("status", { name: "Loading your profile" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { level: 1, name: "Your profile" }),
    ).toBeVisible();
    expect(container.querySelector(".profile-skeleton-details")).toBeVisible();
    expect(container.querySelector(".page-state-spinner")).not.toBeInTheDocument();
  });
});
