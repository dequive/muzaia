"use client"

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  HelpCircle,
  X,
  Loader2
} from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const alertDialogContentVariants = cva(
  "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
  {
    variants: {
      variant: {
        default: "border-border",
        destructive: "border-destructive/50 bg-background",
        warning: "border-yellow-500/50 bg-background",
        success: "border-green-500/50 bg-background",
        info: "border-blue-500/50 bg-background",
      },
      size: {
        sm: "max-w-sm p-4",
        default: "max-w-lg p-6",
        lg: "max-w-2xl p-8",
        xl: "max-w-4xl p-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const alertDialogOverlayVariants = cva(
  "fixed inset-0 z-50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
  {
    variants: {
      variant: {
        default: "bg-background/80",
        destructive: "bg-destructive/10",
        warning: "bg-yellow-500/10",
        success: "bg-green-500/10",
        info: "bg-blue-500/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * Componente AlertDialog para confirmações críticas e avisos importantes
 * 
 * @example
 * ```tsx
 * // Alert Dialog básico
 * <AlertDialog>
 *   <AlertDialogTrigger asChild>
 *     <Button variant="destructive">Delete</Button>
 *   </AlertDialogTrigger>
 *   <AlertDialogContent>
 *     <AlertDialogHeader>
 *       <AlertDialogTitle>Are you sure?</AlertDialogTitle>
 *       <AlertDialogDescription>
 *         This action cannot be undone.
 *       </AlertDialogDescription>
 *     </AlertDialogHeader>
 *     <AlertDialogFooter>
 *       <AlertDialogCancel>Cancel</AlertDialogCancel>
 *       <AlertDialogAction>Delete</AlertDialogAction>
 *     </AlertDialogFooter>
 *   </AlertDialogContent>
 * </AlertDialog>
 * 
 * // Template de confirmação
 * <ConfirmDialog
 *   title="Delete Item"
 *   description="This will permanently delete the item."
 *   variant="destructive"
 *   onConfirm={() => handleDelete()}
 * />
 * ```
 */
export interface AlertDialogContentProps
  extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>,
    VariantProps<typeof alertDialogContentVariants> {
  /**
   * Se true, exibe botão de fechar no canto superior direito
   */
  showCloseButton?: boolean
  
  /**
   * Se true, permite fechar clicando no overlay
   */
  closeOnOverlayClick?: boolean
  
  /**
   * Se true, permite fechar com a tecla Escape
   */
  closeOnEscape?: boolean
  
  /**
   * Tempo em milissegundos para auto-fechamento (0 = desabilitado)
   */
  autoClose?: number
  
  /**
   * Callback chamado quando o dialog é fechado
   */
  onClose?: () => void
  
  /**
   * Se true, adiciona padding extra para conteúdo longo
   */
  scrollable?: boolean
  
  /**
   * Classes CSS customizadas para o overlay
   */
  overlayClassName?: string
}

export interface AlertDialogHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Ícone a ser exibido no header
   */
  icon?: React.ReactNode
  
  /**
   * Variante que determina o ícone padrão
   */
  variant?: "default" | "destructive" | "warning" | "success" | "info"
  
  /**
   * Se true, centraliza o conteúdo do header
   */
  centered?: boolean
  
  /**
   * Classes CSS customizadas para o ícone
   */
  iconClassName?: string
}

export interface ConfirmDialogProps {
  /**
   * Se true, o dialog está aberto
   */
  open?: boolean
  
  /**
   * Callback para controlar abertura/fechamento
   */
  onOpenChange?: (open: boolean) => void
  
  /**
   * Título do dialog
   */
  title: string
  
  /**
   * Descrição/mensagem do dialog
   */
  description?: string
  
  /**
   * Variante visual do dialog
   */
  variant?: "default" | "destructive" | "warning" | "success" | "info"
  
  /**
   * Texto do botão de confirmação
   */
  confirmText?: string
  
  /**
   * Texto do botão de cancelamento
   */
  cancelText?: string
  
  /**
   * Callback chamado quando confirmado
   */
  onConfirm?: () => void | Promise<void>
  
  /**
   * Callback chamado quando cancelado
   */
  onCancel?: () => void
  
  /**
   * Se true, o botão de confirmação está em loading
   */
  loading?: boolean
  
  /**
   * Se true, o botão de confirmação está desabilitado
   */
  disabled?: boolean
  
  /**
   * Conteúdo customizado para o corpo do dialog
   */
  children?: React.ReactNode
  
  /**
   * Ícone customizado (substitui o ícone da variante)
   */
  icon?: React.ReactNode
  
  /**
   * Se true, mostra apenas o botão de confirmação
   */
  confirmOnly?: boolean
  
  /**
   * Se true, auto-foca no botão de cancelamento
   */
  focusCancel?: boolean
}

const AlertDialog = AlertDialogPrimitive.Root

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = AlertDialogPrimitive.Portal

/**
 * Overlay do AlertDialog com variantes visuais
 */
const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay> &
    VariantProps<typeof alertDialogOverlayVariants>
>(({ className, variant, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(alertDialogOverlayVariants({ variant }), className)}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = "AlertDialogOverlay"

/**
 * Conteúdo do AlertDialog com funcionalidades avançadas
 */
const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  AlertDialogContentProps
>(({ 
  className,
  variant,
  size,
  showCloseButton = false,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  autoClose = 0,
  onClose,
  scrollable = false,
  overlayClassName,
  children,
  ...props 
}, ref) => {
  const [timeLeft, setTimeLeft] = React.useState(autoClose)
  
  // Auto-close timer
  React.useEffect(() => {
    if (autoClose > 0) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1000) {
            onClose?.()
            return 0
          }
          return prev - 1000
        })
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [autoClose, onClose])
  
  const handleOverlayClick = closeOnOverlayClick ? undefined : (e: React.MouseEvent) => {
    e.preventDefault()
  }
  
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay 
        variant={variant}
        className={overlayClassName}
        onClick={handleOverlayClick}
      />
      <AlertDialogPrimitive.Content
        ref={ref}
        className={cn(
          alertDialogContentVariants({ variant, size }),
          scrollable && "max-h-[80vh] overflow-y-auto",
          className
        )}
        onEscapeKeyDown={closeOnEscape ? undefined : (e) => e.preventDefault()}
        {...props}
      >
        {/* Botão de fechar */}
        {showCloseButton && (
          <AlertDialogPrimitive.Cancel asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </AlertDialogPrimitive.Cancel>
        )}
        
        {children}
        
        {/* Timer de auto-close */}
        {autoClose > 0 && timeLeft > 0 && (
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
            Fechando em {Math.ceil(timeLeft / 1000)}s
          </div>
        )}
      </AlertDialogPrimitive.Content>
    </AlertDialogPortal>
  )
})
AlertDialogContent.displayName = "AlertDialogContent"

/**
 * Header do AlertDialog com ícones de status
 */
const AlertDialogHeader = React.forwardRef<
  HTMLDivElement,
  AlertDialogHeaderProps
>(({ 
  className,
  icon,
  variant,
  centered = false,
  iconClassName,
  children,
  ...props 
}, ref) => {
  // Ícones padrão baseados na variante
  const getDefaultIcon = () => {
    if (icon) return icon
    
    switch (variant) {
      case "destructive":
        return <XCircle className="h-6 w-6 text-destructive" />
      case "warning":
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />
      case "success":
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case "info":
        return <Info className="h-6 w-6 text-blue-500" />
      default:
        return <HelpCircle className="h-6 w-6 text-muted-foreground" />
    }
  }
  
  const defaultIcon = getDefaultIcon()
  
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col space-y-2",
        centered ? "text-center items-center" : "text-center sm:text-left",
        className
      )}
      {...props}
    >
      {(icon !== null && variant) && (
        <div className={cn(
          "flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-2",
          centered ? "mx-auto" : "sm:mx-0",
          iconClassName
        )}>
          {defaultIcon}
        </div>
      )}
      {children}
    </div>
  )
})
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
))
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
))
AlertDialogTitle.displayName = "AlertDialogTitle"

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
AlertDialogDescription.displayName = "AlertDialogDescription"

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
  />
))
AlertDialogAction.displayName = "AlertDialogAction"

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    )}
    {...props}
  />
))
AlertDialogCancel.displayName = "AlertDialogCancel"

/**
 * Template de dialog de confirmação pré-configurado
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  variant = "default",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
  disabled = false,
  children,
  icon,
  confirmOnly = false,
  focusCancel = false,
}) => {
  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm()
    }
    onOpenChange?.(false)
  }
  
  const handleCancel = () => {
    onCancel?.()
    onOpenChange?.(false)
  }
  
  // Variante do botão de confirmação baseada na variante do dialog
  const getConfirmVariant = () => {
    switch (variant) {
      case "destructive":
        return "destructive"
      case "warning":
        return "default"
      case "success":
        return "default"
      case "info":
        return "default"
      default:
        return "default"
    }
  }
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent variant={variant}>
        <AlertDialogHeader variant={variant} icon={icon}>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        
        {children}
        
        <AlertDialogFooter>
          {!confirmOnly && (
            <AlertDialogCancel 
              onClick={handleCancel}
              autoFocus={focusCancel}
            >
              {cancelText}
            </AlertDialogCancel>
          )}
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={disabled || loading}
            className={cn(
              buttonVariants({ variant: getConfirmVariant() }),
              loading && "opacity-50"
            )}
            autoFocus={!focusCancel}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  ConfirmDialog,
  alertDialogContentVariants,
  alertDialogOverlayVariants,
}
