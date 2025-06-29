"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const sliderVariants = cva(
  "relative flex w-full touch-none select-none items-center",
  {
    variants: {
      size: {
        sm: "[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&>span:first-child]:h-1",
        default: "[&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&>span:first-child]:h-2",
        lg: "[&_[role=slider]]:h-6 [&_[role=slider]]:w-6 [&>span:first-child]:h-3",
      },
      variant: {
        default: "",
        destructive: "",
        success: "",
        warning: "",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

const sliderTrackVariants = cva(
  "relative w-full grow overflow-hidden rounded-full bg-secondary",
  {
    variants: {
      size: {
        sm: "h-1",
        default: "h-2",
        lg: "h-3",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const sliderRangeVariants = cva(
  "absolute h-full",
  {
    variants: {
      variant: {
        default: "bg-primary",
        destructive: "bg-destructive",
        success: "bg-green-500",
        warning: "bg-yellow-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const sliderThumbVariants = cva(
  "block rounded-full border-2 bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-primary",
        destructive: "border-destructive",
        success: "border-green-500",
        warning: "border-yellow-500",
      },
      size: {
        sm: "h-4 w-4",
        default: "h-5 w-5",
        lg: "h-6 w-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * Componente Slider para seleção de valores em um intervalo
 * 
 * @example
 * ```tsx
 * // Slider básico
 * <Slider defaultValue={[50]} max={100} step={1} />
 * 
 * // Slider com valores exibidos
 * <Slider defaultValue={[25]} showValue />
 * 
 * // Slider de intervalo
 * <Slider defaultValue={[20, 80]} showValue />
 * 
 * // Slider com marcações
 * <Slider defaultValue={[50]} showTicks tickCount={5} />
 * ```
 */
export interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>,
    VariantProps<typeof sliderVariants> {
  /**
   * Se true, exibe os valores atuais
   */
  showValue?: boolean
  
  /**
   * Posição dos valores exibidos
   */
  valuePosition?: "top" | "bottom" | "inline"
  
  /**
   * Se true, exibe marcações na track
   */
  showTicks?: boolean
  
  /**
   * Número de marcações a serem exibidas
   */
  tickCount?: number
  
  /**
   * Array de valores específicos para marcações
   */
  tickValues?: number[]
  
  /**
   * Labels para as marcações
   */
  tickLabels?: string[]
  
  /**
   * Função para formatar os valores exibidos
   */
  formatValue?: (value: number) => string
  
  /**
   * Label para o valor mínimo
   */
  minLabel?: string
  
  /**
   * Label para o valor máximo
   */
  maxLabel?: string
  
  /**
   * Se true, exibe tooltip no thumb durante drag
   */
  showTooltip?: boolean
  
  /**
   * Prefixo para os valores (ex: "$", "R$")
   */
  valuePrefix?: string
  
  /**
   * Sufixo para os valores (ex: "%", "px", "kg")
   */
  valueSuffix?: string
  
  /**
   * Classes CSS customizadas para o container de valores
   */
  valueClassName?: string
  
  /**
   * Classes CSS customizadas para as marcações
   */
  tickClassName?: string
  
  /**
   * Classes CSS customizadas para os labels min/max
   */
  labelClassName?: string
  
  /**
   * Se true, desabilita a animação
   */
  disableAnimation?: boolean
}

/**
 * Slider reutilizável com múltiplas funcionalidades e variantes
 * 
 * @param variant - Variante de cor (default, destructive, success, warning)
 * @param size - Tamanho do slider (sm, default, lg)
 * @param showValue - Se true, exibe valores
 * @param valuePosition - Posição dos valores (top, bottom, inline)
 * @param showTicks - Se true, exibe marcações
 * @param tickCount - Número de marcações
 * @param tickValues - Valores específicos para marcações
 * @param tickLabels - Labels das marcações
 * @param formatValue - Função de formatação
 * @param minLabel - Label do valor mínimo
 * @param maxLabel - Label do valor máximo
 * @param showTooltip - Se true, exibe tooltip
 * @param valuePrefix - Prefixo dos valores
 * @param valueSuffix - Sufixo dos valores
 * @param valueClassName - Classes dos valores
 * @param tickClassName - Classes das marcações
 * @param labelClassName - Classes dos labels
 * @param disableAnimation - Se true, desabilita animação
 * @param className - Classes CSS adicionais
 * @param ref - Referência para o elemento DOM
 */
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ 
  className,
  variant,
  size,
  showValue = false,
  valuePosition = "top",
  showTicks = false,
  tickCount = 5,
  tickValues,
  tickLabels,
  formatValue = (value) => value.toString(),
  minLabel,
  maxLabel,
  showTooltip = false,
  valuePrefix = "",
  valueSuffix = "",
  valueClassName,
  tickClassName,
  labelClassName,
  disableAnimation = false,
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  ...props 
}, ref) => {
  const [localValue, setLocalValue] = React.useState(defaultValue || [0])
  const [isDragging, setIsDragging] = React.useState(false)
  
  // Valor atual (controlado ou não controlado)
  const currentValue = value || localValue
  
  // Gerar valores para marcações
  const getTickValues = React.useMemo(() => {
    if (tickValues) return tickValues
    
    const ticks: number[] = []
    const interval = (max - min) / (tickCount - 1)
    
    for (let i = 0; i < tickCount; i++) {
      ticks.push(min + (interval * i))
    }
    
    return ticks
  }, [tickValues, tickCount, min, max])
  
  // Formatar valor com prefixo e sufixo
  const formatDisplayValue = (val: number) => {
    return `${valuePrefix}${formatValue(val)}${valueSuffix}`
  }
  
  // Handler para mudança de valor
  const handleValueChange = (newValue: number[]) => {
    if (!value) {
      setLocalValue(newValue)
    }
    onValueChange?.(newValue)
  }
  
  // Calcular posição percentual de um valor
  const getPercentPosition = (val: number) => {
    return ((val - min) / (max - min)) * 100
  }
  
  return (
    <div className="w-full space-y-2">
      {/* Valores no topo */}
      {showValue && valuePosition === "top" && (
        <div className="flex justify-between text-sm">
          {currentValue.map((val, index) => (
            <span key={index} className={cn("font-medium", valueClassName)}>
              {formatDisplayValue(val)}
            </span>
          ))}
        </div>
      )}
      
      {/* Labels min/max */}
      {(minLabel || maxLabel) && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className={labelClassName}>{minLabel}</span>
          <span className={labelClassName}>{maxLabel}</span>
        </div>
      )}
      
      {/* Container do slider */}
      <div className="relative">
        <SliderPrimitive.Root
          ref={ref}
          className={cn(sliderVariants({ size, variant }), className)}
          value={currentValue}
          onValueChange={handleValueChange}
          min={min}
          max={max}
          step={step}
          onPointerDown={() => setIsDragging(true)}
          onPointerUp={() => setIsDragging(false)}
          {...props}
        >
          <SliderPrimitive.Track 
            className={sliderTrackVariants({ size })}
          >
            <SliderPrimitive.Range 
              className={sliderRangeVariants({ variant })}
            />
          </SliderPrimitive.Track>
          
          {/* Thumbs */}
          {currentValue.map((_, index) => (
            <SliderPrimitive.Thumb
              key={index}
              className={sliderThumbVariants({ variant, size })}
            >
              {/* Tooltip durante drag */}
              {showTooltip && isDragging && (
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap">
                  {formatDisplayValue(currentValue[index])}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black" />
                </div>
              )}
            </SliderPrimitive.Thumb>
          ))}
        </SliderPrimitive.Root>
        
        {/* Marcações */}
        {showTicks && (
          <div className="absolute -bottom-4 left-0 right-0">
            {getTickValues.map((tickValue, index) => (
              <div
                key={index}
                className={cn(
                  "absolute w-0.5 h-2 bg-muted-foreground/50",
                  tickClassName
                )}
                style={{ left: `${getPercentPosition(tickValue)}%` }}
              >
                {tickLabels?.[index] && (
                  <span className="absolute top-3 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap">
                    {tickLabels[index]}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Valores inline */}
        {showValue && valuePosition === "inline" && (
          <div className="absolute -top-1 flex w-full">
            {currentValue.map((val, index) => (
              <div
                key={index}
                className="absolute transform -translate-x-1/2 -translate-y-full"
                style={{ left: `${getPercentPosition(val)}%` }}
              >
                <span className={cn(
                  "px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap",
                  valueClassName
                )}>
                  {formatDisplayValue(val)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Valores na base */}
      {showValue && valuePosition === "bottom" && (
        <div className="flex justify-between text-sm">
          {currentValue.map((val, index) => (
            <span key={index} className={cn("font-medium", valueClassName)}>
              {formatDisplayValue(val)}
            </span>
          ))}
        </div>
      )}
    </div>
  )
})

Slider.displayName = "Slider"

export { Slider, sliderVariants }
