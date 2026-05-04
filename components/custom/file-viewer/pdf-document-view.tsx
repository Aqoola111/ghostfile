"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

import { ensurePdfWorker } from "@/lib/pdfjs-setup";
import { cn } from "@/lib/utils";

function PdfPageCanvas({
  pdf,
  pageNumber,
  maxWidth,
}: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  maxWidth: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderSeq = useRef(0);
  const renderTaskRef = useRef<{ cancel(): void } | null>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || maxWidth <= 0) return;

    let cancelled = false;
    const seq = ++renderSeq.current;
    renderTaskRef.current?.cancel();
    renderTaskRef.current = null;

    void (async () => {
      await ensurePdfWorker();
      const page = await pdf.getPage(pageNumber);
      if (cancelled || seq !== renderSeq.current) return;

      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(maxWidth / base.width, 2.5);
      const viewport = page.getViewport({ scale });
      const dpr =
        typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      const task = page.render({
        canvasContext: ctx,
        viewport,
        canvas,
      });
      renderTaskRef.current = task;
      try {
        await task.promise;
      } catch {
        /* отмена или смена страницы */
      }
      if (renderTaskRef.current === task) {
        renderTaskRef.current = null;
      }
    })();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
    };
  }, [pdf, pageNumber, maxWidth]);

  return (
    <canvas
      ref={canvasRef}
      className="mx-auto block max-w-full bg-background shadow-[inset_0_0_0_1px_var(--border)]"
      aria-hidden
    />
  );
}

export default function PdfDocumentView({
  file,
  className,
}: {
  file: File;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [width, setWidth] = useState(640);

  const measure = useCallback(() => {
    const el = hostRef.current;
    if (!el) return;
    const w = el.clientWidth - 24;
    setWidth(Math.max(120, w));
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    const el = hostRef.current;
    if (el) ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    let cancelled = false;
    let loadedDoc: PDFDocumentProxy | null = null;
    setError(null);
    setPdf(null);
    setNumPages(0);

    void (async () => {
      try {
        await ensurePdfWorker();
        const { getDocument } = await import("pdfjs-dist");
        const data = await file.arrayBuffer();
        if (cancelled) return;
        const doc = await getDocument({ data }).promise;
        if (cancelled) {
          await doc.destroy().catch(() => {});
          return;
        }
        loadedDoc = doc;
        setPdf(doc);
        setNumPages(doc.numPages);
      } catch (e) {
        console.error("PDF load:", e);
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load PDF");
        }
      }
    })();

    return () => {
      cancelled = true;
      const d = loadedDoc;
      loadedDoc = null;
      void d?.destroy().catch(() => {});
    };
  }, [file]);

  if (error) {
    return (
      <p className="font-mono text-xs text-destructive">{error}</p>
    );
  }

  if (!pdf || numPages === 0) {
    return (
      <p className="font-mono text-[10px] text-muted-foreground">
        Loading PDF…
      </p>
    );
  }

  return (
    <div
      ref={hostRef}
      className={cn(
        "gf-queue-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2 py-3",
        className,
      )}
    >
      {Array.from({ length: numPages }, (_, i) => (
        <div
          key={i + 1}
          className="flex flex-col items-center gap-1 border-b-2 border-border pb-4 last:border-b-0 last:pb-0"
        >
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Page {i + 1} / {numPages}
          </span>
          <PdfPageCanvas pdf={pdf} pageNumber={i + 1} maxWidth={width} />
        </div>
      ))}
    </div>
  );
}
