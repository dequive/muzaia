import { Metadata } from 'next'
import { AdminOverview } from '@/components/admin/admin-overview'

export const metadata: Metadata = {
  title: 'Administração - Mozaia',
  description: 'Painel administrativo do sistema',
}

export default function AdminPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <AdminOverview />
    </div>
  )
}