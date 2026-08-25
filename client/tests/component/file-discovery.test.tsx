import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FileCollection } from "../../src/features/files/components/file-collection";
import { FilePagination } from "../../src/features/files/components/file-pagination";
import { FileQueryToolbar } from "../../src/features/files/components/file-query-toolbar";

const file = {
  id: "11111111-1111-4111-8111-111111111111",
  originalName: "Report.pdf",
  mimeType: "application/pdf",
  typeCategory: "pdf",
  sizeBytes: "42",
  folder: null,
  uploadedAt: "2026-08-22T00:00:00.000Z",
  previewKind: "pdf",
  extractionState: "available",
} as const;

describe("file discovery components", () => {
  it("exposes server query, filter, sort, direction, and responsive view state", () => {
    const onChange = vi.fn();
    const onView = vi.fn();
    render(
      <FileQueryToolbar
        query={{ search: "report", type: "pdf" }}
        view="list"
        onChange={onChange}
        onView={onView}
      />,
    );
    fireEvent.change(screen.getByLabelText(/search files/i), {
      target: { value: "new" },
    });
    expect(onChange).toHaveBeenCalledWith({ search: "new", page: 1 });
    fireEvent.click(screen.getByRole("button", { name: /more filters/i }));
    const dialog = screen.getByRole("dialog", { name: "Filter files" });
    fireEvent.change(screen.getByLabelText(/files per page/i), {
      target: { value: "10" },
    });
    expect(within(dialog).getByLabelText("Type")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Sort by")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Order")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Files per page")).toBeInTheDocument();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Apply filters" }),
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ pageSize: 10, page: 1 }),
    );
    expect(screen.queryByRole("dialog", { name: "Filter files" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Grid" }));
    expect(onView).toHaveBeenCalledWith("grid");
    expect(screen.getByRole("button", { name: "List" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("region", { name: "File filters" })).toHaveClass(
      "ui-collection-toolbar",
    );
  });

  it("dismisses the centered filter modal without applying its draft", () => {
    const onChange = vi.fn();
    render(
      <FileQueryToolbar
        query={{ pageSize: 20 }}
        view="list"
        onChange={onChange}
        onView={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /more filters/i }));
    const dialog = screen.getByRole("dialog", { name: "Filter files" });
    fireEvent.change(within(dialog).getByLabelText("Files per page"), {
      target: { value: "10" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog", { name: "Filter files" })).toBeNull();
  });
  it("renders list and grid summaries with a selectable owned file", () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <FileCollection
        files={[file]}
        view="list"
        hasFilters={false}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /report.pdf/i }));
    expect(onSelect).toHaveBeenCalledWith(file.id);
    rerender(
      <FileCollection
        files={[file]}
        view="grid"
        hasFilters={false}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByRole("list")).toHaveAttribute("data-view", "grid");
    expect(screen.getByRole("list")).toHaveAttribute(
      "aria-label",
      "File collection",
    );
  });
  it("distinguishes a new empty account from a no-match query", () => {
    const { rerender } = render(
      <FileCollection
        files={[]}
        view="list"
        hasFilters={false}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText(/no files yet/i)).toBeInTheDocument();
    rerender(
      <FileCollection files={[]} view="list" hasFilters onSelect={vi.fn()} />,
    );
    expect(screen.getByText(/no files match/i)).toBeInTheDocument();
  });
  it("bounds pagination and exposes current-page state", () => {
    const onPage = vi.fn();
    render(<FilePagination page={2} totalPages={3} onPage={onPage} />);
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onPage.mock.calls).toEqual([[1], [3]]);
    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 3")).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });
});
