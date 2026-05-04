import { create } from "zustand";

import {
  deleteAllFiles,
  getAllFileRows,
  isGhostfileDbAvailable,
} from "@/lib/dexie-utils";

export type StagedFileEntry = { id: string; file: File };

interface FileStore {
  stagedFiles: StagedFileEntry[];
  /** После первой попытки подтянуть IndexedDB (или зафиксировать режим без БД). */
  filesLoadedFromDexie: boolean;
  loadFromDexie: () => Promise<void>;
  addFile: (file: File) => void;
  removeFileById: (id: string) => void;
  clearFiles: () => Promise<void>;
}

export const useFileStore = create<FileStore>((set, get) => ({
  stagedFiles: [],
  filesLoadedFromDexie: false,

  loadFromDexie: async () => {
    if (!isGhostfileDbAvailable()) {
      set({ filesLoadedFromDexie: true });
      return;
    }
    try {
      const rows = await getAllFileRows();
      set({
        stagedFiles: rows.map((r) => ({ id: r.id, file: r.file })),
        filesLoadedFromDexie: true,
      });
    } catch (e) {
      console.error("loadFromDexie:", e);
      set({ filesLoadedFromDexie: true });
    }
  },

  addFile: (file) =>
    set((state) => ({
      stagedFiles: [
        ...state.stagedFiles,
        { id: crypto.randomUUID(), file },
      ],
    })),

  removeFileById: (id) =>
    set((state) => ({
      stagedFiles: state.stagedFiles.filter((e) => e.id !== id),
    })),

  clearFiles: async () => {
    if (isGhostfileDbAvailable()) {
      try {
        await deleteAllFiles();
      } catch (e) {
        console.error("clearFiles (Dexie):", e);
      }
    } else {
      set({ stagedFiles: [] });
    }
    await get().loadFromDexie();
  },
}));
