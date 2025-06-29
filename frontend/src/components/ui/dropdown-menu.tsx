"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { cva, type VariantProps } from "class-variance-authority"
import { 
  Check, 
  ChevronRight, 
  Circle, 
  Search,
  MoreHorizontal,
  User,
  Settings,
  LogOut,
  Loader2
} from "lucide-react"

import { cn } from "@/lib/utils"

const dropdownMenuContentVariants = cva(
  "z-50 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  {
    variants: {
      size: {
        sm: "min-w-[6rem] p-1",
        default: "min-w-[8rem] p-1",
        lg: "min-w-[12rem] p-1",
        xl: "min-w-[16rem] p-2",
      },
      variant: {
        default: "border-border bg-popover",
        dark: "border-border bg-background text-foreground",
        ghost: "border-transparent bg-background/80 backdrop-blur-sm",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

const dropdownMenuItemVariants = cva(
  "relative flex cursor-default select-none items-center rounded-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  {
    variants: {
      variant: {
        default: "",
        destructive: "text-destructive focus:bg-destructive focus:text-destructive-foreground",
        ghost: "hover:bg-accent/50",
      },
      size: {
        sm: "px-1.5 py-1 text-xs",
        default: "px-2 py-1.5 text-sm",
        lg: "px-3 py-2 text-base",
      },
      inset: {
        true: "pl-8",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      inset: false,
    },
  }
)

/**
 * Componente DropdownMenu para navegação e ações contextuais
 * 
 * @example
 * ```tsx
 * // Dropdown básico
 * <DropdownMenu>
 *   <DropdownMenuTrigger asChild>
 *     <Button variant="outline">Options</Button>
 *   </DropdownMenuTrigger>
 *   <DropdownMenuContent>
 *     <DropdownMenuItem>Profile</DropdownMenuItem>
 *     <DropdownMenuItem>Settings</DropdownMenuItem>
 *     <DropdownMenuSeparator />
 *     <DropdownMenuItem>Logout</DropdownMenuItem>
 *   </DropdownMenuContent>
 * </DropdownMenu>
 * 
 * // Com ícones e funcionalidades
 * <DropdownMenuItem icon={<User />} shortcut="⌘P">
 *   Profile
 * </DropdownMenuItem>
 * ```
 */
export interface DropdownMenuContentProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>,
    VariantProps<typeof dropdownMenuContentVariants> {
  /**
   * Se true, adiciona campo de busca no topo
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
   * Função de filtro customizada
   */
  filterFunction?: (item: string, search: string) => boolean
  
  /**
   * Se true, adiciona padding extra
   */
  padded?: boolean
  
  /**
   * Máxima altura antes do scroll
   */
  maxHeight?: string
}

export interface DropdownMenuItemProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>,
    VariantProps<typeof dropdownMenuItemVariants> {
  /**
   * Ícone a ser exibido antes do texto
   */
  icon?: React.ReactNode
  
  /**
   * Avatar/imagem a ser exibida
   */
  avatar?: React.ReactNode
  
  /**
   * Atalho de teclado
   */
  shortcut?: string
  
  /**
   * Badge/indicador
   */
  badge?: React.ReactNode
  
  /**
   * Descrição adicional
   */
  description?: string
  
  /**
   * Se true, o item está em loading
   */
  loading?: boolean
  
  /**
   * Se true, destaca o item
   */
  featured?: boolean
  
  /**
   * Termo de busca para filtros
   */
  searchTerm?: string
  
  /**
   * Classes CSS customizadas para o ícone
   */
  iconClassName?: string
  
  /**
   * Classes CSS customizadas para o atalho
   */
  shortcutClassName?: string
  
  /**
   * Classes CSS customizadas para a descrição
   */
  descriptionClassName?: string
}

export interface DropdownMenuLabelProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> {
  /**
   * Ícone a ser exibido antes do texto
   */
  icon?: React.ReactNode
  
  /**
   * Se true, adiciona padding para alinhar com itens inset
   */
  inset?: boolean
  
  /**
   * Variante visual do label
   */
  variant?: "default" | "muted" | "accent"
}

export interface UserMenuProps {
  /**
   * Se true, o menu está aberto
   */
  open?: boolean
  
  /**
   * Callback para controlar abertura/fechamento
   */
  onOpenChange?: (open: boolean) => void
  
  /**
   * Dados do usuário
   */
  user?: {
    name: string
    email: string
    avatar?: string
    role?: string
  }
  
  /**
   * Se true, exibe informações do usuário no header
   */
  showUserInfo?: boolean
  
  /**
   * Itens de menu customizados
   */
  menuItems?: Array<{
    label: string
    icon?: React.ReactNode
    shortcut?: string
    onClick?: () => void
    variant?: "default" | "destructive"
    separator?: boolean
  }>
  
  /**
   * Callback para logout
   */
  onLogout?: () => void
  
  /**
   * Se true, o logout está em loading
   */
  logoutLoading?: boolean
}

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
    icon?: React.ReactNode
  }
>(({ className, inset, icon, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      dropdownMenuItemVariants({ inset }),
      "focus:bg-accent data-[state=open]:bg-accent",
      className
    )}
    {...props}
  >
    {icon && (
      <span className="mr-2 flex h-4 w-4 items-center justify-center">
        {icon}
      </span>
    )}
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger"

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      dropdownMenuContentVariants(),
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName = "DropdownMenuSubContent"

/**
 * Conteúdo do DropdownMenu com funcionalidades avançadas
 */
const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  DropdownMenuContentProps
>(({ 
  className,
  sideOffset = 4,
  size,
  variant,
  searchable = false,
  searchPlaceholder = "Buscar...",
  showItemCount = false,
  emptyText = "Nenhum resultado encontrado",
  filterFunction,
  padded = false,
  maxHeight,
  children,
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
        
        // Se é um DropdownMenuItem
        if (child.type === DropdownMenuItem) {
          const searchText = child.props.searchTerm || 
                           (typeof child.props.children === 'string' ? child.props.children : '')
          
          const matches = filterFunction 
            ? filterFunction(searchText, searchTerm)
            : searchText.toLowerCase().includes(searchTerm.toLowerCase())
          
          return matches ? child : null
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
        if (React.isValidElement(child) && child.type === DropdownMenuItem) {
          count++
        } else if (React.isValidElement(child) && child.props?.children) {
          count += countItems(child.props.children)
        }
      })
      return count
    }
    
    setItemCount(countItems(filtered))
  }, [searchTerm, children, searchable, filterFunction])

  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          dropdownMenuContentVariants({ size, variant }),
          padded && "p-2",
          className
        )}
        style={{ maxHeight }}
        {...props}
      >
        {/* Campo de busca */}
        {searchable && (
          <div className="border-b p-2 -m-1 mb-1">
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
        
        {/* Contador de itens */}
        {showItemCount && searchable && (
          <div className="px-2 py-1 text-xs text-muted-foreground border-b -mx-1 mb-1">
            {itemCount} {itemCount === 1 ? 'item' : 'itens'}
          </div>
        )}
        
        {/* Conteúdo com scroll */}
        <div className={cn(
          maxHeight && "overflow-y-auto"
        )}>
          {React.Children.count(filteredChildren) > 0 ? (
            filteredChildren
          ) : searchable && searchTerm ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              {emptyText}
            </div>
          ) : (
            children
          )}
        </div>
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  )
})
DropdownMenuContent.displayName = "DropdownMenuContent"

/**
 * Item do DropdownMenu com ícones e funcionalidades avançadas
 */
const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  DropdownMenuItemProps
>(({ 
  className,
  variant,
  size,
  inset,
  icon,
  avatar,
  shortcut,
  badge,
  description,
  loading = false,
  featured = false,
  iconClassName,
  shortcutClassName,
  descriptionClassName,
  children,
  disabled,
  ...props 
}, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      dropdownMenuItemVariants({ variant, size, inset }),
      featured && "bg-accent/20 font-medium",
      loading && "opacity-50",
      className
    )}
    disabled={disabled || loading}
    {...props}
  >
    {/* Avatar ou ícone */}
    {(avatar || icon || loading) && (
      <span className={cn(
        "mr-2 flex h-4 w-4 items-center justify-center",
        iconClassName
      )}>
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          avatar || icon
        )}
      </span>
    )}

    <div className="flex-1 min-w-0">
      <div className="truncate">
        {children}
      </div>
      
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
      <span className="ml-2 flex items-center">
        {badge}
      </span>
    )}
    
    {/* Atalho */}
    {shortcut && !loading && (
      <DropdownMenuShortcut className={shortcutClassName}>
        {shortcut}
      </DropdownMenuShortcut>
    )}
  </DropdownMenuPrimitive.Item>
))
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem> & {
    icon?: React.ReactNode
    description?: string
  }
>(({ className, children, checked, icon, description, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      dropdownMenuItemVariants({ inset: true }),
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    
    {icon && (
      <span className="mr-2 flex h-4 w-4 items-center justify-center">
        {icon}
      </span>
    )}
    
    <div className="flex-1">
      <div>{children}</div>
      {description && (
        <div className="text-xs text-muted-foreground">
          {description}
        </div>
      )}
    </div>
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem"

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem> & {
    icon?: React.ReactNode
    description?: string
  }
>(({ className, children, icon, description, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      dropdownMenuItemVariants({ inset: true }),
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    
    {icon && (
      <span className="mr-2 flex h-4 w-4 items-center justify-center">
        {icon}
      </span>
    )}
    
    <div className="flex-1">
      <div>{children}</div>
      {description && (
        <div className="text-xs text-muted-foreground">
          {description}
        </div>
      )}
    </div>
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem"

/**
 * Label do DropdownMenu com ícones
 */
const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  DropdownMenuLabelProps
>(({ className, inset, icon, variant = "default", ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "flex items-center px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      variant === "muted" && "text-muted-foreground",
      variant === "accent" && "text-accent-foreground",
      className
    )}
    {...props}
  >
    {icon && (
      <span className="mr-2 flex h-4 w-4 items-center justify-center">
        {icon}
      </span>
    )}
    {props.children}
  </DropdownMenuPrimitive.Label>
))
DropdownMenuLabel.displayName = "DropdownMenuLabel"

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

const DropdownMenuShortcut = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
})
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

/**
 * Template de menu de usuário pré-configurado
 */
const UserMenu: React.FC<UserMenuProps> = ({
  open,
  onOpenChange,
  user,
  showUserInfo = true,
  menuItems = [],
  onLogout,
  logoutLoading = false,
}) => {
  const defaultMenuItems = [
    {
      label: "Profile",
      icon: <User className="h-4 w-4" />,
      shortcut: "⌘P",
      onClick: () => console.log('Profile clicked'),
    },
    {
      label: "Settings",
      icon: <Settings className="h-4 w-4" />,
      shortcut: "⌘S",
      onClick: () => console.log('Settings clicked'),
    },
    { separator: true },
    {
      label: "Logout",
      icon: <LogOut className="h-4 w-4" />,
      variant: "destructive" as const,
      onClick: onLogout,
    },
  ]
  
  const items = menuItems.length > 0 ? menuItems : defaultMenuItems
  
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-2 rounded-full p-1 hover:bg-accent">
          {user?.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.name}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <User className="h-4 w-4" />
            </div>
          )}
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" size="lg">
        {showUserInfo && user && (
          <>
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <div className="font-medium">{user.name}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
                {user.role && (
                  <div className="text-xs text-muted-foreground">{user.role}</div>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        
        {items.map((item, index) => {
          if (item.separator) {
            return <DropdownMenuSeparator key={index} />
          }
          
          return (
            <DropdownMenuItem
              key={index}
              icon={item.icon}
              shortcut={item.shortcut}
              variant={item.variant}
              onClick={item.onClick}
              loading={item.label === "Logout" && logoutLoading}
            >
              {item.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  UserMenu,
  dropdownMenuContentVariants,
  dropdownMenuItemVariants,
}
