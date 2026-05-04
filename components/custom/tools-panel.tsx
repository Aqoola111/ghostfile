"use client";

import { FileText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getViewableFileKind } from "@/lib/file-kind";
import { useFileStore } from "@/store/use-store-files";
import { useWorkspaceUi } from "@/store/use-workspace-ui";

export default function ToolsPanel() {
  const stagedFiles = useFileStore((s) => s.stagedFiles);
  const loaded = useFileStore((s) => s.filesLoadedFromDexie);
  const selectedEntryId = useWorkspaceUi((s) => s.selectedEntryId);
  const openOrFocusViewTabByEntryId = useWorkspaceUi(
    (s) => s.openOrFocusViewTabByEntryId,
  );

  const selected =
    selectedEntryId !== null
      ? stagedFiles.find((e) => e.id === selectedEntryId)
      : undefined;
  const viewKind = selected ? getViewableFileKind(selected.file) : null;
  const canOpenPreview = viewKind === "pdf" || viewKind === "code";

  if (!loaded) {
    return (
      <p className="font-mono text-[10px] text-muted-foreground">
        Loading queue…
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="font-sans text-xs font-medium text-foreground">
        Quick actions
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!canOpenPreview}
        className="min-h-11 w-full touch-manipulation justify-center gap-2 rounded-none border-2 font-mono text-xs sm:min-h-9"
        onClick={() => {
          if (!selectedEntryId || !canOpenPreview) return;
          const ok = openOrFocusViewTabByEntryId(selectedEntryId, stagedFiles);
          if (!ok) {
            toast.error("Preview unavailable", {
              description:
                "This file type cannot be opened in the Inspector preview.",
            });
          }
        }}
      >
        <FileText className="size-4 shrink-0" strokeWidth={2} aria-hidden />
        Open preview
      </Button>

      {!selected ? (
        <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
          Select a file in the queue to enable actions.
        </p>
      ) : !canOpenPreview ? (
        <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
          Built-in preview supports PDF and text/code files (by type or
          extension).
        </p>
      ) : (
        <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
          Opens a tab in the Inspector — PDF viewer or editor with download.
        </p>
      )}
    </div>
  );
}
