const encoder = new TextEncoder();
/** Produces a byte-perfect text fixture for validation and extraction tests. */
export const textFile = (content = "hello file management") =>
  encoder.encode(content);
/** Produces a minimally recognizable PDF fixture. */
export const pdfFile = () =>
  encoder.encode("%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF");
/** Produces a minimal JPEG signature fixture. */
export const jpegFile = () =>
  new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 0xff, 0xd9,
  ]);
/** Produces a minimal PNG signature fixture. */
export const pngFile = () =>
  new Uint8Array(
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    ),
  );
/** Produces a minimal WebP RIFF signature fixture. */
export const webpFile = () =>
  new Uint8Array([0x52, 0x49, 0x46, 0x46, 4, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
/** Produces a valid ZIP container with the two required DOCX directory markers. */
export const docxFile = () =>
  new Uint8Array(
    Buffer.from(
      "UEsDBBQAAAAIAE+oFl2TGN0vFgAAABUAAAARAAAAd29yZC9kb2N1bWVudC54bWyySclPLs1NzSuxs9GHMwEAAAD//wMAUEsDBBQAAAAIAE+oFl28/hnLEwAAAA8AAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbLIJqSxILbaz0YfQAAAAAP//AwBQSwECFAAUAAAACABPqBZdkxjdLxYAAAAVAAAAEQAAAAAAAAAAAAAAAAAAAAAAd29yZC9kb2N1bWVudC54bWxQSwECFAAUAAAACABPqBZdvP4ZyxMAAAAPAAAAEwAAAAAAAAAAAAAAAABFAAAAW0NvbnRlbnRfVHlwZXNdLnhtbFBLBQYAAAAAAgACAIAAAACJAAAAAAA=",
      "base64",
    ),
  );
/** Produces a DOCX whose manifest lets file-type identify the Office MIME directly. */
export const officeDetectedDocxFile = () =>
  new Uint8Array(
    Buffer.from(
      "UEsDBBQAAAAIAN20G12Rp0i1wgAAAAIBAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbFyPwUrFMBBFfyVkK81UFyLS9C0El+ri+QFDMu0LZmZCEmv9e6nCW7i+nHO402nnbDaqLal4e+tGa0iCxiSrt+/n5+HBnubp/F2omZ2zNG8vvZdHgBYuxNicFpKd86KVsTendYWC4QNXgrtxvIeg0kn60A+HnafXjWpNkcwb1v6CTN7Cl9YIUcMnk3S3c7bm6Q87yt5iKTkF7EkFNon/moMuSwp05Q9bqRqotSQrZ3ddGJPcHHqYJ/g9Nf8AAAD//wMAUEsDBBQAAAAIAN20G11SfNZdVQAAAFQAAAARAAAAd29yZC9kb2N1bWVudC54bWwEwcENgCAMAMBVDANY4sMHUXchUIGEtoRiYHzvrumihI+Qx7aosrp5mzxGcwAaMpLXXRryovpKJz90l55gSo+tS0DVwokqHNaeQL6wgecHAAD//wMAUEsBAhQAFAAAAAgA3bQbXZGnSLXCAAAAAgEAABMAAAAAAAAAAAAAAAAAAAAAAFtDb250ZW50X1R5cGVzXS54bWxQSwECFAAUAAAACADdtBtdUnzWXVUAAABUAAAAEQAAAAAAAAAAAAAAAADzAAAAd29yZC9kb2N1bWVudC54bWxQSwUGAAAAAAIAAgCAAAAAdwEAAAAA",
      "base64",
    ),
  );
/** Produces a valid generic ZIP which must not pass DOCX verification. */
export const zipFile = () =>
  new Uint8Array(
    Buffer.from(
      "UEsDBBQAAAAIAE+oFl3tePy+EwAAAAsAAAALAAAAYXJjaGl2ZS50eHRKT81LLcpMVqjKLAAAAAD//wMAUEsBAhQAFAAAAAgAT6gWXe14/L4TAAAACwAAAAsAAAAAAAAAAAAAAAAAAAAAAGFyY2hpdmUudHh0UEsFBgAAAAABAAEAOQAAADwAAAAAAA==",
      "base64",
    ),
  );
/** Produces malformed bytes that cannot be classified as an allowed file. */
export const malformedFile = () => new Uint8Array([0, 1, 2, 3]);
/** Produces exact size-boundary bytes for upload limit tests. */
export const sizedFile = (bytes: number) => new Uint8Array(bytes).fill(0x61);
export const exactFileLimit = () => sizedFile(5_242_880);
export const overFileLimit = () => sizedFile(5_242_881);
export const extractionLimitFile = () => textFile("x".repeat(100_001));
