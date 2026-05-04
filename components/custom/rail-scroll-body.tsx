"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const NARROW_RAIL_PX = 88;

/**
 * Боковые колонки: при узкой ширине (свёрнутый rail) отключаем scroll,
 * чтобы не было лишних скроллбаров. Для очереди — RTL, чтобы скролл был слева.
 */
export default function RailScrollBody({
  children,
  rtlScrollbar = true,
}: {
  children: ReactNode;
  /** Скроллбар слева (RTL-обёртка), как у очереди файлов */
  rtlScrollbar?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setNarrow(el.clientWidth < NARROW_RAIL_PX);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col",
        narrow
          ? "overflow-hidden"
          : cn(
              "gf-queue-scroll overflow-y-auto overscroll-y-contain p-3",
              rtlScrollbar && "[direction:rtl]",
            ),
      )}
    >
      <div
        className={cn(
          "min-w-0 w-full text-left",
          !narrow && rtlScrollbar && "[direction:ltr]",
          narrow && "min-h-0 flex-1 overflow-hidden p-2",
        )}
      >
        {children}
      </div>
    </div>
  );
}
