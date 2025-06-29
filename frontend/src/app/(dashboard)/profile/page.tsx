// User profile page
import { Metadata } from 'next'
import { ProfileForm } from '@/components/profile/profile-form'
import { ProfileStats } from '@/components/profile/profile-stats'
import { UsageHistory } from '@/components/profile/usage-history'

export const metadata: Metadata = {
  title: 'Perfil - Mozaia',
  description: 'Gerencie seu perfil e configurações da conta',
}

export default function ProfilePage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Perfil do Usuário</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e preferências
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProfileForm />
        </div>
        <div className="space-y-6">
          <ProfileStats />
          <UsageHistory />
        </div>
      </div>
    </div>
  )
}
