"use client";

import FileCard from "@/components/custom/file-card";
import { useFileStore } from "@/store/use-store-files";

export default function FileQueuePanel() {
  const stagedFiles = useFileStore((s) => s.stagedFiles);
  const loaded = useFileStore((s) => s.filesLoadedFromDexie);

  if (!loaded) {
    return (
      <p className="font-mono text-[10px] text-muted-foreground">Loading queue…</p>
    );
  }

  if (stagedFiles.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="font-sans text-xs font-medium text-foreground">Queue is empty</p>
        <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
          Use the strip below (drop or +) to add files, or open full ingress from the session bar.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex min-h-0 flex-col gap-2">
      {stagedFiles.map((entry) => (
        <li
          key={entry.id}
          className="animate-in fade-in slide-in-from-left-2 duration-200"
        >
          <FileCard entry={entry} />
        </li>
      ))}
    </ul>
  );
}
