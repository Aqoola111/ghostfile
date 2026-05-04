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
import { removeStagedFileById } from "@/lib/file-queue-sync";
import { cn } from "@/lib/utils";
import type { StagedFileEntry } from "@/store/use-store-files";

const REMOVE_MS = 240;

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"] as const;
  const i = Math.min(
    sizes.length - 1,
    Math.floor(Math.log(bytes) / Math.log(k)),
  );
  return `${parseFloat((bytes / k ** i).toFixed(i > 0 ? 1 : 0))} ${sizes[i]}`;
}

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
      className={cn(
        "group flex gap-3 border-2 border-border bg-card/80 p-2.5 pr-1 transition-[transform,opacity,filter] duration-200 ease-out",
        "hover:border-primary/40 hover:bg-card",
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
        onClick={runRemove}
      >
        <Trash2 className="size-4" strokeWidth={2} />
      </Button>
    </div>
  );
}
