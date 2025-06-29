"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cva, type VariantProps } from "class-variance-authority"
import { User, Crown, Shield, Star, Zap, Check } from "lucide-react"

import { cn } from "@/lib/utils"

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden",
  {
    variants: {
      size: {
        xs: "h-6 w-6",
        sm: "h-8 w-8",
        default: "h-10 w-10",
        lg: "h-12 w-12",
        xl: "h-16 w-16",
        "2xl": "h-20 w-20",
        "3xl": "h-24 w-24",
      },
      shape: {
        circle: "rounded-full",
        rounded: "rounded-lg",
        square: "rounded-none",
      },
      variant: {
        default: "",
        outline: "ring-2 ring-border ring-offset-2 ring-offset-background",
        ghost: "bg-transparent",
      },
    },
    defaultVariants: {
      size: "default",
      shape: "circle",
      variant: "default",
    },
  }
)

const avatarImageVariants = cva(
  "aspect-square h-full w-full object-cover",
  {
    variants: {
      shape: {
        circle: "",
        rounded: "rounded-lg",
        square: "",
      },
    },
    defaultVariants: {
      shape: "circle",
    },
  }
)

const avatarFallbackVariants = cva(
  "flex h-full w-full items-center justify-center text-white font-medium select-none",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground",
        primary: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        success: "bg-green-500 text-white",
        warning: "bg-yellow-500 text-white",
        destructive: "bg-destructive text-destructive-foreground",
        gradient: "bg-gradient-to-br from-primary via-primary/80 to-primary/60 text-primary-foreground",
      },
      size: {
        xs: "text-xs",
        sm: "text-xs",
        default: "text-sm",
        lg: "text-base",
        xl: "text-lg",
        "2xl": "text-xl",
        "3xl": "text-2xl",
      },
      shape: {
        circle: "rounded-full",
        rounded: "rounded-lg",
        square: "rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "circle",
    },
  }
)

const statusIndicatorVariants = cva(
  "absolute rounded-full border-2 border-background",
  {
    variants: {
      status: {
        online: "bg-green-500",
        offline: "bg-gray-400",
        away: "bg-yellow-500",
        busy: "bg-red-500",
      },
      size: {
        xs: "h-2 w-2 -bottom-0 -right-0",
        sm: "h-2.5 w-2.5 -bottom-0 -right-0",
        default: "h-3 w-3 -bottom-0.5 -right-0.5",
        lg: "h-3.5 w-3.5 -bottom-0.5 -right-0.5",
        xl: "h-4 w-4 -bottom-1 -right-1",
        "2xl": "h-5 w-5 -bottom-1 -right-1",
        "3xl": "h-6 w-6 -bottom-1.5 -right-1.5",
      },
    },
    defaultVariants: {
      status: "online",
      size: "default",
    },
  }
)

/**
 * Componente Avatar para exibição de imagens de perfil e identidades visuais
 * 
 * @example
 * ```tsx
 * // Avatar básico
 * <Avatar>
 *   <AvatarImage src="/user.jpg" alt="User" />
 *   <AvatarFallback>JD</AvatarFallback>
 * </Avatar>
 * 
 * // Avatar com status
 * <Avatar status="online" statusPosition="bottom-right">
 *   <AvatarImage src="/user.jpg" alt="User" />
 *   <AvatarFallback>JD</AvatarFallback>
 * </Avatar>
 * 
 * // Avatar com badge
 * <Avatar badge={<Crown className="h-3 w-3" />}>
 *   <AvatarImage src="/admin.jpg" alt="Admin" />
 *   <AvatarFallback variant="primary">AD</AvatarFallback>
 * </Avatar>
 * ```
 */
export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
  /**
   * Status do usuário (online, offline, away, busy)
   */
  status?: "online" | "offline" | "away" | "busy"
  
  /**
   * Posição do indicador de status
   */
  statusPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  
  /**
   * Badge/ícone a ser exibido no canto do avatar
   */
  badge?: React.ReactNode
  
  /**
   * Posição do badge
   */
  badgePosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  
  /**
   * Se true, exibe borda animada
   */
  animated?: boolean
  
  /**
   * Se true, o avatar é clicável
   */
  clickable?: boolean
  
  /**
   * Callback para clique no avatar
   */
  onClick?: () => void
  
  /**
   * Se true, exibe loading placeholder
   */
  loading?: boolean
  
  /**
   * Tooltip exibido ao passar o mouse
   */
  tooltip?: string
  
  /**
   * Classes CSS customizadas para o status
   */
  statusClassName?: string
  
  /**
   * Classes CSS customizadas para o badge
   */
  badgeClassName?: string
}

export interface AvatarImageProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>,
    Pick<VariantProps<typeof avatarImageVariants>, 'shape'> {
  /**
   * Se true, adiciona efeito hover
   */
  hoverable?: boolean
  
  /**
   * Callback para erro de carregamento
   */
  onError?: () => void
  
  /**
   * Callback para sucesso de carregamento
   */
  onLoad?: () => void
}

export interface AvatarFallbackProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>,
    VariantProps<typeof avatarFallbackVariants> {
  /**
   * Se true, gera iniciais automaticamente do nome
   */
  autoInitials?: boolean
  
  /**
   * Nome para gerar iniciais automáticas
   */
  name?: string
  
  /**
   * Ícone customizado (substitui texto/iniciais)
   */
  icon?: React.ReactNode
  
  /**
   * Se true, usa ícone padrão de usuário
   */
  defaultIcon?: boolean
}

export interface AvatarGroupProps {
  /**
   * Lista de avatares
   */
  children: React.ReactNode
  
  /**
   * Máximo de avatares visíveis
   */
  max?: number
  
  /**
   * Sobreposição entre avatares (em pixels)
   */
  spacing?: number
  
  /**
   * Tamanho dos avatares no grupo
   */
  size?: VariantProps<typeof avatarVariants>['size']
  
  /**
   * Se true, inverte a ordem de exibição
   */
  reverse?: boolean
  
  /**
   * Classes CSS customizadas
   */
  className?: string
  
  /**
   * Callback para clique no contador de excesso
   */
  onExcessClick?: () => void
}

// Função utilitária para gerar iniciais
const generateInitials = (name: string): string => {
  if (!name) return ""
  
  const names = name.trim().split(/\s+/)
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase()
  }
  
  return names
    .slice(0, 2)
    .map(n => n.charAt(0).toUpperCase())
    .join("")
}

// Função utilitária para gerar cor baseada no nome
const generateColorFromName = (name: string): string => {
  if (!name) return "bg-muted"
  
  const colors = [
    "bg-red-500",
    "bg-blue-500", 
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-orange-500",
    "bg-teal-500",
    "bg-cyan-500",
  ]
  
  const hash = name.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0)
  }, 0)
  
  return colors[hash % colors.length]
}

/**
 * Avatar root component com funcionalidades avançadas
 */
const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ 
  className,
  size,
  shape,
  variant,
  status,
  statusPosition = "bottom-right",
  badge,
  badgePosition = "top-right",
  animated = false,
  clickable = false,
  onClick,
  loading = false,
  tooltip,
  statusClassName,
  badgeClassName,
  ...props 
}, ref) => {
  const [showTooltip, setShowTooltip] = React.useState(false)
  
  const handleClick = () => {
    if (clickable && onClick) {
      onClick()
    }
  }
  
  const getBadgePositionClasses = (position: string) => {
    switch (position) {
      case "top-left": return "-top-1 -left-1"
      case "top-right": return "-top-1 -right-1"
      case "bottom-left": return "-bottom-1 -left-1"
      case "bottom-right": return "-bottom-1 -right-1"
      default: return "-top-1 -right-1"
    }
  }
  
  const getStatusPositionClasses = (position: string) => {
    switch (position) {
      case "top-left": return "top-0 left-0"
      case "top-right": return "top-0 right-0"
      case "bottom-left": return "bottom-0 left-0"
      case "bottom-right": return "bottom-0 right-0"
      default: return "bottom-0 right-0"
    }
  }
  
  return (
    <div className="relative inline-block">
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(
          avatarVariants({ size, shape, variant }),
          animated && "animate-pulse",
          clickable && "cursor-pointer hover:opacity-80 transition-opacity",
          loading && "opacity-50",
          className
        )}
        onClick={handleClick}
        onMouseEnter={() => tooltip && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        {...props}
      >
        {props.children}
        
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-full">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </AvatarPrimitive.Root>
      
      {/* Status indicator */}
      {status && (
        <div className={cn(
          statusIndicatorVariants({ status, size }),
          getStatusPositionClasses(statusPosition),
          statusClassName
        )} />
      )}
      
      {/* Badge */}
      {badge && (
        <div className={cn(
          "absolute flex items-center justify-center rounded-full bg-background p-0.5 shadow-sm",
          getBadgePositionClasses(badgePosition),
          badgeClassName
        )}>
          {badge}
        </div>
      )}
      
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
Avatar.displayName = "Avatar"

/**
 * Avatar image component com funcionalidades aprimoradas
 */
const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  AvatarImageProps
>(({ 
  className, 
  shape,
  hoverable = false,
  onError,
  onLoad,
  ...props 
}, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn(
      avatarImageVariants({ shape }),
      hoverable && "transition-transform hover:scale-105",
      className
    )}
    onError={onError}
    onLoad={onLoad}
    {...props}
  />
))
AvatarImage.displayName = "AvatarImage"

/**
 * Avatar fallback component com geração automática de iniciais
 */
const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  AvatarFallbackProps
>(({ 
  className,
  variant,
  size,
  shape,
  autoInitials = false,
  name,
  icon,
  defaultIcon = false,
  children,
  ...props 
}, ref) => {
  // Gerar iniciais automaticamente se habilitado
  const initials = autoInitials && name ? generateInitials(name) : children
  
  // Gerar cor baseada no nome se não houver variante específica
  const nameBasedColor = name && variant === "default" ? generateColorFromName(name) : ""
  
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        avatarFallbackVariants({ variant, size, shape }),
        nameBasedColor,
        className
      )}
      {...props}
    >
      {icon || (defaultIcon ? <User className="h-1/2 w-1/2" /> : initials)}
    </AvatarPrimitive.Fallback>
  )
})
AvatarFallback.displayName = "AvatarFallback"

/**
 * Avatar group component para exibir múltiplos avatares
 */
const AvatarGroup: React.FC<AvatarGroupProps> = ({
  children,
  max = 3,
  spacing = -8,
  size = "default",
  reverse = false,
  className,
  onExcessClick,
}) => {
  const childrenArray = React.Children.toArray(children)
  const visibleChildren = childrenArray.slice(0, max)
  const excessCount = childrenArray.length - max
  
  const avatars = reverse ? visibleChildren.reverse() : visibleChildren
  
  return (
    <div className={cn("flex items-center", className)}>
      {avatars.map((child, index) => (
        <div
          key={index}
          className="relative"
          style={{
            marginLeft: index > 0 ? `${spacing}px` : 0,
            zIndex: reverse ? index : avatars.length - index,
          }}
        >
          {React.isValidElement(child) ? 
            React.cloneElement(child as React.ReactElement<any>, { size }) : 
            child
          }
        </div>
      ))}
      
      {excessCount > 0 && (
        <div
          className="relative cursor-pointer"
          style={{
            marginLeft: `${spacing}px`,
            zIndex: 0,
          }}
          onClick={onExcessClick}
        >
          <Avatar size={size} variant="outline">
            <AvatarFallback variant="secondary">
              +{excessCount}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
    </div>
  )
}

/**
 * Componente de avatar pré-configurado para usuários
 */
interface UserAvatarProps extends Omit<AvatarProps, 'children'> {
  user: {
    name: string
    email?: string
    avatar?: string
    status?: "online" | "offline" | "away" | "busy"
    role?: "admin" | "user" | "moderator" | "premium"
  }
  showStatus?: boolean
  showRole?: boolean
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  showStatus = false,
  showRole = false,
  ...props
}) => {
  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "admin": return <Crown className="h-3 w-3 text-yellow-500" />
      case "moderator": return <Shield className="h-3 w-3 text-blue-500" />
      case "premium": return <Star className="h-3 w-3 text-purple-500" />
      default: return null
    }
  }
  
  const roleBadge = showRole ? getRoleBadge(user.role) : null
  
  return (
    <Avatar
      status={showStatus ? user.status : undefined}
      badge={roleBadge}
      tooltip={user.name}
      {...props}
    >
      <AvatarImage src={user.avatar} alt={user.name} />
      <AvatarFallback 
        autoInitials 
        name={user.name}
        variant={user.role === "admin" ? "primary" : "default"}
      />
    </Avatar>
  )
}

export { 
  Avatar, 
  AvatarImage, 
  AvatarFallback, 
  AvatarGroup,
  UserAvatar,
  avatarVariants,
  avatarImageVariants,
  avatarFallbackVariants,
  generateInitials,
  generateColorFromName
}
