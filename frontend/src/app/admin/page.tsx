// This file has been removed to resolve route conflict with /(dashboard)/admin/page.tsx
// The admin functionality is now handled by the dashboard route group
export default function AdminRedirect() {
  if (typeof window !== 'undefined') {
    window.location.href = '/dashboard/admin'
  }
  return null
}