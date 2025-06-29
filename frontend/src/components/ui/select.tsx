"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, ChevronDown, Search, X, Loader2, AlertCircle, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

const selectTriggerVariants = cva(
  "flex w-full items-center justify-between rounded-md border ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input bg-background text-foreground",
        destructive: "border-destructive bg-background text-foreground",
        success: "border-green-500 bg-background text-foreground",
        warning: "border-yellow-500 bg-background text-foreground",
        ghost: "border-transparent bg-transparent hover:bg-accent hover:text-accent-foreground",
        outline: "border-2 border-input bg-background text-foreground",
      },
      size: {
        sm: "h-8 px-2 py-1 text-xs",
        default: "h-10 px-3 py-2 text-sm",
        lg: "h-12 px-4 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const selectContentVariants = cva(
  "relative z-50 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  {
    variants: {
      size: {
        sm: "min-w-[6rem] max-h-48",
        default: "min-w-[8rem] max-h-60",
        lg: "min-w-[10rem] max-h-72",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

/**
 * Componente Select para seleção de opções com múltiplas funcionalidades
 * 
 * @example
 * ```tsx
 * // Select básico
 * <Select>
 *   <SelectTrigger>
 *     <SelectValue placeholder="Selecione uma opção" />
 *   </SelectTrigger>
 *   <SelectContent>
 *     <SelectItem value="option1">Opção 1</SelectItem>
 *     <SelectItem value="option2">Opção 2</SelectItem>
 *   </SelectContent>
 * </Select>
 * 
 * // Select com busca
 * <Select searchable>
 *   <SelectTrigger>
 *     <SelectValue placeholder="Buscar..." />
 *   </SelectTrigger>
 *   <SelectContent>
 *     <SelectItem value="apple" searchTerm="maçã apple fruit">
 *       🍎 Maçã
 *     </SelectItem>
 *   </SelectContent>
 * </Select>
 * ```
 */
export interface SelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>,
    VariantProps<typeof selectTriggerVariants> {
  /**
   * Ícone personalizado para substituir o ChevronDown
   */
  icon?: React.ReactNode
  
  /**
   * Se true, exibe indicador de loading
   */
  loading?: boolean
  
  /**
   * Se true, exibe indicador de erro
   */
  error?: boolean
  
  /**
   * Mensagem de erro a ser exibida
   */
  errorMessage?: string
  
  /**
   * Se true, permite limpar a seleção
   */
  clearable?: boolean
  
  /**
   * Callback para limpar seleção
   */
  onClear?: () => void
  
  /**
   * Prefixo visual (ícone ou avatar)
   */
  prefix?: React.ReactNode
  
  /**
   * Classes CSS para o container de erro
   */
  errorClassName?: string
}

export interface SelectContentProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>,
    VariantProps<typeof selectContentVariants> {
  /**
   * Se true, adiciona campo de busca
   */
  searchable?: boolean
  
  /**
   * Placeholder para o campo de busca
   */
  searchPlaceholder?: string
  
  /**
   * Se true, exibe contador de itens
   */
  showItemCount?: boolean
  
  /**
   * Texto exibido quando não há resultados
   */
  emptyText?: string
  
  /**
   * Se true, permite scroll virtual para muitos itens
   */
  virtualScroll?: boolean
  
  /**
   * Altura de cada item (para scroll virtual)
   */
  itemHeight?: number
  
  /**
   * Máximo de itens visíveis antes do scroll
   */
  maxVisibleItems?: number
}

export interface SelectItemProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> {
  /**
   * Ícone a ser exibido antes do texto
   */
  icon?: React.ReactNode
  
  /**
   * Avatar/imagem a ser exibida
   */
  avatar?: React.ReactNode
  
  /**
   * Descrição adicional
   */
  description?: string
  
  /**
   * Termo de busca para filtros
   */
  searchTerm?: string
  
  /**
   * Se true, destaca o item
   */
  featured?: boolean
  
  /**
   * Badge/indicador
   */
  badge?: React.ReactNode
  
  /**
   * Classes CSS para o ícone
   */
  iconClassName?: string
  
  /**
   * Classes CSS para a descrição
   */
  descriptionClassName?: string
}

export interface SelectGroupProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Group> {
  /**
   * Ícone para o grupo
   */
  icon?: React.ReactNode
  
  /**
   * Se true, o grupo é colapsível
   */
  collapsible?: boolean
  
  /**
   * Se true, o grupo inicia colapsado
   */
  defaultCollapsed?: boolean
}

const Select = SelectPrimitive.Root

const SelectGroup = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Group>,
  SelectGroupProps
>(({ className, icon, collapsible = false, defaultCollapsed = false, children, ...props }, ref) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)
  
  return (
    <SelectPrimitive.Group
      ref={ref}
      className={cn("", className)}
      {...props}
    >
      {collapsible ? (
        <div>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex w-full items-center justify-between px-2 py-1.5 text-sm font-semibold hover:bg-accent/50"
          >
            <div className="flex items-center gap-2">
              {icon}
              <span>{props.children}</span>
            </div>
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
          {!isCollapsed && children}
        </div>
      ) : (
        children
      )}
    </SelectPrimitive.Group>
  )
})
SelectGroup.displayName = "SelectGroup"

const SelectValue = SelectPrimitive.Value

/**
 * Trigger do Select com múltiplas variantes e funcionalidades
 */
const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(({ 
  className, 
  variant,
  size,
  icon,
  loading = false,
  error = false,
  errorMessage,
  clearable = false,
  onClear,
  prefix,
  errorClassName,
  children, 
  ...props 
}, ref) => {
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClear?.()
  }

  return (
    <div className="relative">
      <SelectPrimitive.Trigger
        ref={ref}
        className={cn(
          selectTriggerVariants({ variant: error ? "destructive" : variant, size }),
          prefix && "pl-10",
          (clearable || loading) && "pr-12",
          className
        )}
        {...props}
      >
        {/* Prefix */}
        {prefix && (
          <div className="absolute left-3 flex items-center">
            {prefix}
          </div>
        )}
        
        {children}
        
        {/* Icons */}
        <div className="flex items-center gap-1">
          {clearable && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-muted transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin opacity-50" />
          ) : error ? (
            <AlertCircle className="h-4 w-4 text-destructive" />
          ) : (
            <SelectPrimitive.Icon asChild>
              {icon || <ChevronDown className="h-4 w-4 opacity-50" />}
            </SelectPrimitive.Icon>
          )}
        </div>
      </SelectPrimitive.Trigger>
      
      {/* Error message */}
      {error && errorMessage && (
        <p className={cn(
          "mt-1 text-xs text-destructive",
          errorClassName
        )}>
          {errorMessage}
        </p>
      )}
    </div>
  )
})
SelectTrigger.displayName = "SelectTrigger"

/**
 * Content do Select com busca e funcionalidades avançadas
 */
const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  SelectContentProps
>(({ 
  className,
  size,
  searchable = false,
  searchPlaceholder = "Buscar...",
  showItemCount = false,
  emptyText = "Nenhum resultado encontrado",
  children, 
  position = "popper", 
  ...props 
}, ref) => {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filteredChildren, setFilteredChildren] = React.useState<React.ReactNode>(children)
  const [itemCount, setItemCount] = React.useState(0)
  
  // Filtrar children baseado no termo de busca
  React.useEffect(() => {
    if (!searchable || !searchTerm.trim()) {
      setFilteredChildren(children)
      return
    }
    
    const filterChildren = (nodes: React.ReactNode): React.ReactNode => {
      return React.Children.map(nodes, (child) => {
        if (!React.isValidElement(child)) return child
        
        // Se é um SelectItem
        if (child.type === SelectItem) {
          const searchTerm = child.props.searchTerm || 
                           (typeof child.props.children === 'string' ? child.props.children : '')
          
          if (searchTerm.toLowerCase().includes(searchTerm.toLowerCase())) {
            return child
          }
          return null
        }
        
        // Se é um grupo, filtrar recursivamente
        if (child.props?.children) {
          const filteredGroupChildren = filterChildren(child.props.children)
          if (React.Children.count(filteredGroupChildren) > 0) {
            return React.cloneElement(child, {}, filteredGroupChildren)
          }
          return null
        }
        
        return child
      })
    }
    
    const filtered = filterChildren(children)
    setFilteredChildren(filtered)
    
    // Contar itens
    const countItems = (nodes: React.ReactNode): number => {
      let count = 0
      React.Children.forEach(nodes, (child) => {
        if (React.isValidElement(child) && child.type === SelectItem) {
          count++
        } else if (React.isValidElement(child) && child.props?.children) {
          count += countItems(child.props.children)
        }
      })
      return count
    }
    
    setItemCount(countItems(filtered))
  }, [searchTerm, children, searchable])

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          selectContentVariants({ size }),
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}
      >
        {/* Campo de busca */}
        {searchable && (
          <div className="border-b p-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-transparent border-0 outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        )}
        
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          )}
        >
          {/* Contador de itens */}
          {showItemCount && searchable && (
            <div className="px-2 py-1 text-xs text-muted-foreground border-b mb-1">
              {itemCount} {itemCount === 1 ? 'item' : 'itens'}
            </div>
          )}
          
          {/* Conteúdo filtrado */}
          {React.Children.count(filteredChildren) > 0 ? (
            filteredChildren
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {emptyText}
            </div>
          )}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
})
SelectContent.displayName = "SelectContent"

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = "SelectLabel"

/**
 * Item do Select com ícones, avatares e funcionalidades avançadas
 */
const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  SelectItemProps
>(({ 
  className,
  icon,
  avatar,
  description,
  featured = false,
  badge,
  iconClassName,
  descriptionClassName,
  children, 
  ...props 
}, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      featured && "bg-accent/20 font-medium",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    {/* Avatar ou ícone */}
    {(avatar || icon) && (
      <div className={cn("mr-2 flex items-center", iconClassName)}>
        {avatar || icon}
      </div>
    )}

    <div className="flex-1 min-w-0">
      <SelectPrimitive.ItemText className="truncate">
        {children}
      </SelectPrimitive.ItemText>
      
      {description && (
        <div className={cn(
          "text-xs text-muted-foreground truncate",
          descriptionClassName
        )}>
          {description}
        </div>
      )}
    </div>
    
    {/* Badge */}
    {badge && (
      <div className="ml-2 flex items-center">
        {badge}
      </div>
    )}
  </SelectPrimitive.Item>
))
SelectItem.displayName = "SelectItem"

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = "SelectSeparator"

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  selectTriggerVariants,
  selectContentVariants,
}
