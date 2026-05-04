"use client";

import { useCallback } from "react";
import Dropzone, { type DropEvent, type FileRejection } from "react-dropzone";
import { Plus, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { appendStagedFiles } from "@/lib/file-queue-sync";
import { cn } from "@/lib/utils";

export default function FileQueueAddStrip() {
  const onDrop = useCallback(
    (
      acceptedFiles: File[],
      fileRejections: FileRejection[],
      _e: DropEvent,
    ) => {
      if (acceptedFiles.length > 0) {
        void appendStagedFiles(acceptedFiles);
      }
      if (fileRejections.length > 0) {
        const first = fileRejections[0];
        const msg =
          first.errors[0]?.message ??
          (first.errors[0]?.code === "file-invalid-type"
            ? "File type not allowed"
            : "Rejected by drop rules");
        const extra =
          fileRejections.length > 1
            ? ` (+${fileRejections.length - 1} more)`
            : "";
        toast.warning(
          acceptedFiles.length > 0
            ? "Some files were skipped"
            : "Could not add to queue",
          {
            description: `${first.file.name}: ${msg}${extra}`,
          },
        );
      }
    },
    [],
  );

  return (
    <Dropzone onDrop={onDrop}>
      {({ getRootProps, getInputProps, isDragActive, isFocused, open }) => (
        <div
          {...getRootProps({
            className: cn(
              "group relative flex cursor-pointer flex-col gap-2 border-2 border-dashed border-border bg-muted/20 px-2 py-2 transition-[border-color,background-color] duration-150 ease-out",
              "outline-none focus-within:border-primary/60 focus-within:bg-primary/5",
              isDragActive && "border-primary bg-primary/10",
              isFocused && "border-primary/50",
            ),
          })}
        >
          <input {...getInputProps()} />
          <div className="flex items-center gap-2">
            <Upload
              className="size-4 shrink-0 text-muted-foreground group-hover:text-primary"
              strokeWidth={2}
              aria-hidden
            />
            <p className="min-w-0 flex-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {isDragActive ? "Drop to add" : "Add more to queue"}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 shrink-0 rounded-none border-2 px-2 font-mono text-[10px]"
              onClick={(e) => {
                e.stopPropagation();
                open();
              }}
            >
              <Plus className="size-3.5" strokeWidth={2} aria-hidden />
              <span className="sr-only">Browse</span>
            </Button>
          </div>
        </div>
      )}
    </Dropzone>
  );
}
