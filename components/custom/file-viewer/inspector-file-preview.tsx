"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

import ViewerTabPane from "@/components/custom/file-viewer/viewer-tab-pane";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useFileStore } from "@/store/use-store-files";
import {
  useWorkspaceUi,
  type ViewerTab,
} from "@/store/use-workspace-ui";

function TabStripItem({
  tab,
  active,
  onSelect,
  onClose,
}: {
  tab: ViewerTab;
  active: boolean;
  onSelect: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className={cn(
        "flex min-h-11 shrink-0 items-stretch border-r-2 border-border sm:min-h-9",
        active &&
          "bg-card shadow-[inset_0_-2px_0_0_var(--gf-accent)]",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "max-w-[min(200px,55vw)] touch-manipulation truncate px-3 py-2 text-left font-mono text-[10px] font-bold uppercase tracking-[0.12em] outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring sm:max-w-[160px] sm:px-2",
          active ? "text-foreground" : "text-muted-foreground",
        )}
        title={tab.title}
      >
        {tab.title}
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="h-auto min-w-11 shrink-0 touch-manipulation rounded-none border-l-2 border-border px-2 text-muted-foreground hover:bg-destructive/15 hover:text-destructive sm:min-w-0 sm:px-1"
        aria-label={`Close tab ${tab.title}`}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <X className="size-3.5" strokeWidth={2} />
      </Button>
    </div>
  );
}

/** Превью файлов с вкладками — внутри колонки Inspector (не диалог). */
export default function InspectorFilePreview() {
  const stagedFiles = useFileStore((s) => s.stagedFiles);
  const viewerTabs = useWorkspaceUi((s) => s.viewerTabs);
  const activeTabId = useWorkspaceUi((s) => s.activeTabId);
  const closeViewer = useWorkspaceUi((s) => s.closeViewer);
  const closeViewTab = useWorkspaceUi((s) => s.closeViewTab);
  const setActiveTabId = useWorkspaceUi((s) => s.setActiveTabId);
  const dropStaleViewerTabs = useWorkspaceUi((s) => s.dropStaleViewerTabs);
  const detailsCollapsed = useWorkspaceUi((s) => s.inspectorDetailsCollapsed);

  useEffect(() => {
    const ids = new Set(stagedFiles.map((e) => e.id));
    dropStaleViewerTabs(ids);
  }, [stagedFiles, dropStaleViewerTabs]);

  const entryById = (entryId: string) =>
    stagedFiles.find((e) => e.id === entryId);

  const resolvedActiveId =
    activeTabId ?? viewerTabs[0]?.tabId ?? "";

  if (viewerTabs.length === 0) return null;

  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col border-t-2 border-border",
        detailsCollapsed ? "gap-1 pt-2" : "gap-2 pt-3",
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2">
        {!detailsCollapsed ? (
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Preview
          </p>
        ) : (
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/80">
            Preview
          </span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className="h-7 shrink-0 rounded-none border-2 border-transparent px-2 font-mono text-[10px] uppercase hover:border-border"
          onClick={() => closeViewer()}
        >
          Close all
        </Button>
      </div>

      <Tabs
        value={resolvedActiveId}
        onValueChange={(v) => setActiveTabId(v)}
        className="flex min-h-0 min-w-0 flex-1 flex-col gap-0"
      >
        <div className="flex shrink-0 items-stretch overflow-x-auto rounded-none border-2 border-border bg-muted/30">
          {viewerTabs.map((tab) => (
            <TabStripItem
              key={tab.tabId}
              tab={tab}
              active={tab.tabId === resolvedActiveId}
              onSelect={() => setActiveTabId(tab.tabId)}
              onClose={() => closeViewTab(tab.tabId)}
            />
          ))}
        </div>

        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col",
            detailsCollapsed ? "pt-1" : "pt-2",
          )}
        >
          {viewerTabs.map((tab) => (
            <TabsContent
              key={tab.tabId}
              value={tab.tabId}
              className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden outline-none data-[state=inactive]:hidden"
            >
              <ViewerTabPane
                tab={tab}
                file={entryById(tab.entryId)?.file}
              />
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
