"use client";

import CodeDocumentView from "@/components/custom/file-viewer/code-document-view";
import PdfDocumentView from "@/components/custom/file-viewer/pdf-document-view";
import type { ViewerTab } from "@/store/use-workspace-ui";

/** Контент вкладки: по `kind` подключаются разные просмотрщики (PDF сейчас, позже image/text). */
export default function ViewerTabPane({
  tab,
  file,
}: {
  tab: ViewerTab;
  file: File | undefined;
}) {
  if (!file) {
    return (
      <p className="font-mono text-xs text-muted-foreground">
        File is no longer in the queue.
      </p>
    );
  }

  switch (tab.kind) {
    case "pdf":
      return (
        <PdfDocumentView
          file={file}
          className="min-h-0 min-w-0 flex-1"
        />
      );
    case "code":
      return (
        <CodeDocumentView
          entryId={tab.entryId}
          file={file}
          className="min-h-0 min-w-0 flex-1"
        />
      );
    default:
      return (
        <p className="font-mono text-xs text-muted-foreground">
          Preview for “{tab.kind}” is not implemented yet.
        </p>
      );
  }
}
