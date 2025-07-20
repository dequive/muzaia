import { Metadata } from 'next'
// Importando todos os componentes através do arquivo index.ts
import { AdminOverview, UserManagement, SystemControls, AuditLogs } from '@/components/admin'

export const metadata: Metadata = {
  title: 'Administração - Mozaia',
  description: 'Painel administrativo do sistema',
}

export default function AdminPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Administração</h1>
          <p className="text-muted-foreground">
            Controle total do sistema Mozaia
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Usuário: dequive • {new Date().toLocaleString('pt-MZ')}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <AdminOverview />
          <UserManagement />
        </div>
        <div className="space-y-6">
          <SystemControls />
          <AuditLogs />
        </div>
      </div>
    </div>
  )
}v>
  )
}
