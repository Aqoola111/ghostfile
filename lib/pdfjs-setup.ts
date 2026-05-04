"use client";

let configured = false;

/** Worker через CDN; вызывать из async-кода после `import("pdfjs-dist")`. */
export async function ensurePdfWorker(): Promise<void> {
  if (typeof window === "undefined" || configured) {
    return;
  }
  const { GlobalWorkerOptions, version } = await import("pdfjs-dist");
  GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  configured = true;
}
