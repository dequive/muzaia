
// This file has been removed to resolve route conflict with /(dashboard)/chat/page.tsx
// The chat functionality is now handled by the dashboard route group
export default function ChatRedirect() {
  if (typeof window !== 'undefined') {
    window.location.href = '/dashboard/chat'
  }
  return null
}
