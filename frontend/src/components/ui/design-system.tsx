
'use client'

import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

// =============================================================================
// CONTAINER COMPONENT
// =============================================================================
const containerVariants = cva(
  "mx-auto px-4 sm:px-6 lg:px-8",
  {
    variants: {
      size: {
        sm: "max-w-3xl",
        md: "max-w-5xl",
        lg: "max-w-7xl",
        xl: "max-w-[1400px]",
        full: "max-w-full",
      },
    },
    defaultVariants: {
      size: "lg",
    },
  }
)

interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {}

export function Container({ className, size, ...props }: ContainerProps) {
  return (
    <div className={cn(containerVariants({ size, className }))} {...props} />
  )
}

// =============================================================================
// SECTION COMPONENT
// =============================================================================
const sectionVariants = cva(
  "relative",
  {
    variants: {
      spacing: {
        sm: "py-8",
        md: "py-16",
        lg: "py-24",
        xl: "py-32",
      },
      background: {
        none: "",
        muted: "bg-muted/30",
        accent: "bg-accent/30",
        gradient: "bg-gradient-to-br from-background via-muted/20 to-accent/20",
        glass: "bg-white/5 backdrop-blur-sm",
      },
    },
    defaultVariants: {
      spacing: "md",
      background: "none",
    },
  }
)

interface SectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {}

export function Section({ className, spacing, background, ...props }: SectionProps) {
  return (
    <section className={cn(sectionVariants({ spacing, background, className }))} {...props} />
  )
}

// =============================================================================
// HEADING COMPONENT
// =============================================================================
const headingVariants = cva(
  "font-display font-bold tracking-tight",
  {
    variants: {
      level: {
        h1: "text-4xl sm:text-5xl lg:text-6xl",
        h2: "text-3xl sm:text-4xl lg:text-5xl",
        h3: "text-2xl sm:text-3xl lg:text-4xl",
        h4: "text-xl sm:text-2xl lg:text-3xl",
        h5: "text-lg sm:text-xl lg:text-2xl",
        h6: "text-base sm:text-lg lg:text-xl",
      },
      gradient: {
        none: "",
        primary: "bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent",
        secondary: "bg-gradient-to-r from-secondary to-secondary/80 bg-clip-text text-transparent",
        accent: "bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent",
        rainbow: "bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 bg-clip-text text-transparent",
      },
    },
    defaultVariants: {
      level: "h2",
      gradient: "none",
    },
  }
)

interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}

export function Heading({ className, level, gradient, as, ...props }: HeadingProps) {
  const Component = as || (level as keyof JSX.IntrinsicElements) || "h2"
  
  return (
    <Component className={cn(headingVariants({ level, gradient, className }))} {...props} />
  )
}

// =============================================================================
// TEXT COMPONENT
// =============================================================================
const textVariants = cva(
  "leading-relaxed",
  {
    variants: {
      size: {
        xs: "text-xs",
        sm: "text-sm",
        base: "text-base",
        lg: "text-lg",
        xl: "text-xl",
        "2xl": "text-2xl",
      },
      variant: {
        default: "text-foreground",
        muted: "text-muted-foreground",
        accent: "text-accent-foreground",
        destructive: "text-destructive",
        success: "text-green-600 dark:text-green-400",
        warning: "text-yellow-600 dark:text-yellow-400",
      },
    },
    defaultVariants: {
      size: "base",
      variant: "default",
    },
  }
)

interface TextProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {
  as?: "p" | "span" | "div"
}

export function Text({ className, size, variant, as = "p", ...props }: TextProps) {
  const Component = as
  
  return (
    <Component className={cn(textVariants({ size, variant, className }))} {...props} />
  )
}

// =============================================================================
// CARD COMPONENT
// =============================================================================
const cardVariants = cva(
  "rounded-xl border shadow-sm transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground border-border",
        glass: "bg-white/10 backdrop-blur-md border-white/20",
        gradient: "bg-gradient-to-br from-card to-card/50 border-border/50",
        hover: "hover:shadow-lg hover:-translate-y-1",
      },
      padding: {
        none: "",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  }
)

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ className, variant, padding, ...props }: CardProps) {
  return (
    <div className={cn(cardVariants({ variant, padding, className }))} {...props} />
  )
}

// =============================================================================
// GRID COMPONENT
// =============================================================================
const gridVariants = cva(
  "grid gap-6",
  {
    variants: {
      cols: {
        1: "grid-cols-1",
        2: "grid-cols-1 md:grid-cols-2",
        3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
        5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
        6: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
      },
      gap: {
        sm: "gap-4",
        md: "gap-6",
        lg: "gap-8",
        xl: "gap-10",
      },
    },
    defaultVariants: {
      cols: 3,
      gap: "md",
    },
  }
)

interface GridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants> {}

export function Grid({ className, cols, gap, ...props }: GridProps) {
  return (
    <div className={cn(gridVariants({ cols, gap, className }))} {...props} />
  )
}

// =============================================================================
// BADGE COMPONENT
// =============================================================================
const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        success: "bg-green-600 text-white",
        warning: "bg-yellow-600 text-white",
        outline: "border border-input",
        glass: "bg-white/10 backdrop-blur-sm border border-white/20 text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}
