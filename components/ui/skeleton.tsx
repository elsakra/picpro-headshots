import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circular" | "text" | "card"
}

function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-shimmer bg-muted rounded-lg",
        {
          "rounded-lg": variant === "default",
          "rounded-full": variant === "circular",
          "rounded-md h-4": variant === "text",
          "rounded-xl": variant === "card",
        },
        className
      )}
      {...props}
    />
  )
}

// Preset skeleton components for common patterns
function SkeletonText({ className, lines = 1 }: { className?: string; lines?: number }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={cn("h-4", i === lines - 1 && lines > 1 ? "w-3/4" : "w-full")}
        />
      ))}
    </div>
  )
}

function SkeletonAvatar({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "size-8",
    md: "size-10",
    lg: "size-14",
  }
  
  return (
    <Skeleton
      variant="circular"
      className={cn(sizeClasses[size], className)}
    />
  )
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4 p-4 border border-border rounded-xl bg-card", className)}>
      <Skeleton className="h-40 w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}

function SkeletonImage({ className, aspectRatio = "square" }: { className?: string; aspectRatio?: "square" | "video" | "portrait" }) {
  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
  }
  
  return (
    <Skeleton
      className={cn("w-full", aspectClasses[aspectRatio], className)}
    />
  )
}

function SkeletonButton({ className, size = "default" }: { className?: string; size?: "sm" | "default" | "lg" }) {
  const sizeClasses = {
    sm: "h-9 w-24",
    default: "h-11 w-32",
    lg: "h-12 w-40",
  }
  
  return (
    <Skeleton className={cn(sizeClasses[size], "rounded-lg", className)} />
  )
}

// Grid of image skeletons for gallery loading
function SkeletonGrid({ 
  count = 8, 
  columns = 4,
  aspectRatio = "portrait" 
}: { 
  count?: number
  columns?: 2 | 3 | 4 | 5
  aspectRatio?: "square" | "video" | "portrait"
}) {
  const gridClasses = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
  }
  
  return (
    <div className={cn("grid gap-4", gridClasses[columns])}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonImage key={i} aspectRatio={aspectRatio} />
      ))}
    </div>
  )
}

export { 
  Skeleton, 
  SkeletonText, 
  SkeletonAvatar, 
  SkeletonCard, 
  SkeletonImage, 
  SkeletonButton,
  SkeletonGrid 
}

