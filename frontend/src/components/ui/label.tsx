"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"
import { Info, AlertCircle, HelpCircle } from "lucide-react"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      variant: {
        default: "text-foreground",
        muted: "text-muted-foreground",
        destructive: "text-destructive",
        success: "text-green-600",
        warning: "text-yellow-600",
      },
      size: {
        xs: "text-xs",
        sm: "text-sm",
        default: "text-sm",
        lg: "text-base",
        xl: "text-lg",
      },
      weight: {
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
        bold: "font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      weight: "medium",
    },
  }
)

/**
 * Componente Label para rotular campos de formulário e elementos interativos
 * 
 * @example
 * ```tsx
 * // Label básico
 * <Label htmlFor="email">Email</Label>
 * 
 * // Label obrigatório
 * <Label htmlFor="name" required>Nome completo</Label>
 * 
 * // Label com ajuda
 * <Label htmlFor="password" helpText="Mínimo 8 caracteres">
 *   Password
 * </Label>
 * 
 * // Label com ícone
 * <Label htmlFor="status" icon={<AlertCircle />} variant="destructive">
 *   Status
 * </Label>
 * ```
 */
export interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {
  /**
   * Se true, exibe indicador visual de campo obrigatório (*)
   */
  required?: boolean
  
  /**
   * Texto de ajuda exibido abaixo do label
   */
  helpText?: string
  
  /**
   * Tooltip exibido ao passar o mouse sobre o ícone de ajuda
   */
  tooltip?: string
  
  /**
   * Ícone exibido antes do texto do label
   */
  icon?: React.ReactNode
  
  /**
   * Se true, exibe ícone de ajuda que mostra tooltip ao hover
   */
  showHelpIcon?: boolean
  
  /**
   * Posição do indicador de obrigatório
   */
  requiredPosition?: "start" | "end"
  
  /**
   * Texto customizado para o indicador de obrigatório
   */
  requiredIndicator?: React.ReactNode
  
  /**
   * Classes CSS customizadas para o texto de ajuda
   */
  helpTextClassName?: string
  
  /**
   * Classes CSS customizadas para o container
   */
  containerClassName?: string
  
  /**
   * Se true, o label não será associado a nenhum elemento (útil para labels decorativos)
   */
  asChild?: boolean
  
  /**
   * Callback chamado quando o ícone de ajuda é clicado
   */
  onHelpClick?: () => void
}

/**
 * Label reutilizável com suporte a variantes, indicadores e funcionalidades avançadas
 * 
 * @param variant - Variante de cor (default, muted, destructive, success, warning)
 * @param size - Tamanho do texto (xs, sm, default, lg, xl)
 * @param weight - Peso da fonte (normal, medium, semibold, bold)
 * @param required - Se true, exibe indicador de obrigatório
 * @param helpText - Texto de ajuda
 * @param tooltip - Tooltip do ícone de ajuda
 * @param icon - Ícone antes do texto
 * @param showHelpIcon - Se true, exibe ícone de ajuda
 * @param requiredPosition - Posição do indicador (start, end)
 * @param requiredIndicator - Indicador customizado
 * @param helpTextClassName - Classes do texto de ajuda
 * @param containerClassName - Classes do container
 * @param onHelpClick - Callback do clique na ajuda
 * @param className - Classes CSS adicionais
 * @param children - Conteúdo do label
 * @param ref - Referência para o elemento DOM
 */
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ 
  className,
  variant,
  size,
  weight,
  required = false,
  helpText,
  tooltip,
  icon,
  showHelpIcon = false,
  requiredPosition = "end",
  requiredIndicator = "*",
  helpTextClassName,
  containerClassName,
  onHelpClick,
  children,
  ...props 
}, ref) => {
  const [showTooltip, setShowTooltip] = React.useState(false)
  
  // Indicador de obrigatório
  const RequiredIndicator = () => (
    <span 
      className="text-destructive ml-1 select-none" 
      aria-label="required field"
    >
      {requiredIndicator}
    </span>
  )
  
  // Ícone de ajuda
  const HelpIcon = () => (
    <button
      type="button"
      className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-muted transition-colors"
      onClick={onHelpClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      aria-label={tooltip || "More information"}
    >
      <HelpCircle className="w-3 h-3 text-muted-foreground" />
    </button>
  )
  
  // Conteúdo do label
  const labelContent = (
    <>
      {icon && (
        <span className="mr-1 inline-flex items-center">
          {icon}
        </span>
      )}
      
      {required && requiredPosition === "start" && <RequiredIndicator />}
      
      <span>{children}</span>
      
      {required && requiredPosition === "end" && <RequiredIndicator />}
      
      {(showHelpIcon || tooltip) && <HelpIcon />}
    </>
  )
  
  // Se não há helpText, retorna apenas o label
  if (!helpText) {
    return (
      <div className={cn("relative", containerClassName)}>
        <LabelPrimitive.Root
          ref={ref}
          className={cn(
            labelVariants({ variant, size, weight }),
            "inline-flex items-center",
            className
          )}
          {...props}
        >
          {labelContent}
        </LabelPrimitive.Root>
        
        {/* Tooltip */}
        {tooltip && showTooltip && (
          <div className="absolute z-50 px-2 py-1 text-xs text-white bg-black rounded shadow-lg -top-8 left-0 whitespace-nowrap">
            {tooltip}
            <div className="absolute top-full left-2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black" />
          </div>
        )}
      </div>
    )
  }
  
  // Com helpText, retorna container com label e texto de ajuda
  return (
    <div className={cn("space-y-1", containerClassName)}>
      <div className="relative">
        <LabelPrimitive.Root
          ref={ref}
          className={cn(
            labelVariants({ variant, size, weight }),
            "inline-flex items-center",
            className
          )}
          {...props}
        >
          {labelContent}
        </LabelPrimitive.Root>
        
        {/* Tooltip */}
        {tooltip && showTooltip && (
          <div className="absolute z-50 px-2 py-1 text-xs text-white bg-black rounded shadow-lg -top-8 left-0 whitespace-nowrap">
            {tooltip}
            <div className="absolute top-full left-2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black" />
          </div>
        )}
      </div>
      
      {/* Texto de ajuda */}
      <p className={cn(
        "text-xs text-muted-foreground",
        helpTextClassName
      )}>
        {helpText}
      </p>
    </div>
  )
})

Label.displayName = "Label"

export { Label, labelVariants }
