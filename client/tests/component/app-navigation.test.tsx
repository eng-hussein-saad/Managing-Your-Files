import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppNavigation } from "../../src/components/navigation/app-navigation";
import { ToastProvider } from "../../src/components/toast/toast-provider";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ replace: vi.fn() }),
}));

afterEach(cleanup);

/** Renders authenticated navigation with its required application providers. */
function renderNavigation(role: "USER" | "ADMIN") {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppNavigation role={role} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe("shared authenticated navigation", () => {
  it("shows the same base links without administrator access for users", () => {
    renderNavigation("USER");
    expect(screen.getByRole("link", { name: "Overview" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Profile" })).toBeVisible();
    expect(screen.queryByRole("link", { name: "Admin" })).toBeNull();
  });

  it("adds administrator access without replacing the base links", () => {
    renderNavigation("ADMIN");
    expect(screen.getByRole("link", { name: "Overview" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Profile" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Admin" })).toBeVisible();
  });
});
