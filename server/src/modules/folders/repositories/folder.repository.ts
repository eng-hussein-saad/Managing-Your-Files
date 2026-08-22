import type { Prisma, PrismaClient } from "@prisma/client";

type Database = PrismaClient | Prisma.TransactionClient;

/** Encapsulates locked owner-scoped folder hierarchy persistence. */
export class FolderRepository {
  /** Serializes all hierarchy mutations for one owner within the active transaction. */
  async lockOwner(database: Database, ownerId: string): Promise<void> {
    await database.$queryRaw`SELECT id FROM "USER" WHERE id = ${ownerId}::uuid FOR UPDATE`;
  }
  /** Returns a folder only when it belongs to its asserted owner. */
  async owned(database: Database, ownerId: string, id: string) {
    return database.folder.findFirst({ where: { id, ownerId } });
  }
  /** Resolves a root-first same-owner ancestor chain and rejects cycles or broken links. */
  async ancestry(database: Database, ownerId: string, folderId: string | null) {
    const path: Array<{
      id: string;
      name: string;
      parentId: string | null;
      createdAt: Date;
      updatedAt: Date;
    }> = [];
    const visited = new Set<string>();
    let cursor = folderId;
    while (cursor) {
      if (visited.has(cursor)) return null;
      visited.add(cursor);
      const folder = await this.owned(database, ownerId, cursor);
      if (!folder) return null;
      path.unshift(folder);
      cursor = folder.parentId;
      if (path.length > 10) return null;
    }
    return path;
  }
  /** Returns whether a Unicode-normalized case-folded sibling name is occupied. */
  async siblingExists(
    database: Database,
    ownerId: string,
    parentId: string | null,
    name: string,
    exceptId?: string,
  ) {
    const normalized = name.trim().normalize("NFC").toLocaleLowerCase("en-US");
    const siblings = await database.folder.findMany({
      where: {
        ownerId,
        parentId,
        ...(exceptId ? { NOT: { id: exceptId } } : {}),
      },
      select: { name: true },
    });
    return siblings.some(
      /** Evaluates this collection item against the surrounding predicate. */ (
        item,
      ) =>
        item.name.trim().normalize("NFC").toLocaleLowerCase("en-US") ===
        normalized,
    );
  }
  /** Inserts one fixed-parent folder. */
  async create(
    database: Database,
    input: {
      id: string;
      ownerId: string;
      parentId: string | null;
      name: string;
      now: Date;
    },
  ) {
    return database.folder.create({
      data: {
        id: input.id,
        ownerId: input.ownerId,
        parentId: input.parentId,
        name: input.name,
        createdAt: input.now,
        updatedAt: input.now,
      },
    });
  }
  /** Renames one folder without changing its parent or descendants. */
  async rename(database: Database, id: string, name: string, now: Date) {
    return database.folder.update({
      where: { id },
      data: { name, updatedAt: now },
    });
  }
  /** Returns direct child folders and files in deterministic name/id order. */
  async contents(database: Database, ownerId: string, parentId: string | null) {
    const [folders, files] = await Promise.all([
      database.folder.findMany({
        where: { ownerId, parentId },
        orderBy: [{ name: "asc" }, { id: "asc" }],
      }),
      database.file.findMany({
        where: { ownerId, folderId: parentId },
        include: { folder: { select: { id: true, name: true } } },
        orderBy: [{ originalName: "asc" }, { id: "asc" }],
      }),
    ]);
    return { folders, files };
  }
  /** Deletes one already-authorized empty folder. */
  async deleteEmpty(
    database: Database,
    ownerId: string,
    id: string,
  ): Promise<"deleted" | "not-found" | "not-empty"> {
    const folder = await this.owned(database, ownerId, id);
    if (!folder) return "not-found";
    const [children, files] = await Promise.all([
      database.folder.count({ where: { ownerId, parentId: id } }),
      database.file.count({ where: { ownerId, folderId: id } }),
    ]);
    if (children > 0 || files > 0) return "not-empty";
    await database.folder.delete({ where: { id } });
    return "deleted";
  }
}
