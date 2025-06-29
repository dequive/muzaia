import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground border-border hover:bg-accent hover:text-accent-foreground",
        success:
          "border-transparent bg-green-500 text-white shadow hover:bg-green-600",
        warning:
          "border-transparent bg-yellow-500 text-white shadow hover:bg-yellow-600",
        info:
          "border-transparent bg-blue-500 text-white shadow hover:bg-blue-600",
        gradient:
          "border-transparent bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow hover:from-purple-600 hover:to-pink-600",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
        xl: "px-4 py-1.5 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Ícone a ser exibido antes do texto
   */
  icon?: React.ReactNode
  /**
   * Se true, adiciona animação de pulse
   */
  pulse?: boolean
  /**
   * Se true, torna o badge clicável
   */
  clickable?: boolean
  /**
   * Função chamada quando o badge é clicado
   */
  onRemove?: () => void
}

function Badge({ 
  className, 
  variant, 
  size, 
  icon, 
  pulse = false, 
  clickable = false,
  onRemove,
  children,
  ...props 
}: BadgeProps) {
  return (
    <div 
      className={cn(
        badgeVariants({ variant, size }),
        pulse && "animate-pulse",
        clickable && "cursor-pointer hover:scale-105 transition-transform",
        onRemove && "pr-1",
        className
      )} 
      {...props}
    >
      {icon && <span className="mr-1.5 h-3 w-3">{icon}</span>}
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-1.5 h-3 w-3 rounded-full hover:bg-white/20 flex items-center justify-center"
          aria-label="Remover badge"
        >
          <svg
            width="8"
            height="8"
            viewBox="0 0 8 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 1L7 7M7 1L1 7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  )
}

export { Badge, badgeVariants }

// Componentes especializados
export const StatusBadge: React.FC<{
  status: 'online' | 'offline' | 'busy' | 'away'
  children?: React.ReactNode
}> = ({ status, children }) => {
  const variants = {
    online: 'success',
    offline: 'secondary',
    busy: 'destructive',
    away: 'warning',
  } as const

  return (
    <Badge variant={variants[status]} pulse={status === 'online'}>
      {children || status}
    </Badge>
  )
}

export const ModelBadge: React.FC<{
  model: string
  confidence?: number
  isActive?: boolean
}> = ({ model, confidence, isActive }) => {
  return (
    <Badge 
      variant={isActive ? 'default' : 'outline'} 
      size="sm"
      className={isActive ? 'ring-2 ring-primary/20' : ''}
    >
      {model}
      {confidence && (
        <span className="ml-1 text-xs opacity-75">
          {Math.round(confidence * 100)}%
        </span>
      )}
    </Badge>
  )
}
