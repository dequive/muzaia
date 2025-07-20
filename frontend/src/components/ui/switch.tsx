"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, X, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const switchVariants = cva(
  "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
  {
    variants: {
      size: {
        default: "h-6 w-11",
        sm: "h-5 w-9",
        lg: "h-7 w-13",
      },
      variant: {
        default: "",
        destructive: "data-[state=checked]:bg-destructive",
        outline: "border-input bg-background data-[state=checked]:bg-primary",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

const thumbVariants = cva(
  "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=unchecked]:translate-x-0",
  {
    variants: {
      size: {
        default: "h-5 w-5 data-[state=checked]:translate-x-5",
        sm: "h-4 w-4 data-[state=checked]:translate-x-4",
        lg: "h-6 w-6 data-[state=checked]:translate-x-6",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
    VariantProps<typeof switchVariants>,
    VariantProps<typeof thumbVariants> {
  loading?: boolean
  showIcons?: boolean
  label?: string
  description?: string
  checkedIcon?: React.ReactNode
  uncheckedIcon?: React.ReactNode
  labelPosition?: "left" | "right"
  labelClickable?: boolean
  containerClassName?: string
  labelClassName?: string
  descriptionClassName?: string
  id?: string
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ 
  className, 
  size, 
  variant, 
  loading, 
  showIcons,
  label,
  description,
  checkedIcon,
  uncheckedIcon,
  labelPosition,
  labelClickable,
  containerClassName,
  labelClassName,
  descriptionClassName,
  id,
  ...props 
}, ref) => (
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

export { Switch }