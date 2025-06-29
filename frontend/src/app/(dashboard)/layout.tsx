// Dashboard layout with sidebar
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Sidebar } from '@/components/chat/sidebar'
import { Header } from '@/components/chat/header'
import { LoadingScreen } from '@/components/loading-screen'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient({ cookies })
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      redirect('/login')
    }
  } catch (error) {
    console.error('Error checking session:', error)
    redirect('/login')
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden">
          <Suspense fallback={<LoadingScreen />}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  )
}
