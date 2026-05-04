import { create } from "zustand";

import type { ViewableFileKind } from "@/lib/file-kind";
import { getViewableFileKind } from "@/lib/file-kind";
import type { StagedFileEntry } from "@/store/use-store-files";

export type ViewerTab = {
  tabId: string;
  entryId: string;
  title: string;
  kind: ViewableFileKind;
};

interface WorkspaceUiStore {
  selectedEntryId: string | null;
  setSelectedEntryId: (id: string | null) => void;

  /** Свернуть блок имени/размера/type в Inspector — больше места под PDF */
  inspectorDetailsCollapsed: boolean;
  setInspectorDetailsCollapsed: (collapsed: boolean) => void;
  toggleInspectorDetailsCollapsed: () => void;

  viewerTabs: ViewerTab[];
  activeTabId: string | null;

  /** Черновики текста для вкладок code (ключ — entryId в очереди). */
  codeDraftByEntryId: Record<string, string>;
  setCodeDraft: (entryId: string, text: string) => void;

  openOrFocusViewTab: (entry: StagedFileEntry) => boolean;
  /** Открыть просмотр по id записи очереди (если файл ещё есть в сторе). */
  openOrFocusViewTabByEntryId: (
    entryId: string,
    stagedFiles: StagedFileEntry[],
  ) => boolean;
  closeViewTab: (tabId: string) => void;
  closeViewer: () => void;
  setActiveTabId: (tabId: string) => void;
  /** Убрать вкладки, чьи файлы больше не в очереди. */
  dropStaleViewerTabs: (existingEntryIds: Set<string>) => void;
}

export const useWorkspaceUi = create<WorkspaceUiStore>((set, get) => ({
  selectedEntryId: null,
  setSelectedEntryId: (id) => set({ selectedEntryId: id }),

  inspectorDetailsCollapsed: false,
  setInspectorDetailsCollapsed: (collapsed) =>
    set({ inspectorDetailsCollapsed: collapsed }),
  toggleInspectorDetailsCollapsed: () =>
    set((s) => ({
      inspectorDetailsCollapsed: !s.inspectorDetailsCollapsed,
    })),

  viewerTabs: [],
  activeTabId: null,

  codeDraftByEntryId: {},
  setCodeDraft: (entryId, text) =>
    set((s) => ({
      codeDraftByEntryId: { ...s.codeDraftByEntryId, [entryId]: text },
    })),

  openOrFocusViewTab: (entry) => {
    const kind = getViewableFileKind(entry.file);
    if (!kind) return false;
    const existing = get().viewerTabs.find((t) => t.entryId === entry.id);
    if (existing) {
      set({ activeTabId: existing.tabId });
      return true;
    }
    const tabId = crypto.randomUUID();
    const tab: ViewerTab = {
      tabId,
      entryId: entry.id,
      title: entry.file.name,
      kind,
    };
    set((s) => ({
      viewerTabs: [...s.viewerTabs, tab],
      activeTabId: tabId,
    }));
    return true;
  },

  openOrFocusViewTabByEntryId: (entryId, stagedFiles) => {
    const entry = stagedFiles.find((e) => e.id === entryId);
    if (!entry) return false;
    return get().openOrFocusViewTab(entry);
  },

  closeViewTab: (tabId) => {
    const prev = get().viewerTabs;
    const idx = prev.findIndex((t) => t.tabId === tabId);
    if (idx < 0) return;
    const tabs = prev.filter((t) => t.tabId !== tabId);
    let nextActive = get().activeTabId;
    if (nextActive === tabId) {
      if (tabs.length === 0) nextActive = null;
      else if (idx <= 0) nextActive = tabs[0].tabId;
      else nextActive = tabs[idx - 1]?.tabId ?? tabs[0].tabId;
    }
    set({
      viewerTabs: tabs,
      activeTabId: nextActive,
    });
  },

  dropStaleViewerTabs: (existingEntryIds) => {
    const tabs = get().viewerTabs.filter((t) =>
      existingEntryIds.has(t.entryId),
    );
    let activeTabId = get().activeTabId;
    if (activeTabId && !tabs.some((t) => t.tabId === activeTabId)) {
      activeTabId = tabs[0]?.tabId ?? null;
    }
    const drafts = { ...get().codeDraftByEntryId };
    for (const id of Object.keys(drafts)) {
      if (!existingEntryIds.has(id)) {
        delete drafts[id];
      }
    }
    set({
      viewerTabs: tabs,
      activeTabId,
      codeDraftByEntryId: drafts,
    });
  },

  closeViewer: () =>
    set({ viewerTabs: [], activeTabId: null, codeDraftByEntryId: {} }),

  setActiveTabId: (tabId) => set({ activeTabId: tabId }),
}));
