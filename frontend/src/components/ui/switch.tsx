"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, X, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const switchVariants = cva(
  "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-4 w-7",
        default: "h-6 w-11", 
        lg: "h-8 w-14",
      },
      variant: {
        default: "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        destructive: "data-[state=checked]:bg-destructive data-[state=unchecked]:bg-input",
        success: "data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-input",
        warning: "data-[state=checked]:bg-yellow-500 data-[state=unchecked]:bg-input",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

const thumbVariants = cva(
  "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform",
  {
    variants: {
      size: {
        sm: "h-3 w-3 data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0",
        default: "h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        lg: "h-7 w-7 data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
    VariantProps<typeof switchVariants> {
  loading?: boolean
  showIcons?: boolean
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, size, variant, loading, showIcons, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(switchVariants({ size, variant }), className)}
    {...props}
    ref={ref}
    disabled={loading || props.disabled}
  >
    <SwitchPrimitives.Thumb className={cn(thumbVariants({ size }))}>
      {loading && (
        <Loader2 className="h-3 w-3 animate-spin" />
      )}
      {showIcons && !loading && (
        <>
          <Check className="h-3 w-3 opacity-0 data-[state=checked]:opacity-100" />
          <X className="h-3 w-3 opacity-100 data-[state=checked]:opacity-0" />
        </>
      )}
    </SwitchPrimitives.Thumb>
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch, switchVariants }

const switchThumbVariants = cva(
  "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform duration-200",
  {
    variants: {
      size: {
        sm: "h-3 w-3 data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0",
        default: "h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        lg: "h-6 w-6 data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

/**
 * Componente Switch para alternar entre estados on/off
 * 
 * @example
 * ```tsx
 * // Switch básico
 * <Switch />
 * 
 * // Switch com label
 * <Switch label="Notificações" />
 * 
 * // Switch com ícones
 * <Switch showIcons />
 * 
 * // Switch com loading
 * <Switch loading />
 * ```
 */
export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
    VariantProps<typeof switchVariants> {
  /**
   * Texto do label associado ao switch
   */
  label?: string
  
  /**
   * Descrição adicional exibida abaixo do label
   */
  description?: string
  
  /**
   * Se true, exibe ícones de check/x no thumb
   */
  showIcons?: boolean
  
  /**
   * Ícone customizado para estado checked
   */
  checkedIcon?: React.ReactNode
  
  /**
   * Ícone customizado para estado unchecked
   */
  uncheckedIcon?: React.ReactNode
  
  /**
   * Se true, mostra estado de carregamento
   */
  loading?: boolean
  
  /**
   * Posição do label em relação ao switch
   */
  labelPosition?: "left" | "right"
  
  /**
   * Se true, o label é clicável para alternar o switch
   */
  labelClickable?: boolean
  
  /**
   * Classes CSS customizadas para o container
   */
  containerClassName?: string
  
  /**
   * Classes CSS customizadas para o label
   */
  labelClassName?: string
  
  /**
   * Classes CSS customizadas para a descrição
   */
  descriptionClassName?: string
  
  /**
   * ID do switch para associação com label
   */
  id?: string
}

/**
 * Switch reutilizável com múltiplas variantes e funcionalidades
 * 
 * @param variant - Variante de cor (default, destructive, success, warning)
 * @param size - Tamanho do switch (sm, default, lg)
 * @param label - Texto do label
 * @param description - Descrição adicional
 * @param showIcons - Se true, exibe ícones no thumb
 * @param checkedIcon - Ícone customizado para checked
 * @param uncheckedIcon - Ícone customizado para unchecked
 * @param loading - Se true, mostra loading spinner
 * @param labelPosition - Posição do label (left, right)
 * @param labelClickable - Se true, label é clicável
 * @param containerClassName - Classes do container
 * @param labelClassName - Classes do label
 * @param descriptionClassName - Classes da descrição
 * @param className - Classes CSS adicionais
 * @param ref - Referência para o elemento DOM
 */
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ 
  className,
  size,
  variant,
  label,
  description,
  showIcons = false,
  checkedIcon,
  uncheckedIcon,
  loading = false,
  labelPosition = "right",
  labelClickable = true,
  containerClassName,
  labelClassName,
  descriptionClassName,
  disabled,
  checked,
  id,
  onCheckedChange,
  ...props 
}, ref) => {
  const switchId = id || React.useId()
  
  // Ícones padrão baseados no tamanho
  const getIconSize = () => {
    switch (size) {
      case "sm": return "h-2 w-2"
      case "lg": return "h-4 w-4"
      default: return "h-3 w-3"
    }
  }
  
  const iconSize = getIconSize()
  const DefaultCheckedIcon = checkedIcon || <Check className={iconSize} />
  const DefaultUncheckedIcon = uncheckedIcon || <X className={iconSize} />
  const LoadingIcon = <Loader2 className={`${iconSize} animate-spin`} />
  
  const handleLabelClick = () => {
    if (labelClickable && !disabled && !loading && onCheckedChange) {
      onCheckedChange(!checked)
    }
  }
  
  const switchElement = (
    <SwitchPrimitives.Root
      className={cn(switchVariants({ size, variant }), className)}
      disabled={disabled || loading}
      checked={checked}
      onCheckedChange={onCheckedChange}
      id={switchId}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(switchThumbVariants({ size }))}
      >
        {(showIcons || loading) && (
          <div className="flex h-full w-full items-center justify-center text-primary-foreground">
            {loading ? (
              LoadingIcon
            ) : checked ? (
              DefaultCheckedIcon
            ) : (
              DefaultUncheckedIcon
            )}
          </div>
        )}
      </SwitchPrimitives.Thumb>
    </SwitchPrimitives.Root>
  )
  
  if (!label && !description) {
    return switchElement
  }
  
  const labelElement = (
    <div className="grid gap-1.5 leading-none">
      {label && (
        <label
          htmlFor={switchId}
          className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            labelClickable && !disabled && !loading && "cursor-pointer",
            labelClassName
          )}
          onClick={handleLabelClick}
        >
          {label}
        </label>
      )}
      {description && (
        <p className={cn(
          "text-xs text-muted-foreground",
          descriptionClassName
        )}>
          {description}
        </p>
      )}
    </div>
  )
  
  return (
    <div className={cn(
      "flex items-center space-x-2",
      labelPosition === "left" && "flex-row-reverse space-x-reverse",
      containerClassName
    )}>
      {switchElement}
      {labelElement}
    </div>
  )
})

Switch.displayName = "Switch"

export { Switch, switchVariants }
