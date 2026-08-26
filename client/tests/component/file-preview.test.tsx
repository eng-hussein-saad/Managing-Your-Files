import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FilePreview } from "../../src/features/files/components/file-preview";
import { FileDownload } from "../../src/features/files/components/file-download";
import { useFilePreview } from "../../src/features/files/hooks/use-file-content";
import { downloadFile } from "../../src/features/files/api/file-content.api";

vi.mock("../../src/features/files/hooks/use-file-content", () => ({
  useFilePreview: vi.fn(),
}));
vi.mock("../../src/features/files/api/file-content.api", () => ({
  downloadFile: vi.fn(),
}));
const previewHook = vi.mocked(useFilePreview);
const download = vi.mocked(downloadFile);
const revokeObjectUrl = vi.fn();

describe("authorized file preview", () => {
  beforeEach(() => {
    revokeObjectUrl.mockReset();
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:preview"),
      revokeObjectURL: revokeObjectUrl,
    });
    previewHook.mockReturnValue({
      data: new Blob(["content"]),
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useFilePreview>);
  });
  it.each([
    ["image", "img", "File preview"],
    ["pdf", "iframe", "PDF preview"],
    ["text", "iframe", "Text preview (text/plain)"],
  ] as const)(
    "renders %s content with an accessible label",
    async (kind, tag, label) => {
      const { container, unmount } = render(
        <FilePreview id="file" mimeType="text/plain" kind={kind} />,
      );
      await waitFor(() => expect(container.querySelector(tag)).not.toBeNull());
      if (kind === "image")
        expect(screen.getByAltText(label)).toBeInTheDocument();
      else
        expect(screen.getByTitle(label, { exact: false })).toBeInTheDocument();
      unmount();
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:preview");
    },
  );
  it("shows the DOCX/unavailable fallback without fetching content", () => {
    render(
      <FilePreview id="file" mimeType="application/docx" kind="unavailable" />,
    );
    expect(screen.getByText(/preview is unavailable/i)).toBeInTheDocument();
    expect(previewHook).toHaveBeenCalledWith("file", false);
  });
  it("shows loading and retryable error states", () => {
    previewHook.mockReturnValue({
      isLoading: true,
      isError: false,
    } as ReturnType<typeof useFilePreview>);
    const { rerender } = render(
      <FilePreview id="file" mimeType="text/plain" kind="text" />,
    );
    expect(
      screen.getByRole("status", { name: "Loading preview" }),
    ).toHaveAttribute("aria-busy", "true");
    previewHook.mockReturnValue({
      isLoading: false,
      isError: true,
    } as ReturnType<typeof useFilePreview>);
    rerender(<FilePreview id="file" mimeType="text/plain" kind="text" />);
    expect(screen.getByRole("alert")).toHaveTextContent(/could not be loaded/i);
  });
  it("downloads through the authorized server endpoint and cleans its object URL", async () => {
    download.mockResolvedValue(new Blob(["download"]));
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    render(<FileDownload id="file" name="report.txt" />);
    fireEvent.click(
      screen.getByRole("button", { name: /download report.txt/i }),
    );
    await waitFor(() => expect(download).toHaveBeenCalledWith("file"));
    expect(click).toHaveBeenCalled();
    expect(revokeObjectUrl).toHaveBeenCalled();
    click.mockRestore();
  });
});
