import type { RequestHandler } from "express";
import { fileIdSchema } from "../schemas/file-query.schemas.js";
import { setContentHeaders } from "../../infrastructure/file-content/content-response.js";
import { fileNotFound } from "../../modules/files/file.errors.js";
import type { GetFileContentService } from "../../modules/files/services/get-file-content.service.js";

/** Builds streamed owner-authorized preview and download handlers. */
export function fileContentController(service: GetFileContentService) {
  /** Creates one abort-aware content handler for the requested disposition. */
  const respond =
    (mode: "preview" | "download"): RequestHandler =>
    async (request, response, next) => {
      try {
        const parsed = fileIdSchema.safeParse(request.params.fileId);
        if (!parsed.success) throw fileNotFound();
        const ownerId = (response.locals.identity as { subject: string })
          .subject;
        const content = await service.get(ownerId, parsed.data, mode);
        setContentHeaders(response, {
          name: content.originalName,
          mimeType: content.mimeType,
          size: content.size,
          disposition: mode === "preview" ? "inline" : "attachment",
        });
        /** Stops provider streaming when the request or response connection closes. */
        const stopStream = () => {
          if (!response.writableEnded && !content.stream.destroyed)
            content.stream.destroy();
        };
        request.once("aborted", stopStream);
        response.once("close", stopStream);
        /** Avoids writing an error envelope after binary headers have already been sent. */
        content.stream.once("error", (error) => {
          if (response.headersSent) response.destroy(error);
          else next(error);
        });
        content.stream.pipe(response);
      } catch (error) {
        next(error);
      }
    };
  return { preview: respond("preview"), download: respond("download") };
}
