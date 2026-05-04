"use client";

import { ChevronDown, ChevronUp, Info } from "lucide-react";

import InspectorFilePreview from "@/components/custom/file-viewer/inspector-file-preview";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/format-bytes";
import { getViewableFileKind } from "@/lib/file-kind";
import { cn } from "@/lib/utils";
import { useFileStore } from "@/store/use-store-files";
import { useWorkspaceUi } from "@/store/use-workspace-ui";

export default function InspectorPanel() {
  const stagedFiles = useFileStore((s) => s.stagedFiles);
  const loaded = useFileStore((s) => s.filesLoadedFromDexie);
  const selectedEntryId = useWorkspaceUi((s) => s.selectedEntryId);
  const viewerTabs = useWorkspaceUi((s) => s.viewerTabs);
  const detailsCollapsed = useWorkspaceUi((s) => s.inspectorDetailsCollapsed);
  const toggleInspectorDetailsCollapsed = useWorkspaceUi(
    (s) => s.toggleInspectorDetailsCollapsed,
  );
  const entry =
    selectedEntryId !== null
      ? stagedFiles.find((e) => e.id === selectedEntryId)
      : undefined;

  if (!loaded) {
    return (
      <p className="font-mono text-[10px] text-muted-foreground">
        Loading queue…
      </p>
    );
  }

  if (!entry) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-2 sm:gap-3">
        <div className="shrink-0">
          <p className="font-sans text-xs font-medium text-foreground sm:text-sm">
            No selection
          </p>
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-muted-foreground sm:text-[11px]">
            Tap a file in the queue for metadata. Use{" "}
            <span className="text-foreground/90">Open preview</span> in Actions
            &amp; tools to open a tab here.
          </p>
        </div>
        {viewerTabs.length > 0 ? (
          <InspectorFilePreview />
        ) : null}
      </div>
    );
  }

  const { file } = entry;
  const kind = getViewableFileKind(file);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 sm:gap-3">
      <div
        className={cn(
          "flex shrink-0 rounded-none border-2 border-border bg-muted/25",
          detailsCollapsed
            ? "justify-end px-2 py-1.5 sm:px-3 sm:py-2"
            : "flex-col gap-2 px-2 py-2 sm:px-3",
        )}
      >
        {detailsCollapsed ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 min-w-11 shrink-0 touch-manipulation rounded-none border-2 p-0 sm:h-9 sm:min-w-0 sm:px-2"
            onClick={toggleInspectorDetailsCollapsed}
            aria-expanded={false}
            aria-label="Show file details"
            title="Show file details"
          >
            <ChevronDown className="size-4 sm:mr-1" strokeWidth={2} />
            <span className="hidden min-[400px]:inline font-mono text-[10px] font-bold uppercase tracking-wider">
              Details
            </span>
          </Button>
        ) : (
          <>
            <div className="flex min-h-11 items-start gap-2 sm:min-h-0">
              <div className="min-w-0 flex-1 pt-0.5">
                <p
                  className="wrap-break-word font-sans text-sm font-semibold leading-snug text-foreground"
                  title={file.name}
                >
                  {file.name}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-11 min-w-11 shrink-0 touch-manipulation rounded-none border-2 p-0 sm:h-9 sm:min-w-0 sm:px-2"
                onClick={toggleInspectorDetailsCollapsed}
                aria-expanded
                aria-label="Hide file details to expand preview"
                title="Hide file details (more room for preview)"
              >
                <ChevronUp className="size-4 sm:mr-1" strokeWidth={2} />
                <span className="hidden min-[400px]:inline font-mono text-[10px] font-bold uppercase tracking-wider">
                  Hide
                </span>
              </Button>
            </div>

            <dl className="space-y-2 font-mono text-[10px] leading-relaxed text-muted-foreground sm:space-y-2.5">
              <div className="flex justify-between gap-2 border-b border-border pb-1.5 sm:pb-1">
                <dt className="text-muted-foreground/90">size</dt>
                <dd>{formatBytes(file.size)}</dd>
              </div>
              <div className="flex justify-between gap-2 border-b border-border pb-1.5 sm:pb-1">
                <dt className="text-muted-foreground/90">type</dt>
                <dd className="max-w-[60%] break-all text-right sm:max-w-[65%]">
                  {file.type || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-2 border-b border-border pb-1 sm:pb-0">
                <dt className="text-muted-foreground/90">preview</dt>
                <dd className="text-right uppercase tracking-wide">
                  {kind ?? "—"}
                </dd>
              </div>
            </dl>
            {kind === "pdf" ? (
              <p className="flex items-start gap-1.5 font-mono text-[10px] leading-relaxed text-muted-foreground">
                <Info
                  className="mt-0.5 size-3.5 shrink-0 text-primary/80"
                  strokeWidth={2}
                  aria-hidden
                />
                <span>
                  Use{" "}
                  <strong className="text-foreground/90">Open preview</strong> in
                  Actions &amp; tools to show the PDF below.
                </span>
              </p>
            ) : kind === "code" ? (
              <p className="flex items-start gap-1.5 font-mono text-[10px] leading-relaxed text-muted-foreground">
                <Info
                  className="mt-0.5 size-3.5 shrink-0 text-primary/80"
                  strokeWidth={2}
                  aria-hidden
                />
                <span>
                  Use{" "}
                  <strong className="text-foreground/90">Open preview</strong> in
                  Actions &amp; tools to edit and download from the Inspector.
                </span>
              </p>
            ) : (
              <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
                Built-in preview supports PDF and text/code files.
              </p>
            )}
          </>
        )}
      </div>

      {viewerTabs.length > 0 ? (
        <InspectorFilePreview />
      ) : null}
    </div>
  );
}
