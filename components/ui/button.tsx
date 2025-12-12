import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base styles with 44px min touch target
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: 
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md",
        destructive:
          "bg-destructive text-white shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive/50",
        outline:
          "border border-border bg-transparent shadow-sm hover:bg-secondary hover:border-border/80 hover:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost:
          "hover:bg-secondary hover:text-foreground",
        link: 
          "text-primary underline-offset-4 hover:underline",
        // Premium variants
        premium:
          "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md hover:shadow-lg hover:shadow-primary/20",
        glow:
          "bg-primary text-primary-foreground shadow-sm hover:shadow-glow relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700",
      },
      size: {
        default: "h-11 min-h-[44px] px-5 py-2.5 text-sm rounded-lg",
        sm: "h-9 min-h-[36px] px-4 py-2 text-sm rounded-md",
        lg: "h-12 min-h-[48px] px-8 py-3 text-base rounded-lg",
        xl: "h-14 min-h-[56px] px-10 py-4 text-lg rounded-xl",
        icon: "size-11 min-h-[44px] min-w-[44px] rounded-lg",
        "icon-sm": "size-9 min-h-[36px] min-w-[36px] rounded-md",
        "icon-lg": "size-12 min-h-[48px] min-w-[48px] rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
        data-loading={loading ? "true" : undefined}
      className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
      {...props}
      >
        {loading ? (
          <>
            <svg
              className="size-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
