import type { PrismaClient } from "@prisma/client";
import {
  fileNotFound,
  previewUnavailable,
  retryableFileFailure,
} from "../file.errors.js";
import { previewForMime } from "../file.mapper.js";
import { StorageError, type StoragePort } from "../ports/storage.port.js";

/** Authorizes current ownership before and after retrieving private content. */
export class GetFileContentService {
  /** Creates request-bound content access over private storage. */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly storage: StoragePort,
  ) {}
  /** Returns one verified owner-scoped object only while its metadata remains current. */
  async get(ownerId: string, fileId: string, mode: "preview" | "download") {
    const file = await this.prisma.file.findFirst({
      where: { id: fileId, ownerId },
    });
    if (!file) throw fileNotFound();
    if (
      mode === "preview" &&
      previewForMime(file.mimeType as never) === "unavailable"
    )
      throw previewUnavailable();
    let object;
    try {
      object = await this.storage.download(file.storageKey, Number(file.size));
    } catch (error) {
      if (error instanceof StorageError && error.kind === "not-found")
        throw fileNotFound();
      throw retryableFileFailure();
    }
    const stillCurrent = await this.prisma.file.findFirst({
      where: { id: fileId, ownerId, storageKey: file.storageKey },
      select: { id: true },
    });
    if (!stillCurrent) {
      object.stream.destroy();
      throw fileNotFound();
    }
    if (object.size !== Number(file.size)) {
      object.stream.destroy();
      throw retryableFileFailure();
    }
    return {
      fileId: file.id,
      stream: object.stream,
      size: object.size,
      mimeType: file.mimeType,
      originalName: file.originalName,
    };
  }
}
