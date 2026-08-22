import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";
import type { RequestHandler } from "express";
import { maxFileSizeBytes } from "../schemas/file-upload.schemas.js";

const directory = join(tmpdir(), "gold-era-uploads");
const storage = multer.diskStorage({
  /** Creates an isolated temporary directory before Multer writes request content. */
  destination: (_request, _file, callback) => {
    /** Creates the upload directory before handing its path back to Multer. */
    const prepareDirectory = async () => {
      await mkdir(directory, { recursive: true });
      callback(null, directory);
    };
    void prepareDirectory().catch((error: unknown) =>
      callback(
        error instanceof Error
          ? error
          : new Error("Could not prepare upload intake"),
        directory,
      ),
    );
  },
  /** Prevents client filenames from becoming filesystem paths. */
  filename: (_request, _file, callback) => callback(null, randomUUID()),
});
export const oneFileUpload = multer({
  storage,
  limits: { fileSize: maxFileSizeBytes + 1, files: 1, fields: 1, parts: 3 },
}).single("file");
/** Schedules temporary-file removal after every completed or aborted response. */
export const cleanupUploadedFile: RequestHandler = (
  request,
  response,
  next,
) => {
  const file = request.file;
  if (file?.path) {
    /** Removes the captured path without delaying or changing the HTTP outcome. */
    const cleanup = () => {
      void rm(file.path, { force: true });
    };
    response.once("finish", cleanup);
    response.once("close", cleanup);
  }
  next();
};
