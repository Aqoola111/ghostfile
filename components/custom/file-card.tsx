"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Archive,
  File,
  FileAudio,
  FileCode2,
  FileImage,
  FileText,
  FileVideo,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/format-bytes";
import { removeStagedFileById } from "@/lib/file-queue-sync";
import { cn } from "@/lib/utils";
import type { StagedFileEntry } from "@/store/use-store-files";
import { useWorkspaceUi } from "@/store/use-workspace-ui";

const REMOVE_MS = 240;

function QueueFileIcon({ file }: { file: File }) {
  const mime = file.type.toLowerCase();
  const lower = file.name.toLowerCase();
  const ext = (() => {
    const d = lower.lastIndexOf(".");
    return d >= 0 ? lower.slice(d) : "";
  })();

  const iconCls = "size-9 shrink-0 text-primary";

  if (mime.startsWith("image/")) {
    return <FileImage className={iconCls} strokeWidth={1.5} aria-hidden />;
  }
  if (mime.startsWith("video/")) {
    return <FileVideo className={iconCls} strokeWidth={1.5} aria-hidden />;
  }
  if (mime.startsWith("audio/")) {
    return <FileAudio className={iconCls} strokeWidth={1.5} aria-hidden />;
  }
  if (
    mime === "application/zip" ||
    mime === "application/x-zip-compressed" ||
    mime.includes("tar") ||
    [".zip", ".rar", ".7z", ".gz", ".tgz"].includes(ext)
  ) {
    return <Archive className={iconCls} strokeWidth={1.5} aria-hidden />;
  }
  if (
    mime.startsWith("text/") ||
    mime.includes("json") ||
    mime.includes("javascript") ||
    mime.includes("typescript") ||
    [".ts", ".tsx", ".js", ".jsx", ".json", ".yaml", ".yml", ".md", ".css", ".html", ".xml"].some(
      (e) => lower.endsWith(e),
    )
  ) {
    return <FileCode2 className={iconCls} strokeWidth={1.5} aria-hidden />;
  }
  if (mime === "application/pdf" || ext === ".pdf") {
    return <FileText className={iconCls} strokeWidth={1.5} aria-hidden />;
  }
  return <File className={iconCls} strokeWidth={1.5} aria-hidden />;
}

export default function FileCard({ entry }: { entry: StagedFileEntry }) {
  const { id, file } = entry;
  const selectedEntryId = useWorkspaceUi((s) => s.selectedEntryId);
  const setSelectedEntryId = useWorkspaceUi((s) => s.setSelectedEntryId);
  const isSelected = selectedEntryId === id;
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<number | null>(null);

  const runRemove = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      void removeStagedFileById(id);
    }, REMOVE_MS);
  }, [exiting, id]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setSelectedEntryId(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setSelectedEntryId(id);
        }
      }}
      className={cn(
        "group flex cursor-pointer gap-3 border-2 border-border bg-card/80 p-2.5 pr-1 transition-[transform,opacity,filter,border-color,box-shadow] duration-200 ease-out",
        "hover:border-primary/40 hover:bg-card",
        isSelected &&
          "border-primary/70 bg-card shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--gf-accent)_22%,transparent)]",
        exiting && "pointer-events-none translate-x-3 scale-[0.96] opacity-0 blur-[0.5px]",
      )}
    >
      <QueueFileIcon file={file} />
      <div className="min-w-0 flex-1 py-0.5">
        <p className="truncate font-sans text-xs font-semibold leading-tight text-foreground">
          {file.name}
        </p>
        <p className="mt-1 font-mono text-[10px] leading-none text-muted-foreground">
          {formatBytes(file.size)}
          {file.type ? (
            <span className="text-muted-foreground/80"> · {file.type}</span>
          ) : null}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 rounded-none text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
        aria-label={`Remove ${file.name}`}
        disabled={exiting}
        onClick={(e) => {
          e.stopPropagation();
          runRemove();
        }}
      >
        <Trash2 className="size-4" strokeWidth={2} />
      </Button>
    </div>
  );
}
