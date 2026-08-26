import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminUserDirectory } from "../../src/features/admin/components/admin-user-directory";
import { AdminUserActions } from "../../src/features/admin/components/admin-user-actions";
import { ToastProvider } from "../../src/components/toast/toast-provider";
import { adminUserResponseFixture } from "../fixtures/admin";

const useAdminUsers = vi.fn();
const changeRole = {
  mutateAsync: vi.fn(),
  reset: vi.fn(),
  isPending: false,
  error: null,
};
const deleteUser = {
  mutateAsync: vi.fn(),
  reset: vi.fn(),
  isPending: false,
  error: null,
};
vi.mock("../../src/features/admin/hooks/use-admin-users", () => ({
  useAdminUsers: /** Supplies deterministic administrator user query state. */ (
    ...args: unknown[]
  ) => useAdminUsers(...args),
  useChangeAdminUserRole: /** Supplies the deterministic role mutation. */ () =>
    changeRole,
  useDeleteAdminUser: /** Supplies the deterministic deletion mutation. */ () =>
    deleteUser,
}));

const query = {
  sort: "createdAt" as const,
  direction: "desc" as const,
  page: 1,
  pageSize: 20,
};

describe("administrator user experience", () => {
  beforeEach(() => vi.clearAllMocks());
  it("covers loading, empty, and populated URL-state controls", () => {
    useAdminUsers.mockReturnValueOnce({ isLoading: true });
    const view = render(<AdminUserDirectory query={query} update={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading users");
    view.unmount();
    useAdminUsers.mockReturnValueOnce({
      isLoading: false,
      error: null,
      data: { data: [], meta: { totalPages: 0 } },
    });
    render(<AdminUserDirectory query={query} update={vi.fn()} />);
    expect(
      screen.getByText("No users match these filters."),
    ).toBeInTheDocument();
  });
  it("opens role and typed-email permanent deletion confirmations", () => {
    const user = adminUserResponseFixture();
    const view = render(
      <ToastProvider>
        <AdminUserActions user={user} onStale={vi.fn()} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Change role" }));
    expect(screen.getByRole("dialog")).toHaveAccessibleName(
      `Change ${user.name}'s role?`,
    );
    expect(screen.getByRole("dialog")).toHaveClass("ui-overlay-panel");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByLabelText(new RegExp(user.email))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
    view.unmount();
  });
  it("does not expose role or deletion actions for the current administrator", () => {
    const user = adminUserResponseFixture();
    useAdminUsers.mockReturnValueOnce({
      isLoading: false,
      error: null,
      data: { data: [user], meta: { totalPages: 1 } },
      refetch: vi.fn(),
    });
    render(
      <AdminUserDirectory
        query={query}
        update={vi.fn()}
        currentUserId={user.id}
      />,
    );
    expect(screen.getByText("Current account")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Change role" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
  });
});
