import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2, RefreshCw, Circle } from 'lucide-react'

interface LoadingProps {
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars' | 'wave'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  center?: boolean
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  className?: string
}

export function Loading({
  variant = 'spinner',
  size = 'md',
  text,
  center = false,
  color = 'default',
  className,
}: LoadingProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  }

  const colors = {
    default: 'text-foreground',
    primary: 'text-primary',
    secondary: 'text-secondary',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
  }

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  }

  const LoadingComponent = () => {
    switch (variant) {
      case 'spinner':
        return (
          <Loader2 
            className={cn(
              "animate-spin",
              sizes[size],
              colors[color]
            )} 
          />
        )

      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((index) => (
              <Circle
                key={index}
                className={cn(
                  "animate-bounce fill-current",
                  size === 'sm' ? 'w-1 h-1' : 
                  size === 'md' ? 'w-1.5 h-1.5' :
                  size === 'lg' ? 'w-2 h-2' : 'w-3 h-3',
                  colors[color]
                )}
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animationDuration: '0.6s'
                }}
              />
            ))}
          </div>
        )

      case 'pulse':
        return (
          <div 
            className={cn(
              "animate-pulse rounded-full bg-current opacity-75",
              sizes[size],
              colors[color]
            )} 
          />
        )

      case 'bars':
        return (
          <div className="flex items-end space-x-1">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={cn(
                  "animate-pulse bg-current",
                  size === 'sm' ? 'w-0.5' : 
                  size === 'md' ? 'w-1' :
                  size === 'lg' ? 'w-1.5' : 'w-2',
                  colors[color]
                )}
                style={{
                  height: `${Math.random() * 16 + 8}px`,
                  animationDelay: `${index * 0.1}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        )

      case 'wave':
        return (
          <div className="flex items-center space-x-1">
            {[0, 1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className={cn(
                  "animate-bounce rounded-full bg-current",
                  size === 'sm' ? 'w-1 h-1' : 
                  size === 'md' ? 'w-1.5 h-1.5' :
                  size === 'lg' ? 'w-2 h-2' : 'w-3 h-3',
                  colors[color]
                )}
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animationDuration: '1.4s'
                }}
              />
            ))}
          </div>
        )

      default:
        return <RefreshCw className={cn("animate-spin", sizes[size], colors[color])} />
    }
  }

  const content = (
    <div className={cn(
      "flex items-center gap-2",
      center && "justify-center",
      className
    )}>
      <LoadingComponent />
      {text && (
        <span className={cn(
          "animate-pulse",
          textSizes[size],
          colors[color]
        )}>
          {text}
        </span>
      )}
    </div>
  )

  if (center) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-[100px]">
        {content}
      </div>
    )
  }

  return content
}

// Componentes especializados
export const FullPageLoading: React.FC<{ text?: string }> = ({ text = "Carregando..." }) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card p-6 rounded-lg shadow-lg border">
        <Loading variant="spinner" size="lg" text={text} center />
      </div>
    </div>
  )
}

export const InlineLoading: React.FC<{ text?: string; size?: 'sm' | 'md' }> = ({ 
  text = "Carregando...", 
  size = 'sm' 
}) => {
  return <Loading variant="dots" size={size} text={text} />
}

export const ButtonLoading: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'sm' }) => {
  return <Loading variant="spinner" size={size} />
}

export const MessageSkeleton: React.FC<{ isUser?: boolean; className?: string }> = ({ 
  isUser = false, 
  className 
}) => {
  return (
    <div className={cn('flex gap-3 py-4 px-4', className)}>
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-20 h-4 bg-muted rounded animate-pulse" />
          <div className="w-16 h-3 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="w-full h-4 bg-muted rounded animate-pulse" />
          <div className="w-3/4 h-4 bg-muted rounded animate-pulse" />
          {!isUser && (
            <div className="w-1/2 h-4 bg-muted rounded animate-pulse" />
          )}
        </div>
      </div>
    </div>
  )
}