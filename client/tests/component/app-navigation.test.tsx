import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
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
        <AppNavigation
          role={role}
          profile={{ name: "Ada Lovelace", email: "ada@example.invalid" }}
          storage={{ usedBytes: 25, limitBytes: 100 }}
        />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe("shared authenticated navigation", () => {
  it("shows the same base links without administrator access for users", () => {
    renderNavigation("USER");
    expect(screen.getByRole("button", { name: "Sign out" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Overview" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Profile" })).toBeVisible();
    expect(screen.queryByRole("link", { name: "Admin" })).toBeNull();
  });

  it("adds administrator access without replacing the base links", () => {
    renderNavigation("ADMIN");
    expect(screen.getByRole("link", { name: "Overview" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Profile" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Platform" })).toBeVisible();
  });

  it("opens a navigable side tab while keeping sign out in the header", () => {
    renderNavigation("USER");
    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    const drawer = screen.getByRole("dialog", { name: "Navigate" });
    expect(
      within(drawer).getByRole("link", { name: "Overview" }),
    ).toBeVisible();
    expect(within(drawer).getByRole("link", { name: "Files" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeVisible();
    fireEvent.click(
      within(drawer).getByRole("button", { name: "Close navigation" }),
    );
    expect(screen.queryByRole("dialog", { name: "Navigate" })).toBeNull();
  });

  it("renders the desktop shell summary, active route, profile, and theme controls", () => {
    renderNavigation("USER");
    expect(screen.getByRole("navigation", { name: "Primary" })).toHaveAttribute(
      "data-compact-at",
      "820",
    );
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByText("25% used")).toBeVisible();
    expect(screen.getByText("Ada Lovelace")).toBeVisible();
    expect(screen.getByText("ada@example.invalid")).toBeVisible();
    expect(screen.getByRole("button", { name: /Appearance:/i })).toBeVisible();
    expect(
      screen.queryByRole("searchbox", { name: "Search Fileora" }),
    ).toBeNull();
  });

  it("closes compact navigation after route choice, backdrop, and Escape", () => {
    renderNavigation("USER");
    const open = screen.getByRole("button", { name: "Open navigation" });
    fireEvent.click(open);
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "Navigate" })).getByRole(
        "link",
        { name: "Files" },
      ),
    );
    expect(screen.queryByRole("dialog", { name: "Navigate" })).toBeNull();
    fireEvent.click(open);
    fireEvent.mouseDown(screen.getByTestId("navigation-backdrop"));
    expect(screen.queryByRole("dialog", { name: "Navigate" })).toBeNull();
    fireEvent.click(open);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Navigate" })).toBeNull();
    expect(open).toHaveFocus();
  });
});
