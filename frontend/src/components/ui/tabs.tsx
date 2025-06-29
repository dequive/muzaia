"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

const tabsListVariants = cva(
  "inline-flex items-center justify-center text-muted-foreground",
  {
    variants: {
      variant: {
        default: "h-10 rounded-md bg-muted p-1",
        underline: "h-10 border-b bg-transparent p-0",
        pills: "h-10 bg-transparent p-1 space-x-1",
        contained: "h-12 rounded-lg bg-card border p-2 shadow-sm",
        minimal: "h-10 bg-transparent p-0",
      },
      size: {
        sm: "h-8 text-xs",
        default: "h-10 text-sm",
        lg: "h-12 text-base",
      },
      orientation: {
        horizontal: "flex-row",
        vertical: "flex-col h-auto w-auto",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      orientation: "horizontal",
      fullWidth: false,
    },
  }
)

const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "rounded-sm px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        underline: "border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:text-foreground hover:text-foreground",
        pills: "rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted",
        contained: "rounded-md px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm hover:bg-muted/50",
        minimal: "px-3 py-1.5 data-[state=active]:text-foreground hover:text-foreground",
      },
      size: {
        sm: "text-xs px-2 py-1",
        default: "text-sm px-3 py-1.5",
        lg: "text-base px-4 py-2",
      },
      orientation: {
        horizontal: "",
        vertical: "w-full justify-start",
      },
      closable: {
        true: "pr-1",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      orientation: "horizontal",
      closable: false,
    },
  }
)

/**
 * Componente Tabs para organização de conteúdo em abas
 * 
 * @example
 * ```tsx
 * // Tabs básico
 * <Tabs defaultValue="tab1">
 *   <TabsList>
 *     <TabsTrigger value="tab1">Tab 1</TabsTrigger>
 *     <TabsTrigger value="tab2">Tab 2</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="tab1">Content 1</TabsContent>
 *   <TabsContent value="tab2">Content 2</TabsContent>
 * </Tabs>
 * 
 * // Tabs com ícones e badges
 * <TabsList>
 *   <TabsTrigger value="inbox" icon={<Mail />} badge={5}>
 *     Inbox
 *   </TabsTrigger>
 * </TabsList>
 * ```
 */
export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {
  /**
   * Se true, as abas ocupam toda a largura disponível
   */
  fullWidth?: boolean
  
  /**
   * Se true, permite scroll horizontal quando há muitas abas
   */
  scrollable?: boolean
  
  /**
   * Classes CSS customizadas para o container de scroll
   */
  scrollContainerClassName?: string
}

export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    Omit<VariantProps<typeof tabsTriggerVariants>, 'orientation' | 'closable'> {
  /**
   * Ícone a ser exibido antes do texto
   */
  icon?: React.ReactNode
  
  /**
   * Badge/contador a ser exibido após o texto
   */
  badge?: React.ReactNode
  
  /**
   * Se true, exibe botão de fechar
   */
  closable?: boolean
  
  /**
   * Callback chamado quando o botão de fechar é clicado
   */
  onClose?: () => void
  
  /**
   * Se true, a aba está em estado de carregamento
   */
  loading?: boolean
  
  /**
   * Tooltip exibido ao passar o mouse
   */
  tooltip?: string
  
  /**
   * Classes CSS customizadas para o ícone
   */
  iconClassName?: string
  
  /**
   * Classes CSS customizadas para o badge
   */
  badgeClassName?: string
  
  /**
   * Se true, a aba está desabilitada com feedback visual
   */
  disabled?: boolean
}

export interface TabsContentProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {
  /**
   * Se true, o conteúdo é carregado apenas quando a aba é ativada
   */
  lazy?: boolean
  
  /**
   * Componente de loading exibido enquanto o conteúdo está sendo carregado
   */
  loadingComponent?: React.ReactNode
  
  /**
   * Se true, adiciona padding ao conteúdo
   */
  padded?: boolean
  
  /**
   * Se true, adiciona animação de entrada
   */
  animated?: boolean
}

const Tabs = TabsPrimitive.Root

/**
 * Lista de abas com suporte a múltiplas variantes e funcionalidades
 */
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ 
  className, 
  variant,
  size,
  orientation = "horizontal",
  fullWidth = false,
  scrollable = false,
  scrollContainerClassName,
  ...props 
}, ref) => {
  const [showLeftScroll, setShowLeftScroll] = React.useState(false)
  const [showRightScroll, setShowRightScroll] = React.useState(false)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  
  const checkScrollButtons = React.useCallback(() => {
    const container = scrollContainerRef.current
    if (!container || !scrollable) return
    
    setShowLeftScroll(container.scrollLeft > 0)
    setShowRightScroll(
      container.scrollLeft < container.scrollWidth - container.clientWidth
    )
  }, [scrollable])
  
  React.useEffect(() => {
    if (scrollable) {
      checkScrollButtons()
      const container = scrollContainerRef.current
      container?.addEventListener('scroll', checkScrollButtons)
      window.addEventListener('resize', checkScrollButtons)
      
      return () => {
        container?.removeEventListener('scroll', checkScrollButtons)
        window.removeEventListener('resize', checkScrollButtons)
      }
    }
  }, [scrollable, checkScrollButtons])
  
  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return
    
    const scrollAmount = 200
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
  }
  
  if (scrollable) {
    return (
      <div className="relative flex items-center">
        {showLeftScroll && (
          <button
            type="button"
            onClick={() => scroll('left')}
            className="absolute left-0 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-md border"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        
        <div
          ref={scrollContainerRef}
          className={cn(
            "flex overflow-x-auto scrollbar-hide",
            showLeftScroll && "pl-10",
            showRightScroll && "pr-10",
            scrollContainerClassName
          )}
        >
          <TabsPrimitive.List
            ref={ref}
            className={cn(
              tabsListVariants({ variant, size, orientation, fullWidth }),
              "flex-nowrap",
              className
            )}
            {...props}
          />
        </div>
        
        {showRightScroll && (
          <button
            type="button"
            onClick={() => scroll('right')}
            className="absolute right-0 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-md border"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
  
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        tabsListVariants({ variant, size, orientation, fullWidth }),
        className
      )}
      {...props}
    />
  )
})
TabsList.displayName = "TabsList"

/**
 * Trigger de aba com suporte a ícones, badges e funcionalidades avançadas
 */
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ 
  className,
  variant,
  size,
  icon,
  badge,
  closable = false,
  onClose,
  loading = false,
  tooltip,
  iconClassName,
  badgeClassName,
  disabled,
  children,
  ...props 
}, ref) => {
  const [showTooltip, setShowTooltip] = React.useState(false)
  
  // Determinar orientação do contexto pai
  const orientation = React.useContext(TabsOrientationContext)
  
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onClose?.(
    )
  }
  
  return (
    <div className="relative">
      <TabsPrimitive.Trigger
        ref={ref}
        className={cn(
          tabsTriggerVariants({ 
            variant, 
            size, 
            orientation, 
            closable: closable && !disabled 
          }),
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        disabled={disabled || loading}
        onMouseEnter={() => tooltip && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        {...props}
      >
        {/* Ícone */}
        {icon && !loading && (
          <span className={cn("mr-2 flex items-center", iconClassName)}>
            {icon}
          </span>
        )}
        
        {/* Loading spinner */}
        {loading && (
          <span className="mr-2 flex items-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </span>
        )}
        
        {/* Texto */}
        <span className="flex-1">{children}</span>
        
        {/* Badge */}
        {badge && (
          <span className={cn(
            "ml-2 flex items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-xs text-destructive-foreground",
            badgeClassName
          )}>
            {badge}
          </span>
        )}
        
        {/* Botão de fechar */}
        {closable && !disabled && (
          <button
            type="button"
            onClick={handleClose}
            className="ml-2 flex h-4 w-4 items-center justify-center rounded-full hover:bg-muted-foreground/20 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </TabsPrimitive.Trigger>
      
      {/* Tooltip */}
      {tooltip && showTooltip && (
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap z-50">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black" />
        </div>
      )}
    </div>
  )
})
TabsTrigger.displayName = "TabsTrigger"

/**
 * Conteúdo de aba com suporte a lazy loading e animações
 */
const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(({ 
  className,
  lazy = false,
  loadingComponent,
  padded = false,
  animated = false,
  children,
  value,
  ...props 
}, ref) => {
  const [hasBeenActive, setHasBeenActive] = React.useState(!lazy)
  const [isLoading, setIsLoading] = React.useState(false)
  
  // Verificar se a aba está ativa
  const isActive = React.useContext(TabsValueContext) === value
  
  React.useEffect(() => {
    if (isActive && !hasBeenActive && lazy) {
      setIsLoading(true)
      setHasBeenActive(true)
      
      // Simular carregamento assíncrono
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [isActive, hasBeenActive, lazy])
  
  return (
    <TabsPrimitive.Content
      ref={ref}
      value={value}
      className={cn(
        "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        padded && "p-4",
        animated && "transition-all duration-200 ease-in-out",
        animated && isActive && "animate-in fade-in-0 slide-in-from-bottom-2",
        className
      )}
      {...props}
    >
      {lazy && !hasBeenActive ? null : isLoading ? (
        loadingComponent || (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )
      ) : (
        children
      )}
    </TabsPrimitive.Content>
  )
})
TabsContent.displayName = "TabsContent"

// Contextos para comunicação entre componentes
const TabsOrientationContext = React.createContext<'horizontal' | 'vertical'>('horizontal')
const TabsValueContext = React.createContext<string | undefined>(undefined)

// Provider para orientação e valor atual
const TabsProvider: React.FC<{
  orientation?: 'horizontal' | 'vertical'
  value?: string
  children: React.ReactNode
}> = ({ orientation = 'horizontal', value, children }) => {
  return (
    <TabsOrientationContext.Provider value={orientation}>
      <TabsValueContext.Provider value={value}>
        {children}
      </TabsValueContext.Provider>
    </TabsOrientationContext.Provider>
  )
}

export { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent, 
  TabsProvider,
  tabsListVariants,
  tabsTriggerVariants
}
