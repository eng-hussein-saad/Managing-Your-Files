import type { RequestHandler } from "express";
import { success } from "../respond.js";
import type { UploadFileService } from "../../modules/files/services/upload-file.service.js";
import { uploadFileFieldSchema } from "../schemas/file-upload.schemas.js";
import { failure } from "../respond.js";

/** Builds request handlers for the upload-policy and one-file upload endpoints. */
export function fileUploadController(
  service: UploadFileService,
  policy: {
    maxFileSizeBytes: string;
    maxFilesPerBatch: number;
    allowedMimeTypes: string[];
  },
) {
  /** Returns server-authoritative browser upload policy. */
  const getPolicy: RequestHandler = async (_request, response, next) => {
    try {
      const identity = response.locals.identity as { subject: string };
      success(response, 200, {
        ...policy,
        quota: await service.policyQuota(identity.subject),
      });
    } catch (error) {
      next(error);
    }
  };
  /** Persists exactly one authenticated Multer file. */
  const upload: RequestHandler = async (request, response, next) => {
    try {
      const identity = response.locals.identity as { subject: string };
      if (!request.file) {
        failure(response, 400, "VALIDATION_FAILED", "Attach one file.");
        return;
      }
      const fields = uploadFileFieldSchema.safeParse(request.body);
      if (!fields.success) {
        failure(
          response,
          400,
          "VALIDATION_FAILED",
          "The upload fields are invalid.",
          fields.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        );
        return;
      }
      const result = await service.upload(identity.subject, {
        path: request.file.path,
        originalName: request.file.originalname,
        folderId: fields.data.folderId,
      });
      success(response, 201, result);
    } catch (error) {
      next(error);
    }
  };
  return { getPolicy, upload };
}
