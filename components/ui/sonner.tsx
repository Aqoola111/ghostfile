"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

import { cn } from "@/lib/utils";

const Toaster = ({ toastOptions, ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme();
  const theme: NonNullable<ToasterProps["theme"]> =
    (resolvedTheme ?? "dark") === "light" ? "light" : "dark";

  const mergedToastOptions = {
    ...toastOptions,
    duration: toastOptions?.duration ?? 4200,
    classNames: {
      toast: cn(
        "group rounded-none border-2 border-border bg-card text-card-foreground shadow-none",
        "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--gf-accent)_14%,transparent)]",
        "[--normal-bg:var(--card)] [--normal-border:var(--border)]",
        toastOptions?.classNames?.toast,
      ),
      title: cn(
        "font-sans text-sm font-semibold tracking-tight text-foreground",
        toastOptions?.classNames?.title,
      ),
      description: cn(
        "font-mono text-[10px] font-medium leading-relaxed text-muted-foreground",
        toastOptions?.classNames?.description,
      ),
      actionButton: cn(
        "rounded-none border-2 border-border bg-secondary px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-secondary-foreground",
        toastOptions?.classNames?.actionButton,
      ),
      cancelButton: cn(
        "rounded-none border-2 border-border bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground",
        toastOptions?.classNames?.cancelButton,
      ),
      closeButton: cn(
        "left-auto right-0 top-0 size-7 rounded-none border-0 border-l-2 border-border bg-background text-foreground hover:bg-muted",
        toastOptions?.classNames?.closeButton,
      ),
    },
  };

  return (
    <Sonner
      {...props}
      theme={theme}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--card-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as CSSProperties
      }
      position="bottom-right"
      closeButton
      offset={16}
      gap={10}
      toastOptions={mergedToastOptions}
    />
  );
};

export { Toaster };
