import Dexie, { type Table } from "dexie";

/**
 * Строка в IndexedDB: сам объект `File` (structured clone), плюс стабильный `id`.
 * `name` дублирует `file.name` — нужен для индекса по имени (в `File` нельзя добавить поле).
 */
export type StoredFileRow = {
  id: string;
  file: File;
  /** Копия `file.name` для `where("name")` */
  name: string;
};

export type FileLookup = { id: string } | { name: string };

class GhostfileDb extends Dexie {
  files!: Table<StoredFileRow, string>;

  constructor() {
    super("ghostfile");
    this.version(1).stores({
      files: "id, name",
    });
  }
}

let dbInstance: GhostfileDb | null = null;

export function getGhostfileDb(): GhostfileDb {
  if (typeof indexedDB === "undefined") {
    throw new Error("Ghostfile DB requires IndexedDB (browser only).");
  }
  if (!dbInstance) {
    dbInstance = new GhostfileDb();
  }
  return dbInstance;
}

export function isGhostfileDbAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

export async function closeGhostfileDb(): Promise<void> {
  if (!dbInstance) return;
  await dbInstance.close();
  dbInstance = null;
}

export async function putFile(file: File, id?: string): Promise<string> {
  const db = getGhostfileDb();
  const key = id ?? crypto.randomUUID();
  await db.files.put({ id: key, file, name: file.name });
  return key;
}

export async function getAllFileRows(): Promise<StoredFileRow[]> {
  const db = getGhostfileDb();
  return db.files.toArray();
}

export async function getAllFiles(): Promise<File[]> {
  const rows = await getAllFileRows();
  return rows.map((row) => row.file);
}

export async function getFile(query: FileLookup): Promise<File | undefined> {
  const db = getGhostfileDb();
  if ("id" in query) {
    const row = await db.files.get(query.id);
    return row?.file;
  }
  const row = await db.files.where("name").equals(query.name).first();
  return row?.file;
}

export async function deleteAllFiles(): Promise<void> {
  await getGhostfileDb().files.clear();
}

export async function deleteFile(query: FileLookup): Promise<void> {
  const db = getGhostfileDb();
  if ("id" in query) {
    await db.files.delete(query.id);
    return;
  }
  await db.files.where("name").equals(query.name).delete();
}
