import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { Breadcrumbs } from "../../src/features/folders/components/breadcrumbs";
import { FolderNameDialog } from "../../src/features/folders/components/folder-dialogs";
import { FolderBrowser } from "../../src/features/folders/components/folder-browser";
import { getFolderContents } from "../../src/features/folders/api/folders.api";

vi.mock("../../src/features/folders/api/folders.api", async () => ({
  getFolderContents: vi.fn(),
  createFolder: vi.fn(),
  renameFolder: vi.fn(),
  moveFile: vi.fn(),
  deleteFolder: vi.fn(),
}));
const getContents = vi.mocked(getFolderContents);
/** Renders a query-dependent folder component with retries disabled. */
function renderWithQuery(node: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{node}</QueryClientProvider>,
  );
}

describe("folder management components", () => {
  it("navigates virtual root and nested breadcrumbs by keyboard buttons", () => {
    const navigate = vi.fn();
    render(
      <Breadcrumbs
        items={[
          { id: "a", name: "A" },
          { id: "b", name: "B" },
        ]}
        onNavigate={navigate}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "My Files" }));
    fireEvent.click(screen.getByRole("button", { name: "B" }));
    expect(navigate.mock.calls).toEqual([[null], ["b"]]);
    expect(screen.getByRole("button", { name: "B" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
  it("captures trimmed create and rename names with pending/error feedback", () => {
    const submit = vi.fn();
    render(
      <FolderNameDialog
        mode="create"
        error="Depth exceeded"
        onCancel={vi.fn()}
        onSubmit={submit}
      />,
    );
    fireEvent.change(screen.getByLabelText(/folder name/i), {
      target: { value: " Reports " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(submit).toHaveBeenCalledWith("Reports");
    expect(screen.getByRole("alert")).toHaveTextContent("Depth exceeded");
  });
  it("renders responsive root and child folder states with mutation actions", async () => {
    getContents.mockResolvedValue({
      folder: null,
      breadcrumbs: [],
      folders: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          name: "Projects",
          parentId: null,
          depth: 1,
          createdAt: "2026-08-22T00:00:00.000Z",
          updatedAt: "2026-08-22T00:00:00.000Z",
        },
      ],
      files: [],
    });
    const navigate = vi.fn();
    renderWithQuery(<FolderBrowser location={null} onNavigate={navigate} />);
    const project = await screen.findByRole("button", { name: "Projects" });
    fireEvent.click(project);
    expect(navigate).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111111",
    );
    expect(screen.getByRole("button", { name: "New folder" })).toBeEnabled();
  });
});
