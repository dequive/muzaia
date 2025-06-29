import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-8 rounded px-2 text-xs",
        sm: "h-9 rounded-md px-3",
        default: "h-10 px-4 py-2",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * Componente Button reutilizável com múltiplas variantes e tamanhos
 * 
 * @example
 * ```tsx
 * // Botão básico
 * <Button>Click me</Button>
 * 
 * // Botão com loading
 * <Button loading>Saving...</Button>
 * 
 * // Botão como link
 * <Button asChild>
 *   <Link to="/dashboard">Dashboard</Link>
 * </Button>
 * ```
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Se true, renderiza como Slot do Radix UI para composição
   * Útil para renderizar como link ou outros elementos
   */
  asChild?: boolean
  
  /**
   * Estado de carregamento - desabilita o botão e mostra spinner
   */
  loading?: boolean
  
  /**
   * Texto alternativo durante loading
   */
  loadingText?: string
  
  /**
   * Ícone customizado para loading (substitui o spinner padrão)
   */
  loadingIcon?: React.ReactNode
}

/**
 * Botão reutilizável com suporte a variantes, tamanhos e estados
 * 
 * @param variant - Estilo visual do botão (default, destructive, outline, secondary, ghost, link)
 * @param size - Tamanho do botão (xs, sm, default, lg, icon)
 * @param asChild - Se true, renderiza como Slot para composição
 * @param loading - Se true, mostra estado de carregamento
 * @param loadingText - Texto alternativo durante loading
 * @param loadingIcon - Ícone customizado para loading
 * @param className - Classes CSS adicionais
 * @param children - Conteúdo do botão
 * @param ref - Referência para o elemento DOM
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    loadingText,
    loadingIcon,
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Ícone de loading padrão ou customizado
    const LoadingIcon = loadingIcon || <Loader2 className="h-4 w-4 animate-spin" />
    
    // Texto a ser exibido
    const displayText = loading && loadingText ? loadingText : children
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || disabled}
        {...props}
      >
        {loading && (
          <span className="mr-2 flex items-center">
            {LoadingIcon}
          </span>
        )}
        {displayText}
      </Comp>
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants }
