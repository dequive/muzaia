// Loading screen component
import { Loader2 } from 'lucide-react'

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-muted"></div>
          <div className="absolute top-0 h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">Mozaia</h2>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    </div>
  )
}
