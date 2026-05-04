"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { usePanelRef } from "react-resizable-panels";

import Dropdown from "@/components/custom/dropzone";
import FileQueueAddStrip from "@/components/custom/file-queue-add-strip";
import FileQueuePanel from "@/components/custom/file-queue-panel";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { appendStagedFiles, clearAllStagedFiles } from "@/lib/file-queue-sync";
import { cn } from "@/lib/utils";
import { useFileStore } from "@/store/use-store-files";

/** `ingress` — полноэкранный дроп; `workspace` — панели. */
type Phase = "ingress" | "workspace";

function panelShell({
  title,
  subtitle,
  content,
  footer,
  railResizeHint,
  /** Скроллбар слева (RTL-обёртка), чтобы не перекрывать иконки справа. */
  scrollOpposite,
}: {
  title: string;
  subtitle: string;
  content?: React.ReactNode;
  /** Закреплённый низ (напр. компактный дроп для новых файлов). */
  footer?: ReactNode;
  /** Collapsible side rails: show affordance for drag-to-collapse */
  railResizeHint?: boolean;
  scrollOpposite?: boolean;
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
          "flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain font-mono text-xs text-muted-foreground",
          scrollOpposite
            ? "gf-queue-scroll p-3 [direction:rtl]"
            : "p-3",
        )}
      >
        {scrollOpposite ? (
          <div className="min-w-0 w-full text-left [direction:ltr]">
            {content ?? <p className="whitespace-pre-wrap">[placeholder]</p>}
          </div>
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

  const handleAccepted = useCallback(async (files: File[]) => {
    await appendStagedFiles(files);
    setPhase("workspace");
  }, []);

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[1800px] flex-1 basis-0 flex-col overflow-hidden px-4 py-2">
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
          <div className="flex shrink-0 items-center justify-between gap-3 border-2 border-border bg-card px-3 py-2">
            <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              <GripVertical className="size-4 text-primary/80" strokeWidth={2} aria-hidden />
              <span>session — drag column grips to resize</span>
            </p>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-none border-2 font-mono text-xs"
                onClick={() => setPhase("ingress")}
              >
                Add more files
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={queueEmpty}
                className="rounded-none border-2 font-mono text-xs"
                onClick={() => void clearAllStagedFiles()}
              >
                Delete all files
              </Button>
            </div>
          </div>

          <ResizablePanelGroup
            orientation="horizontal"
            className="flex h-full min-h-0 min-w-0 flex-1 basis-0 overflow-hidden rounded-none"
          >
            <ResizablePanel
              id="queue"
              panelRef={queuePanelRef}
              defaultSize={200}
              minSize={300}
              maxSize={400}
              collapsedSize={10}
              collapsible
              className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden"
            >
              {panelShell({
                title: "File queue",
                subtitle: "left.rail",
                railResizeHint: true,
                scrollOpposite: true,
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
              defaultSize={42}
              minSize={32}
              className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden"
            >
              {panelShell({ title: "Inspector", subtitle: "center.stage" })}
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
              defaultSize={120}
              minSize={120}
              maxSize={200}
              collapsedSize={10}
              collapsible
              className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden"
            >
              {panelShell({
                title: "Actions & tools",
                subtitle: "right.rail",
                railResizeHint: true,
              })}
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      )}
    </div>
  );
}
