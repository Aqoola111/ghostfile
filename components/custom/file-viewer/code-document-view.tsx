"use client";

import dynamic from "next/dynamic";
import { Download } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { monacoLanguageFromFilename } from "@/lib/monaco-language";
import { cn } from "@/lib/utils";
import { useWorkspaceUi } from "@/store/use-workspace-ui";

function getCodeDraft(entryId: string): string | undefined {
  return useWorkspaceUi.getState().codeDraftByEntryId[entryId];
}

const MAX_TEXT_BYTES = 4 * 1024 * 1024;

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react"),
  {
    ssr: false,
    loading: () => (
      <p className="font-mono text-[10px] text-muted-foreground">
        Loading editor…
      </p>
    ),
  },
);

function downloadName(originalName: string, edited: boolean): string {
  if (!edited) return originalName;
  const lastDot = originalName.lastIndexOf(".");
  if (lastDot <= 0) {
    return `${originalName}-edited`;
  }
  return `${originalName.slice(0, lastDot)}-edited${originalName.slice(lastDot)}`;
}

export default function CodeDocumentView({
  entryId,
  file,
  className,
}: {
  entryId: string;
  file: File;
  className?: string;
}) {
  const codeDraftByEntryId = useWorkspaceUi((s) => s.codeDraftByEntryId);
  const setCodeDraft = useWorkspaceUi((s) => s.setCodeDraft);
  const { resolvedTheme } = useTheme();
  const [initial, setInitial] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loadGen = useRef(0);

  const stored = codeDraftByEntryId[entryId];
  const value = stored ?? initial ?? "";

  const language = useMemo(
    () => monacoLanguageFromFilename(file.name),
    [file.name],
  );

  const editorTheme =
    resolvedTheme === "dark" ? "vs-dark" : "light";

  useEffect(() => {
    if (file.size > MAX_TEXT_BYTES) {
      setError(
        `File is larger than ${(MAX_TEXT_BYTES / 1024 / 1024).toFixed(0)} MB — open in an external editor.`,
      );
      setLoading(false);
      return;
    }
    const gen = ++loadGen.current;
    setError(null);
    setLoading(true);
    setInitial(null);
    void (async () => {
      try {
        const text = await file.text();
        if (loadGen.current !== gen) return;
        setInitial(text);
        if (getCodeDraft(entryId) === undefined) {
          setCodeDraft(entryId, text);
        }
      } catch (e) {
        if (loadGen.current !== gen) return;
        setError(e instanceof Error ? e.message : "Could not read file");
      } finally {
        if (loadGen.current === gen) setLoading(false);
      }
    })();
  }, [file, entryId, setCodeDraft]);

  const dirty = initial !== null && value !== initial;

  const onChange = useCallback(
    (t: string) => {
      setCodeDraft(entryId, t);
    },
    [entryId, setCodeDraft],
  );

  const onDownload = useCallback(() => {
    const blob = new Blob([value], {
      type:
        file.type && file.type !== "application/octet-stream"
          ? file.type
          : "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName(file.name, dirty);
    a.click();
    URL.revokeObjectURL(url);
  }, [value, file.name, file.type, dirty]);

  if (error) {
    return <p className="font-mono text-xs text-destructive">{error}</p>;
  }

  if (loading || initial === null) {
    return (
      <p className="font-mono text-[10px] text-muted-foreground">
        Loading text…
      </p>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col gap-2",
        className,
      )}
    >
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-9 touch-manipulation gap-2 rounded-none border-2 font-mono text-xs"
          onClick={onDownload}
        >
          <Download className="size-4" strokeWidth={2} aria-hidden />
          {dirty ? "Download edited" : "Download"}
        </Button>
        {dirty ? (
          <span className="font-mono text-[10px] text-primary">
            Unsaved edits
          </span>
        ) : null}
      </div>

      <div
        className={cn(
          "flex w-full flex-1 overflow-hidden rounded-none border-2 border-border",
          "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--gf-accent)_8%,transparent)]",
          "h-[min(58dvh,28rem)] min-h-48",
        )}
      >
        <MonacoEditor
          height="100%"
          language={language}
          theme={editorTheme}
          value={value}
          path={`ghostfile://${entryId}/${file.name}`}
          onChange={(v) => onChange(v ?? "")}
          options={{
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 12,
            lineNumbers: "on",
            wordWrap: "on",
            scrollBeyondLastLine: false,
            tabSize: 2,
            renderWhitespace: "none",
            folding: true,
            padding: { top: 8, bottom: 8 },
          }}
        />
      </div>
    </div>
  );
}
