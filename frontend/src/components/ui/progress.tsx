"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const progressVariants = cva(
  "relative w-full overflow-hidden rounded-full bg-secondary",
  {
    variants: {
      size: {
        sm: "h-2",
        default: "h-4",
        lg: "h-6",
      },
      variant: {
        default: "",
        success: "",
        warning: "",
        destructive: "",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

const progressIndicatorVariants = cva(
  "h-full w-full flex-1 transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        default: "bg-primary",
        success: "bg-green-500",
        warning: "bg-yellow-500",
        destructive: "bg-red-500",
      },
      animated: {
        true: "animate-pulse",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      animated: false,
    },
  }
)

/**
 * Componente Progress para exibir progresso de tarefas ou carregamento
 * 
 * @example
 * ```tsx
 * // Progress básico
 * <Progress value={50} />
 * 
 * // Progress com texto
 * <Progress value={75} showValue />
 * 
 * // Progress de sucesso
 * <Progress value={100} variant="success" />
 * 
 * // Progress indeterminado
 * <Progress indeterminate />
 * ```
 */
export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  /**
   * Valor do progresso (0-100)
   */
  value?: number
  
  /**
   * Se true, exibe o valor em porcentagem
   */
  showValue?: boolean
  
  /**
   * Texto customizado para exibir (substitui a porcentagem)
   */
  label?: string
  
  /**
   * Se true, mostra progresso indeterminado (animação contínua)
   */
  indeterminate?: boolean
  
  /**
   * Posição do texto (acima, abaixo, dentro da barra)
   */
  labelPosition?: "top" | "bottom" | "inside"
  
  /**
   * Se true, adiciona animação pulsante ao indicador
   */
  animated?: boolean
  
  /**
   * Cor customizada para o indicador (substitui variant)
   */
  indicatorColor?: string
  
  /**
   * Classes CSS customizadas para o indicador
   */
  indicatorClassName?: string
  
  /**
   * Formato customizado para exibição da porcentagem
   */
  formatValue?: (value: number) => string
}

/**
 * Componente Progress reutilizável com múltiplas variantes e funcionalidades
 * 
 * @param value - Valor do progresso (0-100)
 * @param variant - Variante de cor (default, success, warning, destructive)
 * @param size - Tamanho da barra (sm, default, lg)
 * @param showValue - Se true, exibe porcentagem
 * @param label - Texto customizado
 * @param indeterminate - Se true, mostra animação indeterminada
 * @param labelPosition - Posição do texto
 * @param animated - Se true, adiciona animação pulsante
 * @param indicatorColor - Cor customizada do indicador
 * @param indicatorClassName - Classes CSS do indicador
 * @param formatValue - Função para formatar valor exibido
 * @param className - Classes CSS adicionais
 * @param ref - Referência para o elemento DOM
 */
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ 
  className,
  value = 0,
  variant,
  size,
  showValue = false,
  label,
  indeterminate = false,
  labelPosition = "top",
  animated = false,
  indicatorColor,
  indicatorClassName,
  formatValue = (val) => `${Math.round(val)}%`,
  ...props 
}, ref) => {
  // Valor limitado entre 0 e 100
  const clampedValue = Math.min(100, Math.max(0, value))
  
  // Texto a ser exibido
  const displayText = label || (showValue ? formatValue(clampedValue) : "")
  
  // Estilo do indicador para progresso indeterminado
  const indeterminateStyle = indeterminate ? {
    transform: "translateX(-100%)",
    animation: "progress-indeterminate 2s infinite linear",
    background: `linear-gradient(90deg, transparent, ${
      indicatorColor || "hsl(var(--primary))"
    }, transparent)`,
    width: "30%",
  } : {
    transform: `translateX(-${100 - clampedValue}%)`,
    backgroundColor: indicatorColor,
  }
  
  return (
    <div className="w-full">
      {/* Label superior */}
      {displayText && labelPosition === "top" && (
        <div className="mb-2 flex justify-between text-sm">
          <span>{label || "Progress"}</span>
          {showValue && <span>{formatValue(clampedValue)}</span>}
        </div>
      )}
      
      {/* Container da barra de progresso */}
      <div className="relative">
        <ProgressPrimitive.Root
          ref={ref}
          className={cn(progressVariants({ size, variant }), className)}
          value={indeterminate ? undefined : clampedValue}
          {...props}
        >
          <ProgressPrimitive.Indicator
            className={cn(
              progressIndicatorVariants({ 
                variant, 
                animated: animated || indeterminate 
              }),
              indicatorClassName
            )}
            style={indeterminateStyle}
          />
          
          {/* Label dentro da barra */}
          {displayText && labelPosition === "inside" && size !== "sm" && (
            <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white mix-blend-difference">
              {displayText}
            </div>
          )}
        </ProgressPrimitive.Root>
      </div>
      
      {/* Label inferior */}
      {displayText && labelPosition === "bottom" && (
        <div className="mt-2 flex justify-between text-sm">
          <span>{label || "Progress"}</span>
          {showValue && <span>{formatValue(clampedValue)}</span>}
        </div>
      )}
      
      {/* Estilos CSS para animação indeterminada */}
      <style jsx>{`
        @keyframes progress-indeterminate {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  )
})

Progress.displayName = "Progress"

export { Progress, progressVariants }
