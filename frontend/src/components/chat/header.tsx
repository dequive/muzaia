// Chat header component
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Brain,
  Settings,
  User,
  LogOut,
  Monitor,
  Moon,
  Sun,
  Bell,
  HelpCircle,
  Activity,
  Zap,
  Shield,
  BarChart3,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { useSystem } from '@/hooks/useSystem'
import { useChatStore } from '@/store'
import { getInitials, cn } from '@/lib/utils'

export function Header() {
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const { systemStatus, health, models } = useSystem()
  const { currentConversation } = useChatStore()
  const [showSystemInfo, setShowSystemInfo] = useState(false)

  const handleSignOut = async () => {
    await signOut()
  }

  const getStatusColor = () => {
    if (systemStatus.isHealthy) return 'bg-green-500'
    if (systemStatus.isDegraded) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getStatusText = () => {
    if (!systemStatus.isOnline) return 'Offline'
    if (systemStatus.isHealthy) return 'Operacional'
    if (systemStatus.isDegraded) return 'Degradado'
    return 'Indisponível'
  }

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side - Logo and conversation info */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-gradient">Mozaia</span>
          </div>
          
          {currentConversation && (
            <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
              <span>/</span>
              <span className="font-medium">{currentConversation.title}</span>
              <Badge variant="secondary" className="text-xs">
                {currentConversation.context}
              </Badge>
            </div>
          )}
        </div>

        {/* Right side - System status and user menu */}
        <div className="flex items-center space-x-4">
          {/* System Status */}
          <motion.div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => setShowSystemInfo(!showSystemInfo)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className={cn("w-2 h-2 rounded-full", getStatusColor())} />
            <span className="hidden sm:inline text-sm text-muted-foreground">
              {getStatusText()}
            </span>
            {models && (
              <Badge variant="outline" className="text-xs">
                {models.filter(m => m.available).length} modelos
              </Badge>
            )}
          </motion.div>

          {/* Quick Actions */}
          <div className="hidden md:flex items-center space-x-1">
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.avatar_url} alt={user?.name || user?.email} />
                  <AvatarFallback>
                    {getInitials(user?.name || user?.email || 'U')}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name || 'Usuário'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Monitor className="mr-2 h-4 w-4" />
                  <span>Tema</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Claro</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Escuro</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    <Monitor className="mr-2 h-4 w-4" />
                    <span>Sistema</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />
              
              <DropdownMenuItem>
                <Activity className="mr-2 h-4 w-4" />
                <span>Sistema</span>
                <div className="ml-auto flex items-center space-x-1">
                  <div className={cn("w-2 h-2 rounded-full", getStatusColor())} />
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* System Info Expandable Panel */}
      <motion.div
        initial={false}
        animate={{ height: showSystemInfo ? 'auto' : 0 }}
        className="overflow-hidden border-t border-border bg-muted/30"
      >
        {health && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span>Uptime: {Math.floor((health.uptime || 0) / 3600)}h</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span>Modelos: {health.models_available?.length || 0}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-purple-500" />
                <span>Versão: {health.version}</span>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-orange-500" />
                <span>Status: {health.status}</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </header>
  )
}
