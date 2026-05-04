"use client";

import gsap from "gsap";
import { Shield, ShieldOff } from "lucide-react";
import { useEffect, useRef } from "react";

import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSafeModeStore } from "@/store/use-safemode-store";
import { cn } from "@/lib/utils";

export default function SafeModeToggle() {
  const safeMode = useSafeModeStore((s) => s.safeMode);
  const setSafeMode = useSafeModeStore((s) => s.setSafeMode);
  const shellRef = useRef<HTMLDivElement>(null);
  const skipPulseRef = useRef(true);

  useEffect(() => {
    if (skipPulseRef.current) {
      skipPulseRef.current = false;
      return;
    }
    const el = shellRef.current;
    if (!el) return;
    gsap.killTweensOf(el);
    gsap.fromTo(
      el,
      { scale: 1 },
      {
        scale: 1.04,
        duration: 0.12,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
        clearProps: "transform",
      },
    );
  }, [safeMode]);

  return (
    <TooltipProvider delayDuration={180}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={shellRef}
            role="group"
            aria-label={
              safeMode
                ? "Safe mode on: client-side only"
                : "Safe mode off: server features may be used"
            }
            className={cn(
              "flex cursor-default items-center gap-3 border-2 px-3 py-2 transition-[border-color,background-color] duration-150 ease-out",
              "border-border bg-card",
              safeMode && "border-primary/70 bg-primary/5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--gf-accent)_25%,transparent)]",
            )}
          >
            <div className="flex flex-col gap-0.5 text-left">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                trust boundary
              </span>
              <span className="flex items-center gap-1.5 font-sans text-xs font-semibold leading-none tracking-tight text-foreground">
                {safeMode ? (
                  <>
                    <Shield className="size-3.5 text-primary" strokeWidth={1.5} aria-hidden />
                    Client-only
                  </>
                ) : (
                  <>
                    <ShieldOff className="size-3.5 text-muted-foreground" strokeWidth={1.5} aria-hidden />
                    Network path
                  </>
                )}
              </span>
            </div>
            <Switch
              checked={safeMode}
              onCheckedChange={setSafeMode}
              aria-label="Toggle safe mode (client-only)"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="end"
          sideOffset={6}
          className={cn(
            "max-w-xs rounded-none border-2 border-border bg-card px-3 py-2.5 text-left text-foreground shadow-none",
            "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95",
          )}
        >
          <p className="font-sans text-xs font-semibold leading-snug tracking-tight">
            {safeMode ? "Safe mode is on" : "Safe mode is off"}
          </p>
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
            {safeMode ? (
              <>
                Server uploads, remote APIs, and cloud pipelines should stay disabled. Files stay
                on-device; use workers and WASM only.
              </>
            ) : (
              <>
                You may enable features that touch the network (uploads, server-side conversion,
                etc.). Turn safe mode on before handling sensitive files.
              </>
            )}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
