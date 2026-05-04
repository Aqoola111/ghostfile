import { toast } from "sonner";

import {
  deleteFile,
  getAllFileRows,
  isGhostfileDbAvailable,
  putFile,
} from "@/lib/dexie-utils";
import { fileQueueDedupeKey } from "@/lib/file-queue-key";
import { useFileStore } from "@/store/use-store-files";

function formatNameList(names: string[], max = 4): string {
  if (names.length === 0) return "";
  const head = names.slice(0, max);
  const rest = names.length - head.length;
  return rest > 0 ? `${head.join(", ")} (+${rest} more)` : head.join(", ");
}

async function existingQueueKeySet(): Promise<Set<string>> {
  if (isGhostfileDbAvailable()) {
    const rows = await getAllFileRows();
    return new Set(rows.map((r) => fileQueueDedupeKey(r.file)));
  }
  return new Set(
    useFileStore.getState().stagedFiles.map((e) => fileQueueDedupeKey(e.file)),
  );
}

export type AppendStagedFilesResult = {
  added: number;
  skipped: number;
};

/** Добавить файлы в Dexie (если есть) и обновить стор — дубликаты (имя+размер+mtime) пропускаются. */
export async function appendStagedFiles(
  files: File[],
): Promise<AppendStagedFilesResult> {
  if (files.length === 0) return { added: 0, skipped: 0 };

  let existing: Set<string>;
  try {
    existing = await existingQueueKeySet();
  } catch (e) {
    console.error("appendStagedFiles (read queue):", e);
    toast.error("Could not read queue", {
      description: "Try again after a moment.",
    });
    return { added: 0, skipped: files.length };
  }

  const toAdd: File[] = [];
  const skippedNames: string[] = [];

  for (const file of files) {
    const key = fileQueueDedupeKey(file);
    if (existing.has(key)) {
      skippedNames.push(file.name);
      continue;
    }
    existing.add(key);
    toAdd.push(file);
  }

  if (toAdd.length === 0) {
    toast.warning("Already in queue", {
      description: formatNameList(skippedNames),
    });
    return { added: 0, skipped: skippedNames.length };
  }

  try {
    if (isGhostfileDbAvailable()) {
      await Promise.all(toAdd.map((file) => putFile(file)));
      await useFileStore.getState().loadFromDexie();
    } else {
      for (const file of toAdd) {
        useFileStore.getState().addFile(file);
      }
    }
  } catch (e) {
    console.error("appendStagedFiles:", e);
    toast.error("Could not save files", {
      description: "IndexedDB may be full or unavailable.",
    });
    try {
      await useFileStore.getState().loadFromDexie();
    } catch {
      /* ignore */
    }
    return { added: 0, skipped: files.length };
  }

  const n = toAdd.length;
  if (skippedNames.length > 0) {
    toast.success(`Added ${n} file${n === 1 ? "" : "s"}`);
    toast.message("Skipped duplicates", {
      description: formatNameList(skippedNames),
    });
  } else {
    toast.success(`Added ${n} file${n === 1 ? "" : "s"}`);
  }

  return { added: n, skipped: skippedNames.length };
}

/** Удалить одну запись из IndexedDB (если есть) и из zustand-стора. */
export async function removeStagedFileById(id: string): Promise<void> {
  if (isGhostfileDbAvailable()) {
    try {
      await deleteFile({ id });
    } catch (e) {
      console.error("removeStagedFileById (Dexie):", e);
      toast.error("Could not remove file", {
        description: "Check browser storage permissions.",
      });
      return;
    }
  }
  useFileStore.getState().removeFileById(id);
}

/** Очистить очередь в сторе и таблицу файлов в Dexie (если доступна). */
export async function clearAllStagedFiles(): Promise<void> {
  await useFileStore.getState().clearFiles();
  toast.success("Queue cleared");
}
