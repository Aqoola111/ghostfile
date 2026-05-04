"use client";

import { useCallback } from "react";
import Dropzone, { type DropEvent, type FileRejection } from "react-dropzone";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { HoverRadialText } from "@/components/custom/hover-radial-text";
import { cn } from "@/lib/utils";

export interface DropzoneProps {
  onSuccess?: (files: File[]) => void;
  onError?: (error: Error) => void;
}

export default function Dropdown({ onSuccess, onError }: DropzoneProps) {
  const onDrop = useCallback(
    (
      acceptedFiles: File[],
      fileRejections: FileRejection[],
      event: DropEvent,
    ) => {
      if (acceptedFiles.length > 0) {
        onSuccess?.(acceptedFiles);
      } else if (fileRejections.length > 0) {
        onError?.(new Error("No files accepted (rejected by rules)"));
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
            : "Files not accepted",
          {
            description: `${first.file.name}: ${msg}${extra}`,
          },
        );
      }
    },
    [onSuccess, onError],
  );

  return (
    <Dropzone onDrop={onDrop}>
      {({
        getRootProps,
        getInputProps,
        isDragActive,
        isFocused,
        open,
        rootRef,
      }) => {
        const title = isDragActive
          ? "Release to analyze"
          : "Drop a file to inspect";
        return (
          <div className="w-full max-w-3xl">
            <div
              {...getRootProps({
                className: cn(
                  "group relative flex min-h-[min(40vh,320px)] w-full cursor-pointer flex-col items-center justify-center gap-6 border-2 border-border bg-card px-8 py-12 transition-[border-color,background-color,box-shadow] duration-150 ease-out",
                  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isDragActive &&
                    "border-primary bg-primary/5 shadow-[inset_0_0_0_1px_var(--gf-accent)]",
                  isFocused && "border-primary/80",
                ),
              })}
            >
              <input {...getInputProps()} />

              <span
                className="pointer-events-none absolute left-3 top-3 h-4 w-4 border-l-2 border-t-2 border-primary opacity-80 transition-opacity duration-150 group-hover:opacity-100"
                aria-hidden
              />
              <span
                className="pointer-events-none absolute right-3 top-3 h-4 w-4 border-r-2 border-t-2 border-primary opacity-80 transition-opacity duration-150 group-hover:opacity-100"
                aria-hidden
              />
              <span
                className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b-2 border-l-2 border-primary opacity-80 transition-opacity duration-150 group-hover:opacity-100"
                aria-hidden
              />
              <span
                className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2 border-primary opacity-80 transition-opacity duration-150 group-hover:opacity-100"
                aria-hidden
              />

              <div className="absolute left-3 top-9 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                ingress
              </div>

              <Upload
                className="size-12 text-muted-foreground transition-colors duration-150 group-hover:text-primary"
                strokeWidth={1.5}
                aria-hidden
              />

              <div className="flex max-w-md flex-col items-center gap-2 text-center">
                <HoverRadialText
                  key={title}
                  interactionRef={rootRef}
                  splitBy="character"
                  influenceRadius={180}
                  maxStagger={0.42}
                  segmentDuration={0.2}
                  toColor="var(--primary)"
                  className="font-sans text-lg font-semibold leading-tight tracking-tight text-foreground"
                >
                  {title}
                </HoverRadialText>
                <HoverRadialText
                  interactionRef={rootRef}
                  splitBy="word"
                  influenceRadius={220}
                  maxStagger={0.38}
                  segmentDuration={0.18}
                  toColor="var(--primary)"
                  className="font-sans text-sm leading-relaxed text-muted-foreground"
                >
                  Binary fingerprint, metadata, and purge run client-side only.
                  No upload to a server.
                </HoverRadialText>
              </div>

              <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-none border-2 font-sans"
                  onClick={(e) => {
                    e.stopPropagation();
                    open();
                  }}
                >
                  Browse files
                </Button>
                <HoverRadialText
                  interactionRef={rootRef}
                  splitBy="character"
                  influenceRadius={140}
                  maxStagger={0.35}
                  segmentDuration={0.18}
                  toColor="var(--primary)"
                  className="font-mono text-xs text-muted-foreground"
                >
                  Magic-byte ID · first 16B
                </HoverRadialText>
              </div>
            </div>
          </div>
        );
      }}
    </Dropzone>
  );
}
