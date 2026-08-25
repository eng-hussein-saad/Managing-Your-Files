import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminFileDirectory } from "../../src/features/admin/components/admin-file-directory";
import { AdminFileActions } from "../../src/features/admin/components/admin-file-actions";
import { ToastProvider } from "../../src/components/toast/toast-provider";
import { adminFileResponseFixture } from "../fixtures/admin";

const useAdminFiles = vi.fn();
const deletion = {
  mutateAsync: vi.fn(),
  reset: vi.fn(),
  isPending: false,
  error: null,
};
vi.mock("../../src/features/admin/hooks/use-admin-files", () => ({
  useAdminFiles: /** Supplies deterministic global file query state. */ (
    ...args: unknown[]
  ) => useAdminFiles(...args),
  useDeleteAdminFile: /** Supplies deterministic global deletion state. */ () =>
    deletion,
}));
const query = {
  sort: "uploadedAt" as const,
  direction: "desc" as const,
  folder: "any" as const,
  page: 1,
  pageSize: 20 as const,
};

describe("administrator global file experience", () => {
  beforeEach(() => vi.clearAllMocks());
  it("covers loading and responsive metadata results", () => {
    useAdminFiles.mockReturnValueOnce({ isLoading: true });
    const view = render(<AdminFileDirectory query={query} update={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading global file metadata",
    );
    view.unmount();
    useAdminFiles.mockReturnValueOnce({
      isLoading: false,
      error: null,
      data: { data: [adminFileResponseFixture()], meta: { totalPages: 1 } },
      refetch: vi.fn(),
    });
    render(
      <ToastProvider>
        <AdminFileDirectory query={query} update={vi.fn()} />
      </ToastProvider>,
    );
    expect(screen.getByText("fixture-report.pdf")).toBeInTheDocument();
    expect(screen.queryByText(/storageKey/i)).not.toBeInTheDocument();
    expect(screen.getByRole("table")).toHaveAccessibleName(
      "Global file metadata",
    );
    expect(
      screen.queryByRole("button", { name: /preview|download/i }),
    ).toBeNull();
  });
  it("requires the exact filename and identifies the owner", () => {
    const file = adminFileResponseFixture();
    render(
      <ToastProvider>
        <AdminFileActions file={file} onStale={vi.fn()} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText(new RegExp(file.owner.email))).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: new RegExp(file.originalName) }),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveClass("ui-overlay-panel");
  });
});
