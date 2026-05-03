import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import gsap from "gsap"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[color,transform,box-shadow,border-color] outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary",
        outline:
          "border-border bg-background text-foreground shadow-xs hover:border-border hover:bg-background aria-expanded:bg-muted dark:border-input dark:bg-input/30 dark:hover:border-input dark:hover:bg-input/30 dark:aria-expanded:bg-muted",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/10 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/20 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 gap-1.5 px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),8px)] px-2 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 rounded-[min(var(--radius-md),10px)] px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
        lg: "h-10 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-9",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),8px)] in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-md",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const rippleBg: Record<
  NonNullable<VariantProps<typeof buttonVariants>["variant"]>,
  string
> = {
  default: "bg-primary-foreground/18",
  outline: "bg-primary",
  secondary: "bg-foreground/12",
  ghost: "bg-muted",
  destructive: "bg-destructive",
  link: "",
}

const contentHoverClass: Record<
  NonNullable<VariantProps<typeof buttonVariants>["variant"]>,
  string | undefined
> = {
  default: undefined,
  outline: "transition-colors duration-200 group-hover/button:text-primary-foreground",
  secondary: undefined,
  ghost: undefined,
  destructive: "transition-colors duration-200 group-hover/button:text-white",
  link: undefined,
}

function setRippleOrigin(
  el: HTMLElement,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  const r = el.getBoundingClientRect()
  const x = ((clientX - r.left) / Math.max(r.width, 1)) * 100
  const y = ((clientY - r.top) / Math.max(r.height, 1)) * 100
  el.style.setProperty("--ripple-x", `${x}%`)
  el.style.setProperty("--ripple-y", `${y}%`)
  return { x, y }
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  children,
  onPointerEnter,
  onPointerLeave,
  onPointerMove,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"
  const rippleRef = React.useRef<HTMLSpanElement>(null)
  const hoverRef = React.useRef(false)
  const lastOrigin = React.useRef({ x: 50, y: 50 })

  const v = variant ?? "default"
  const showRipple = v !== "link" && !asChild
  const rippleClass = showRipple ? rippleBg[v] : ""

  const runEnter = React.useCallback(
    (el: HTMLElement, clientX: number, clientY: number) => {
      const layer = rippleRef.current
      if (!layer) return
      lastOrigin.current = setRippleOrigin(el, clientX, clientY)
      const { x, y } = lastOrigin.current
      gsap.killTweensOf(layer)
      gsap.fromTo(
        layer,
        { clipPath: `circle(0% at ${x}% ${y}%)` },
        {
          clipPath: `circle(150% at ${x}% ${y}%)`,
          duration: 0.48,
          ease: "power2.out",
        }
      )
    },
    []
  )

  const runLeave = React.useCallback(() => {
    const layer = rippleRef.current
    if (!layer) return
    const { x, y } = lastOrigin.current
    gsap.killTweensOf(layer)
    gsap.to(layer, {
      clipPath: `circle(0% at ${x}% ${y}%)`,
      duration: 0.32,
      ease: "power2.in",
    })
  }, [])

  const handlePointerEnter = React.useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      hoverRef.current = true
      if (showRipple) runEnter(e.currentTarget, e.clientX, e.clientY)
      onPointerEnter?.(e)
    },
    [onPointerEnter, runEnter, showRipple]
  )

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (showRipple && hoverRef.current) {
        setRippleOrigin(e.currentTarget, e.clientX, e.clientY)
      }
      onPointerMove?.(e)
    },
    [onPointerMove, showRipple]
  )

  const handlePointerLeave = React.useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      hoverRef.current = false
      if (showRipple) runLeave()
      onPointerLeave?.(e)
    },
    [onPointerLeave, runLeave, showRipple]
  )

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...props}
    >
      {showRipple && rippleClass ? (
        <>
          <span
            ref={rippleRef}
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 z-0 will-change-[clip-path]",
              rippleClass
            )}
            style={{ clipPath: "circle(0% at 50% 50%)" }}
          />
          <span
            data-button-content
            className={cn(
              "relative z-1 inline-flex items-center justify-center gap-[inherit]",
              contentHoverClass[v]
            )}
          >
            {children}
          </span>
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
