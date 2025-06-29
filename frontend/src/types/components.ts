/* =============================================================================
   COMPONENT-SPECIFIC TYPES
   ============================================================================= */

import type { BaseComponentProps } from './index'

// Avatar component
export interface AvatarProps extends BaseComponentProps {
  src?: string
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  shape?: 'circle' | 'square' | 'rounded'
  status?: 'online' | 'offline' | 'away' | 'busy'
  fallback?: string
  loading?: boolean
}

// Badge component
export interface BadgeProps extends BaseComponentProps {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  dot?: boolean
  pulse?: boolean
}

// Card component
export interface CardProps extends BaseComponentProps {
  variant?: 'default' | 'outlined' | 'elevated' | 'filled'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  clickable?: boolean
  loading?: boolean
}

// Modal component
export interface ModalProps extends BaseComponentProps {
  open: boolean
  onClose: () => void
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closable?: boolean
  backdrop?: boolean
  keyboard?: boolean
  centered?: boolean
  scrollable?: boolean
}

// Tooltip component
export interface TooltipProps extends BaseComponentProps {
  content: React.ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
  trigger?: 'hover' | 'click' | 'focus'
  delay?: number
  arrow?: boolean
}

// Dropdown component
export interface DropdownProps extends BaseComponentProps {
  trigger: React.ReactNode
  items: Array<{
    key: string
    label: React.ReactNode
    icon?: React.ReactNode
    disabled?: boolean
    danger?: boolean
    onClick?: () => void
  }>
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
  disabled?: boolean
}
