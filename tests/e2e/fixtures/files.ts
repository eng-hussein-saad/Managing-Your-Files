/** Creates a browser-native text file with an exact requested byte count. */
export const browserTextFile = (name: string, byteCount: number) => ({
  name,
  mimeType: "text/plain",
  buffer: Buffer.alloc(byteCount, "a"),
});
/** Provides a mixed valid/invalid browser upload batch. */
export const mixedUploadFiles = () => [
  browserTextFile("accepted.txt", 10),
  {
    name: "rejected.exe",
    mimeType: "application/octet-stream",
    buffer: Buffer.from([0, 1, 2]),
  },
];
export const exactBoundaryUpload = () =>
  browserTextFile("boundary.txt", 5_242_880);
export const overBoundaryUpload = () =>
  browserTextFile("too-large.txt", 5_242_881);
/** Produces a browser-native valid DOCX container with required directory entries. */
export const browserDocxFile = (name = "fallback.docx") => ({
  name,
  mimeType:
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  buffer: Buffer.from(
    "UEsDBBQAAAAIAE+oFl2TGN0vFgAAABUAAAARAAAAd29yZC9kb2N1bWVudC54bWyySclPLs1NzSuxs9GHMwEAAAD//wMAUEsDBBQAAAAIAE+oFl28/hnLEwAAAA8AAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbLIJqSxILbaz0YfQAAAAAP//AwBQSwECFAAUAAAACABPqBZdkxjdLxYAAAAVAAAAEQAAAAAAAAAAAAAAAAAAAAAAd29yZC9kb2N1bWVudC54bWxQSwECFAAUAAAACABPqBZdvP4ZyxMAAAAPAAAAEwAAAAAAAAAAAAAAAABFAAAAW0NvbnRlbnRfVHlwZXNdLnhtbFBLBQYAAAAAAgACAIAAAACJAAAAAAA=",
    "base64",
  ),
});
/** Names the injected provider operation that should fail in a browser journey. */
export const providerFailure = (
  operation: "upload" | "download" | "remove",
) => ({ operation, status: 503 });
