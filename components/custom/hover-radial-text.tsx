"use client";

import gsap from "gsap";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type RefObject,
} from "react";

import { cn } from "@/lib/utils";

function resolveCssColor(variableOrColor: string): string {
  if (typeof document === "undefined") return variableOrColor;
  if (!variableOrColor.trim().startsWith("var(")) return variableOrColor;
  const probe = document.createElement("span");
  probe.style.color = variableOrColor;
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  document.body.appendChild(probe);
  const out = getComputedStyle(probe).color;
  probe.remove();
  return out;
}

function splitSegments(text: string, mode: "character" | "word"): string[] {
  if (mode === "word") {
    return text.split(/(\s+)/).filter((t) => t.length > 0);
  }
  try {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return Array.from(seg.segment(text), (s) => s.segment);
  } catch {
    return Array.from(text);
  }
}

export type HoverRadialTextProps = {
  children: string;
  className?: string;
  /**
   * Element whose pointer position drives the wave (e.g. react-dropzone `rootRef`).
   * If omitted, this component wraps text in a span that receives pointer events.
   */
  interactionRef?: RefObject<HTMLElement | null>;
  /** Idle text color. If omitted, taken from the first segment’s computed `color` after mount. */
  fromColor?: string;
  /** Hover / active color (e.g. `var(--primary)`). */
  toColor?: string;
  /**
   * Pixels: delay scales with distance from cursor / this radius (capped at `maxStagger`).
   * Larger = a wider “ripple” from the pointer.
   */
  influenceRadius?: number;
  maxStagger?: number;
  segmentDuration?: number;
  gsapEase?: string;
  splitBy?: "character" | "word";
};

export function HoverRadialText({
  children,
  className,
  interactionRef,
  fromColor: fromColorProp,
  toColor: toColorProp = "var(--primary)",
  influenceRadius = 160,
  maxStagger = 0.45,
  segmentDuration = 0.22,
  gsapEase = "power2.out",
  splitBy = "character",
}: HoverRadialTextProps) {
  const selfRef = useRef<HTMLSpanElement>(null);
  const segmentsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const idleColorRef = useRef<string | null>(null);
  const activeColorRef = useRef<string | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const hoveringRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const pendingPointerRef = useRef<{ x: number; y: number } | null>(null);

  const segments = splitSegments(children, splitBy);

  const killTimeline = useCallback(() => {
    timelineRef.current?.kill();
    timelineRef.current = null;
  }, []);

  const runWave = useCallback(
    (active: boolean, clientX: number, clientY: number) => {
      const host = interactionRef?.current ?? selfRef.current;
      const spans = segmentsRef.current
        .slice(0, segments.length)
        .filter((el): el is HTMLSpanElement => el != null);
      if (!host || spans.length === 0) return;

      const idle =
        idleColorRef.current ??
        fromColorProp ??
        getComputedStyle(spans[0]).color;
      const activeColor =
        activeColorRef.current ?? resolveCssColor(toColorProp);

      killTimeline();
      const tl = gsap.timeline();
      timelineRef.current = tl;

      let originX = clientX;
      let originY = clientY;
      if (!active) {
        const r = host.getBoundingClientRect();
        originX = r.left + r.width / 2;
        originY = r.top + r.height / 2;
      }

      spans.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.hypot(cx - originX, cy - originY);
        const delay = Math.min(1, dist / influenceRadius) * maxStagger;
        const targetColor = active ? activeColor : idle;
        tl.to(
          el,
          {
            color: targetColor,
            duration: segmentDuration,
            ease: gsapEase,
          },
          delay,
        );
      });
    },
    [
      interactionRef,
      fromColorProp,
      toColorProp,
      influenceRadius,
      maxStagger,
      segmentDuration,
      gsapEase,
      killTimeline,
      segments.length,
    ],
  );

  useLayoutEffect(() => {
    activeColorRef.current = resolveCssColor(toColorProp);
  }, [toColorProp]);

  useLayoutEffect(() => {
    const spans = segmentsRef.current
      .slice(0, segments.length)
      .filter((el): el is HTMLSpanElement => el != null);
    if (spans.length === 0) return;
    if (fromColorProp) {
      idleColorRef.current = fromColorProp;
      return;
    }
    idleColorRef.current = getComputedStyle(spans[0]).color;
  }, [fromColorProp, children, splitBy, segments.length]);

  useEffect(() => {
    const host = interactionRef?.current ?? selfRef.current;
    if (!host) return;

    const flushPointer = () => {
      rafRef.current = null;
      const p = pendingPointerRef.current;
      if (p && hoveringRef.current) runWave(true, p.x, p.y);
    };

    const onEnter = (e: PointerEvent) => {
      hoveringRef.current = true;
      runWave(true, e.clientX, e.clientY);
    };

    const onMove = (e: PointerEvent) => {
      if (!hoveringRef.current) return;
      pendingPointerRef.current = { x: e.clientX, y: e.clientY };
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(flushPointer);
    };

    const onLeave = () => {
      hoveringRef.current = false;
      pendingPointerRef.current = null;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      const r = host.getBoundingClientRect();
      runWave(false, r.left + r.width / 2, r.top + r.height / 2);
    };

    host.addEventListener("pointerenter", onEnter);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);

    return () => {
      host.removeEventListener("pointerenter", onEnter);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      killTimeline();
    };
  }, [interactionRef, runWave, killTimeline]);

  const segmentSpans = segments.map((seg, i) => (
    <span
      key={`${i}-${seg}`}
      ref={(el) => {
        segmentsRef.current[i] = el;
      }}
      className="inline-block whitespace-pre"
      style={{ willChange: "color" }}
    >
      {seg}
    </span>
  ));

  if (interactionRef) {
    return (
      <span className={cn("inline", className)}>{segmentSpans}</span>
    );
  }

  return (
    <span
      ref={selfRef}
      className={cn("inline cursor-default touch-none", className)}
    >
      {segmentSpans}
    </span>
  );
}
