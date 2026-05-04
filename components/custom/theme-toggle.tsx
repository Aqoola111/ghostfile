"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { THEME_STORAGE_KEY } from "@/lib/theme-constants";
import { cn } from "@/lib/utils";

export type ThemeMode = "light" | "dark";

/** Вне React: та же семантика, что и `setTheme` из next-themes (ключ `THEME_STORAGE_KEY`). */
export function applyThemeMode(mode: ThemeMode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = (resolvedTheme ?? "dark") === "dark";

  const onCheckedChange = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };

  if (!mounted) {
    return (
      <div
        className={cn(
          "flex cursor-default items-center gap-3 border-2 px-3 py-2",
          "border-border bg-card opacity-60",
        )}
        aria-hidden
      >
        <div className="flex flex-col gap-0.5 text-left">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            appearance
          </span>
          <span className="h-3.5 w-20 rounded-sm bg-muted" />
        </div>
        <Switch checked={false} disabled size="sm" aria-hidden />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={180}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            role="group"
            aria-label={
              isDark
                ? "Dark theme: switch off for light theme"
                : "Light theme: switch on for dark theme"
            }
            className={cn(
              "flex cursor-default items-center gap-3 border-2 px-3 py-2 transition-[border-color,background-color] duration-150 ease-out",
              "border-border bg-card",
              isDark &&
                "border-primary/70 bg-primary/5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--gf-accent)_25%,transparent)]",
            )}
          >
            <div className="flex flex-col gap-0.5 text-left">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                appearance
              </span>
              <span className="flex items-center gap-1.5 font-sans text-xs font-semibold leading-none tracking-tight text-foreground">
                {isDark ? (
                  <>
                    <Moon className="size-3.5 text-primary" strokeWidth={1.5} aria-hidden />
                    Dark
                  </>
                ) : (
                  <>
                    <Sun className="size-3.5 text-muted-foreground" strokeWidth={1.5} aria-hidden />
                    Light
                  </>
                )}
              </span>
            </div>
            <Switch
              checked={isDark}
              onCheckedChange={onCheckedChange}
              size="sm"
              aria-label="Toggle dark theme"
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
            {isDark ? "Dark theme" : "Light theme"}
          </p>
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
            {isDark
              ? "High-contrast terminal look. Turn off for a light workspace."
              : "Paper-style workspace. Turn on to return to the dark terminal palette."}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
