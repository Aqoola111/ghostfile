"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { usePanelRef } from "react-resizable-panels";

import Dropdown from "@/components/custom/dropzone";
import FileQueueAddStrip from "@/components/custom/file-queue-add-strip";
import FileQueuePanel from "@/components/custom/file-queue-panel";
import InspectorPanel from "@/components/custom/inspector-panel";
import RailScrollBody from "@/components/custom/rail-scroll-body";
import ToolsPanel from "@/components/custom/tools-panel";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { appendStagedFiles, clearAllStagedFiles } from "@/lib/file-queue-sync";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { useFileStore } from "@/store/use-store-files";
import { useWorkspaceUi } from "@/store/use-workspace-ui";

/** `ingress` — полноэкранный дроп; `workspace` — панели. */
type Phase = "ingress" | "workspace";

function panelShell({
  title,
  subtitle,
  content,
  footer,
  railResizeHint,
  railScroll,
  bodyVariant = "scroll",
}: {
  title: string;
  subtitle: string;
  content?: React.ReactNode;
  /** Закреплённый низ (напр. компактный дроп для новых файлов). */
  footer?: ReactNode;
  /** Collapsible side rails: show affordance for drag-to-collapse */
  railResizeHint?: boolean;
  /** Левая/правая колонка: скролл без полос при свёрнутом rail */
  railScroll?: "queue" | "tools";
  /** `fill` — колонка растягивает контент (инспектор + превью), без общего scroll body */
  bodyVariant?: "scroll" | "fill";
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-2 border-border bg-card",
        "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--gf-accent)_12%,transparent)]",
      )}
    >
      <header className="flex min-h-0 min-w-0 shrink-0 items-start justify-between gap-2 overflow-x-hidden border-b-2 border-border px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {subtitle}
          </p>
          <p className="font-sans text-sm font-semibold tracking-tight text-foreground">
            {title}
          </p>
        </div>
        {railResizeHint ? (
          <span
            className="mt-0.5 flex shrink-0 items-center gap-1 text-muted-foreground"
            title="Drag the grip between columns to resize. Pull further past the minimum width to collapse this rail."
          >
            <GripVertical className="size-4 opacity-70" strokeWidth={2} aria-hidden />
          </span>
        ) : null}
      </header>
      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden font-mono text-xs text-muted-foreground",
          bodyVariant === "fill"
            ? "min-h-0 overflow-hidden p-3"
            : railScroll
              ? "min-h-0 overflow-hidden"
              : cn("overflow-y-auto overscroll-y-contain p-3"),
        )}
      >
        {bodyVariant === "fill" ? (
          (content ?? <p className="whitespace-pre-wrap">[placeholder]</p>)
        ) : railScroll ? (
          <RailScrollBody rtlScrollbar={railScroll === "queue"}>
            {content ?? <p className="whitespace-pre-wrap">[placeholder]</p>}
          </RailScrollBody>
        ) : (
          (content ?? <p className="whitespace-pre-wrap">[placeholder]</p>)
        )}
      </div>
      {footer ? (
        <div className="shrink-0 border-t-2 border-border bg-card/95 p-2">{footer}</div>
      ) : null}
    </div>
  );
}

function toggleRailCollapse(panelRef: ReturnType<typeof usePanelRef>) {
  const api = panelRef.current;
  if (!api) return;
  if (api.isCollapsed()) api.expand();
  else api.collapse();
}

export default function HomeWorkspace() {
  /** Пока false — не показываем дропзон, чтобы не мелькал кадр «ingress» до знания очереди из Dexie. */
  const [uiReady, setUiReady] = useState(false);
  const [phase, setPhase] = useState<Phase>("ingress");
  const queuePanelRef = usePanelRef();
  const toolsPanelRef = usePanelRef();
  const loadFromDexie = useFileStore((s) => s.loadFromDexie);
  const queueEmpty = useFileStore((s) => s.stagedFiles.length === 0);
  const stagedFiles = useFileStore((s) => s.stagedFiles);
  const selectedEntryId = useWorkspaceUi((s) => s.selectedEntryId);
  const setSelectedEntryId = useWorkspaceUi((s) => s.setSelectedEntryId);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await loadFromDexie();
      if (cancelled) return;
      const hasQueue = useFileStore.getState().stagedFiles.length > 0;
      setPhase(hasQueue ? "workspace" : "ingress");
      setUiReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadFromDexie]);

  useEffect(() => {
    if (!selectedEntryId) return;
    if (!stagedFiles.some((e) => e.id === selectedEntryId)) {
      setSelectedEntryId(null);
    }
  }, [stagedFiles, selectedEntryId, setSelectedEntryId]);

  const handleAccepted = useCallback(async (files: File[]) => {
    await appendStagedFiles(files);
    setPhase("workspace");
  }, []);

  /** Вертикальный стек только на узких экранах; планшеты остаются в 3 колонки как раньше */
  const stackWorkspacePanels = useMediaQuery("(max-width: 639px)");

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[1800px] flex-1 basis-0 flex-col overflow-hidden px-3 py-2 sm:px-4">
      {!uiReady ? (
        <div className="flex min-h-[min(40dvh,280px)] flex-1 flex-col items-center justify-center">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            restoring session
          </p>
        </div>
      ) : phase === "ingress" ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto py-4">
          <Dropdown onSuccess={handleAccepted} />
        </div>
      ) : (
        <div className="flex h-full min-h-0 flex-1 basis-0 flex-col gap-2 overflow-hidden">
          <div className="flex shrink-0 flex-col gap-2 border-2 border-border bg-card px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <p className="flex min-h-0 items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              <GripVertical className="size-4 shrink-0 text-primary/80" strokeWidth={2} aria-hidden />
              <span className="leading-snug max-[639px]:text-[9px]">
                <span className="hidden sm:inline">
                  session — drag column grips to resize
                </span>
                <span className="sm:hidden">Drag edges to resize panels</span>
              </span>
            </p>
            <div className="flex w-full shrink-0 flex-col gap-2 min-[400px]:flex-row min-[400px]:flex-wrap min-[400px]:justify-end sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11 touch-manipulation rounded-none border-2 font-mono text-xs sm:min-h-9"
                onClick={() => setPhase("ingress")}
              >
                Add more files
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={queueEmpty}
                className="min-h-11 touch-manipulation rounded-none border-2 font-mono text-xs sm:min-h-9"
                onClick={() => void clearAllStagedFiles()}
              >
                Delete all files
              </Button>
            </div>
          </div>

          {/* v4: numeric panel sizes are px — use "%" strings for fractions of the group */}
          <ResizablePanelGroup
            key={stackWorkspacePanels ? "stack" : "row"}
            orientation={stackWorkspacePanels ? "vertical" : "horizontal"}
            className={cn(
              "flex h-full min-h-0 min-w-0 flex-1 basis-0 overflow-hidden rounded-none",
              stackWorkspacePanels && "touch-pan-y",
            )}
          >
            <ResizablePanel
              id="queue"
              panelRef={queuePanelRef}
              defaultSize={stackWorkspacePanels ? "30%" : "22%"}
              minSize={stackWorkspacePanels ? "18%" : "14%"}
              maxSize={stackWorkspacePanels ? "44%" : "38%"}
              collapsedSize="10%"
              collapsible
              className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden"
            >
              {panelShell({
                title: "File queue",
                subtitle: "left.rail",
                railResizeHint: true,
                railScroll: "queue",
                content: <FileQueuePanel />,
                footer: <FileQueueAddStrip />,
              })}
            </ResizablePanel>

            <ResizableHandle
              withHandle
              disableDoubleClick
              title="Drag to resize. Keep dragging past the minimum width to collapse the left rail. Double-click toggles collapse."
              onDoubleClick={(e) => {
                e.preventDefault();
                toggleRailCollapse(queuePanelRef);
              }}
            />

            <ResizablePanel
              id="inspector"
              defaultSize={stackWorkspacePanels ? "46%" : "52%"}
              minSize={stackWorkspacePanels ? "32%" : "30%"}
              className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden"
            >
              {panelShell({
                title: "Inspector",
                subtitle: "center.stage",
                bodyVariant: "fill",
                content: <InspectorPanel />,
              })}
            </ResizablePanel>

            <ResizableHandle
              withHandle
              disableDoubleClick
              title="Drag to resize. Keep dragging past the minimum width to collapse the right rail. Double-click toggles collapse."
              onDoubleClick={(e) => {
                e.preventDefault();
                toggleRailCollapse(toolsPanelRef);
              }}
            />

            <ResizablePanel
              id="tools"
              panelRef={toolsPanelRef}
              defaultSize={stackWorkspacePanels ? "24%" : "26%"}
              minSize="14%"
              maxSize="40%"
              collapsedSize="10%"
              collapsible
              className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden"
            >
              {panelShell({
                title: "Actions & tools",
                subtitle: "right.rail",
                railResizeHint: true,
                railScroll: "tools",
                content: <ToolsPanel />,
              })}
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      )}
    </div>
  );
}
