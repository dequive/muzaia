import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border",
        success:
          "border-transparent bg-green-500 text-white hover:bg-green-600",
        warning:
          "border-transparent bg-yellow-500 text-white hover:bg-yellow-600",
        info:
          "border-transparent bg-blue-500 text-white hover:bg-blue-600",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        default: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
      interactive: {
        true: "cursor-pointer",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      interactive: false,
    },
  }
)

/**
 * Componente Badge para exibir informações de status, categorias ou tags
 * 
 * @example
 * ```tsx
 * // Badge básico
 * <Badge>New</Badge>
 * 
 * // Badge removível
 * <Badge removable onRemove={() => console.log('removed')}>
 *   Tag
 * </Badge>
 * 
 * // Badge com ícone
 * <Badge icon={<StarIcon />}>Premium</Badge>
 * 
 * // Badge clicável
 * <Badge interactive onClick={() => console.log('clicked')}>
 *   Click me
 * </Badge>
 * ```
 */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Ícone a ser exibido no início do badge
   */
  icon?: React.ReactNode
  
  /**
   * Se true, mostra botão de remoção (X)
   */
  removable?: boolean
  
  /**
   * Callback chamado quando o badge é removido
   */
  onRemove?: () => void
  
  /**
   * Ícone customizado para remoção (substitui o X padrão)
   */
  removeIcon?: React.ReactNode
  
  /**
   * Se true, adiciona estilos de hover e cursor pointer
   */
  interactive?: boolean
  
  /**
   * Texto alternativo para o botão de remoção
   */
  removeAriaLabel?: string
}

/**
 * Badge reutilizável para exibir status, tags ou categorias
 * 
 * @param variant - Estilo visual do badge (default, secondary, destructive, outline, success, warning, info)
 * @param size - Tamanho do badge (sm, default, lg)
 * @param icon - Ícone a ser exibido no início
 * @param removable - Se true, mostra botão de remoção
 * @param onRemove - Callback para remoção
 * @param removeIcon - Ícone customizado para remoção
 * @param interactive - Se true, adiciona estilos interativos
 * @param removeAriaLabel - Label para acessibilidade do botão remover
 * @param className - Classes CSS adicionais
 * @param children - Conteúdo do badge
 */
function Badge({ 
  className, 
  variant, 
  size,
  icon,
  removable = false,
  onRemove,
  removeIcon,
  interactive = false,
  removeAriaLabel = "Remove",
  children,
  onClick,
  ...props 
}: BadgeProps) {
  // Determina se o badge deve ser interativo
  const isInteractive = interactive || !!onClick || removable
  
  // Ícone de remoção padrão ou customizado
  const RemoveIcon = removeIcon || <X className="h-3 w-3" />
  
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove?.()
  }
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick && !removable) {
      onClick(e)
    }
  }
  
  return (
    <div 
      className={cn(
        badgeVariants({ 
          variant, 
          size, 
          interactive: isInteractive,
          className 
        })
      )}
      onClick={handleClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick(e as any)
        }
      }}
      {...props}
    >
      {icon && (
        <span className="mr-1 flex items-center">
          {icon}
        </span>
      )}
      
      <span>{children}</span>
      
      {removable && onRemove && (
        <button
          type="button"
          className="ml-1 flex items-center rounded-full p-0.5 hover:bg-black/10 focus:outline-none focus:ring-1 focus:ring-ring"
          onClick={handleRemove}
          aria-label={removeAriaLabel}
        >
          {RemoveIcon}
        </button>
      )}
    </div>
  )
}

export { Badge, badgeVariants }
