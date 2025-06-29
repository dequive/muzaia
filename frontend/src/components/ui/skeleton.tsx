import * as React from "react"
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Variante do skeleton
   */
  variant?: 'default' | 'text' | 'circular' | 'rectangular' | 'rounded'
  /**
   * Tamanho do skeleton
   */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /**
   * Se true, usa animação mais suave
   */
  subtle?: boolean
  /**
   * Se true, adiciona brilho extra
   */
  shimmer?: boolean
}

function Skeleton({
  className,
  variant = 'default',
  size = 'md',
  subtle = false,
  shimmer = true,
  ...props
}: SkeletonProps) {
  const variants = {
    default: 'rounded-md',
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  }

  const sizes = {
    sm: 'h-3',
    md: 'h-4',
    lg: 'h-6',
    xl: 'h-8',
  }

  return (
    <div
      className={cn(
        "bg-muted",
        variants[variant],
        variant === 'text' ? sizes[size] : '',
        subtle 
          ? "animate-pulse" 
          : shimmer 
            ? "animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer"
            : "animate-pulse",
        className
      )}
      {...props}
    />
  )
}

// Componentes de skeleton especializados
export const TextSkeleton: React.FC<{
  lines?: number
  className?: string
}> = ({ lines = 1, className }) => {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          className={cn(
            "w-full",
            index === lines - 1 && lines > 1 && "w-3/4" // Última linha menor
          )}
        />
      ))}
    </div>
  )
}

export const CardSkeleton: React.FC<{
  className?: string
}> = ({ className }) => {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-20 w-full" />
    </div>
  )
}

export const AvatarSkeleton: React.FC<{
  size?: 'sm' | 'md' | 'lg'
  className?: string
}> = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  }

  return (
    <Skeleton
      variant="circular"
      className={cn(sizes[size], className)}
    />
  )
}

export const MessageSkeleton: React.FC<{
  isUser?: boolean
  className?: string
}> = ({ isUser = false, className }) => {
  return (
    <div className={cn(
      "flex gap-3",
      isUser ? "flex-row-reverse" : "flex-row",
      className
    )}>
      {!isUser && <AvatarSkeleton size="sm" />}
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      </div>
    </div>
  )
}

export const TableSkeleton: React.FC<{
  rows?: number
  columns?: number
  className?: string
}> = ({ rows = 5, columns = 4, className }) => {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              className={cn(
                "h-8 flex-1",
                colIndex === 0 && "w-1/4", // Primeira coluna menor
              )} 
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export { Skeleton }
