'use client'

import { ChatInterface } from '@/components/chat/chat-interface'
import { ChatHeader } from '@/components/chat/header'
import { ChatSettings } from '@/components/chat/chat-settings'
import { useState } from 'react'
import { useUIStore } from '@/store'
import Sidebar from '@/components/chat/sidebar'

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { ui } = useUIStore()

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar className="w-80 border-r" />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatHeader onToggleSidebar={toggleSidebar} />
        <ChatInterface />
      </div>

      {/* Settings Panel */}
      {ui.chat_settings_open && <ChatSettings />}
    </div>
  )
}