import { act, render, renderHook, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UploadDropzone } from "../../src/features/files/components/upload-dropzone";
import { UploadQueue } from "../../src/features/files/components/upload-queue";
import { useUploadQueue } from "../../src/features/files/upload/use-upload-queue";
import { uploadFile } from "../../src/features/files/api/file-upload.api";

vi.mock("../../src/features/files/api/file-upload.api", () => ({
  uploadFile: vi.fn(),
}));
const mockedUpload = vi.mocked(uploadFile);
const resultFile = {
  id: "11111111-1111-4111-8111-111111111111",
  originalName: "file.txt",
  mimeType: "text/plain",
  typeCategory: "text",
  sizeBytes: "4",
  folder: null,
  uploadedAt: "2026-08-22T00:00:00.000Z",
  previewKind: "text",
  extractionState: "available",
} as const;

describe("file upload queue", () => {
  beforeEach(() => {
    mockedUpload.mockReset();
    mockedUpload.mockResolvedValue(resultFile);
    vi.stubGlobal("crypto", { randomUUID: vi.fn(() => `id-${Math.random()}`) });
  });
  it("accepts picker and drop batches through one accessible control", () => {
    const onFiles = vi.fn();
    const { container } = render(<UploadDropzone onFiles={onFiles} />);
    const input = screen.getByLabelText<HTMLInputElement>(/select files/i);
    const file = new File(["a"], "a.txt");
    Object.defineProperty(input, "files", { value: [file] });
    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(onFiles).toHaveBeenCalledWith([file]);
    expect(container.querySelector("input[multiple]")).not.toBeNull();
  });
  it("rejects an eleven-file selection without truncating it", () => {
    const hook = renderHook(() => useUploadQueue());
    act(() =>
      hook.result.current.add(
        Array.from(
          { length: 11 },
          (_value, index) => new File(["x"], `${index}.txt`),
        ),
      ),
    );
    expect(hook.result.current.items).toHaveLength(0);
    expect(hook.result.current.selectionError).toMatch(/no more than 10/i);
  });
  it("uploads sequentially in displayed order and reports progress", async () => {
    const order: string[] = [];
    mockedUpload.mockImplementation(async (file, _folder, progress) => {
      order.push(file.name);
      progress?.(50);
      return { ...resultFile, originalName: file.name };
    });
    const hook = renderHook(() => useUploadQueue());
    act(() =>
      hook.result.current.add([
        new File(["a"], "first.txt"),
        new File(["b"], "second.txt"),
      ]),
    );
    await act(async () => hook.result.current.run());
    expect(order).toEqual(["first.txt", "second.txt"]);
    expect(hook.result.current.items.map((item) => item.status)).toEqual([
      "success",
      "success",
    ]);
  });
  it("preserves earlier success when a later item fails and supports retry", async () => {
    mockedUpload
      .mockResolvedValueOnce(resultFile)
      .mockRejectedValueOnce(new Error("failed"))
      .mockResolvedValueOnce(resultFile);
    const hook = renderHook(() => useUploadQueue());
    act(() =>
      hook.result.current.add([
        new File(["a"], "ok.txt"),
        new File(["b"], "retry.txt"),
      ]),
    );
    await act(async () => hook.result.current.run());
    expect(hook.result.current.items.map((item) => item.status)).toEqual([
      "success",
      "error",
    ]);
    await act(async () =>
      hook.result.current.retry(hook.result.current.items[1]!.id),
    );
    expect(hook.result.current.items.map((item) => item.status)).toEqual([
      "success",
      "success",
    ]);
  });
  it("announces quota-aware partial outcomes and retry controls", () => {
    render(
      <UploadQueue
        items={[
          {
            id: "1",
            file: new File(["x"], "quota.txt"),
            status: "error",
            progress: 0,
            error: "Quota exceeded",
            quota: { usedBytes: "100", remainingBytes: "0", limitBytes: "100" },
          },
        ]}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByRole("list", { name: /upload queue/i })).toHaveAttribute(
      "aria-live",
      "polite",
    );
    expect(screen.getByText(/0 bytes remaining/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /retry quota.txt/i }),
    ).toBeInTheDocument();
  });
});
