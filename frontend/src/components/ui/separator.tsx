"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const separatorVariants = cva(
  "shrink-0",
  {
    variants: {
      variant: {
        default: "bg-border",
        subtle: "bg-muted",
        strong: "bg-foreground/20",
        accent: "bg-primary",
        destructive: "bg-destructive",
        success: "bg-green-500",
        warning: "bg-yellow-500",
        gradient: "bg-gradient-to-r from-transparent via-border to-transparent",
        dashed: "border-dashed border-border bg-transparent",
        dotted: "border-dotted border-border bg-transparent",
      },
      size: {
        xs: "",
        sm: "",
        default: "",
        lg: "",
        xl: "",
      },
      spacing: {
        none: "",
        sm: "",
        default: "",
        lg: "",
        xl: "",
      },
    },
    compoundVariants: [
      // Horizontal sizes
      {
        orientation: "horizontal",
        size: "xs",
        className: "h-px",
      },
      {
        orientation: "horizontal", 
        size: "sm",
        className: "h-0.5",
      },
      {
        orientation: "horizontal",
        size: "default",
        className: "h-px",
      },
      {
        orientation: "horizontal",
        size: "lg", 
        className: "h-1",
      },
      {
        orientation: "horizontal",
        size: "xl",
        className: "h-1.5",
      },
      // Vertical sizes
      {
        orientation: "vertical",
        size: "xs",
        className: "w-px",
      },
      {
        orientation: "vertical",
        size: "sm", 
        className: "w-0.5",
      },
      {
        orientation: "vertical",
        size: "default",
        className: "w-px",
      },
      {
        orientation: "vertical",
        size: "lg",
        className: "w-1",
      },
      {
        orientation: "vertical",
        size: "xl",
        className: "w-1.5",
      },
      // Horizontal spacing
      {
        orientation: "horizontal",
        spacing: "none",
        className: "my-0",
      },
      {
        orientation: "horizontal",
        spacing: "sm",
        className: "my-2",
      },
      {
        orientation: "horizontal", 
        spacing: "default",
        className: "my-4",
      },
      {
        orientation: "horizontal",
        spacing: "lg",
        className: "my-6",
      },
      {
        orientation: "horizontal",
        spacing: "xl",
        className: "my-8",
      },
      // Vertical spacing
      {
        orientation: "vertical",
        spacing: "none",
        className: "mx-0",
      },
      {
        orientation: "vertical",
        spacing: "sm",
        className: "mx-2",
      },
      {
        orientation: "vertical",
        spacing: "default",
        className: "mx-4",
      },
      {
        orientation: "vertical",
        spacing: "lg",
        className: "mx-6",
      },
      {
        orientation: "vertical",
        spacing: "xl",
        className: "mx-8",
      },
      // Dashed and dotted borders
      {
        variant: ["dashed", "dotted"],
        orientation: "horizontal",
        size: "xs",
        className: "border-t border-b-0 border-l-0 border-r-0 h-0",
      },
      {
        variant: ["dashed", "dotted"],
        orientation: "horizontal",
        size: "sm",
        className: "border-t-2 border-b-0 border-l-0 border-r-0 h-0",
      },
      {
        variant: ["dashed", "dotted"],
        orientation: "horizontal",
        size: "default",
        className: "border-t border-b-0 border-l-0 border-r-0 h-0",
      },
      {
        variant: ["dashed", "dotted"],
        orientation: "horizontal",
        size: "lg",
        className: "border-t-2 border-b-0 border-l-0 border-r-0 h-0",
      },
      {
        variant: ["dashed", "dotted"],
        orientation: "horizontal",
        size: "xl",
        className: "border-t-4 border-b-0 border-l-0 border-r-0 h-0",
      },
      {
        variant: ["dashed", "dotted"],
        orientation: "vertical",
        size: "xs",
        className: "border-l border-t-0 border-b-0 border-r-0 w-0",
      },
      {
        variant: ["dashed", "dotted"],
        orientation: "vertical",
        size: "sm",
        className: "border-l-2 border-t-0 border-b-0 border-r-0 w-0",
      },
      {
        variant: ["dashed", "dotted"],
        orientation: "vertical",
        size: "default",
        className: "border-l border-t-0 border-b-0 border-r-0 w-0",
      },
      {
        variant: ["dashed", "dotted"],
        orientation: "vertical",
        size: "lg",
        className: "border-l-2 border-t-0 border-b-0 border-r-0 w-0",
      },
      {
        variant: ["dashed", "dotted"],
        orientation: "vertical",
        size: "xl",
        className: "border-l-4 border-t-0 border-b-0 border-r-0 w-0",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      spacing: "default",
    },
  }
)

/**
 * Componente Separator para dividir visualmente seções de conteúdo
 * 
 * @example
 * ```tsx
 * // Separator horizontal básico
 * <Separator />
 * 
 * // Separator vertical
 * <Separator orientation="vertical" />
 * 
 * // Separator com texto
 * <Separator label="ou" />
 * 
 * // Separator decorativo
 * <Separator variant="gradient" label="Seção 2" />
 * ```
 */
export interface SeparatorProps
  extends React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>,
    VariantProps<typeof separatorVariants> {
  /**
   * Orientação do separator
   */
  orientation?: "horizontal" | "vertical"
  
  /**
   * Se true, o separator é apenas decorativo (padrão Radix)
   */
  decorative?: boolean
  
  /**
   * Texto/label a ser exibido no centro do separator
   */
  label?: React.ReactNode
  
  /**
   * Posição do label no separator
   */
  labelPosition?: "start" | "center" | "end"
  
  /**
   * Ícone a ser exibido junto com o label
   */
  icon?: React.ReactNode
  
  /**
   * Se true, adiciona animação de entrada
   */
  animated?: boolean
  
  /**
   * Classes CSS customizadas para o label
   */
  labelClassName?: string
  
  /**
   * Classes CSS customizadas para o container do label
   */
  labelContainerClassName?: string
  
  /**
   * Duração da animação em segundos
   */
  animationDuration?: number
  
  /**
   * Se true, o separator tem largura/altura máxima definida
   */
  constrained?: boolean
  
  /**
   * Largura máxima para separators horizontais ou altura máxima para verticais
   */
  maxSize?: string | number
}

/**
 * Separator reutilizável com múltiplas variantes e funcionalidades
 * 
 * @param orientation - Orientação (horizontal, vertical)
 * @param variant - Variante visual (default, subtle, strong, accent, etc.)
 * @param size - Espessura do separator (xs, sm, default, lg, xl)
 * @param spacing - Espaçamento ao redor (none, sm, default, lg, xl)
 * @param decorative - Se true, é apenas decorativo
 * @param label - Texto/conteúdo no centro
 * @param labelPosition - Posição do label (start, center, end)
 * @param icon - Ícone junto ao label
 * @param animated - Se true, adiciona animação
 * @param labelClassName - Classes do label
 * @param labelContainerClassName - Classes do container do label
 * @param animationDuration - Duração da animação
 * @param constrained - Se true, aplica tamanho máximo
 * @param maxSize - Tamanho máximo
 * @param className - Classes CSS adicionais
 * @param ref - Referência para o elemento DOM
 */
const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>(
  (
    { 
      className,
      orientation = "horizontal",
      decorative = true,
      variant,
      size,
      spacing,
      label,
      labelPosition = "center",
      icon,
      animated = false,
      labelClassName,
      labelContainerClassName,
      animationDuration = 0.3,
      constrained = false,
      maxSize,
      ...props 
    },
    ref
  ) => {
    // Se não há label, renderiza separator simples
    if (!label && !icon) {
      return (
        <SeparatorPrimitive.Root
          ref={ref}
          decorative={decorative}
          orientation={orientation}
          className={cn(
            separatorVariants({ variant, size, spacing }),
            orientation === "horizontal" ? "w-full" : "h-full",
            animated && "transition-all duration-300 ease-in-out",
            constrained && orientation === "horizontal" && "max-w-full",
            constrained && orientation === "vertical" && "max-h-full",
            className
          )}
          style={{
            animationDuration: animated ? `${animationDuration}s` : undefined,
            ...(maxSize && orientation === "horizontal" ? { maxWidth: maxSize } : {}),
            ...(maxSize && orientation === "vertical" ? { maxHeight: maxSize } : {}),
          }}
          {...props}
        />
      )
    }

    // Renderizar separator com label
    const isHorizontal = orientation === "horizontal"
    
    return (
      <div 
        className={cn(
          "relative flex items-center",
          isHorizontal ? "w-full" : "h-full flex-col",
          spacing === "none" ? "" : isHorizontal ? "my-4" : "mx-4",
          constrained && isHorizontal && "max-w-full",
          constrained && !isHorizontal && "max-h-full",
          animated && "transition-all duration-300 ease-in-out"
        )}
        style={{
          animationDuration: animated ? `${animationDuration}s` : undefined,
          ...(maxSize && isHorizontal ? { maxWidth: maxSize } : {}),
          ...(maxSize && !isHorizontal ? { maxHeight: maxSize } : {}),
        }}
      >
        {/* Separator antes do label (quando label não está no início) */}
        {labelPosition !== "start" && (
          <SeparatorPrimitive.Root
            decorative={decorative}
            orientation={orientation}
            className={cn(
              separatorVariants({ variant, size }),
              isHorizontal ? "flex-1" : "flex-1",
              "shrink"
            )}
          />
        )}
        
        {/* Container do label */}
        <div 
          className={cn(
            "flex items-center gap-2 px-4 bg-background",
            !isHorizontal && "py-4 px-2",
            labelContainerClassName
          )}
        >
          {icon && (
            <span className="flex items-center">
              {icon}
            </span>
          )}
          
          {label && (
            <span className={cn(
              "text-sm text-muted-foreground font-medium whitespace-nowrap",
              labelClassName
            )}>
              {label}
            </span>
          )}
        </div>
        
        {/* Separator depois do label (quando label não está no fim) */}
        {labelPosition !== "end" && (
          <SeparatorPrimitive.Root
            decorative={decorative}
            orientation={orientation} 
            className={cn(
              separatorVariants({ variant, size }),
              isHorizontal ? "flex-1" : "flex-1",
              "shrink"
            )}
          />
        )}
      </div>
    )
  }
)

Separator.displayName = "Separator"

export { Separator, separatorVariants }
