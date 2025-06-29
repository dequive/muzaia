import { type ClassValue } from "clsx"

/**
 * Utilitários para gerenciamento de temas
 */

export type Theme = 'light' | 'dark' | 'system'

export const themes: { value: Theme; label: string; icon: string }[] = [
  { value: 'light', label: 'Claro', icon: '☀️' },
  { value: 'dark', label: 'Escuro', icon: '🌙' },
  { value: 'system', label: 'Sistema', icon: '💻' },
]

/**
 * Classes condicionais baseadas no tema
 */
export function themeClasses(
  lightClasses: ClassValue,
  darkClasses: ClassValue,
  theme?: 'light' | 'dark'
): string {
  if (theme === 'light') return String(lightClasses)
  if (theme === 'dark') return String(darkClasses)
  
  // Retorna ambas as classes com prefixos
  return `${lightClasses} dark:${darkClasses}`
}

/**
 * Detecta preferência de tema do sistema
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches 
    ? 'dark' 
    : 'light'
}

/**
 * Aplica tema ao documento
 */
export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  
  const root = document.documentElement
  
  if (theme === 'system') {
    const systemTheme = getSystemTheme()
    root.classList.toggle('dark', systemTheme === 'dark')
  } else {
    root.classList.toggle('dark', theme === 'dark')
  }
}

/**
 * Observa mudanças na preferência do sistema
 */
export function watchSystemTheme(callback: (theme: 'light' | 'dark') => void) {
  if (typeof window === 'undefined') return () => {}
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  
  const handleChange = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light')
  }
  
  mediaQuery.addEventListener('change', handleChange)
  
  // Retorna função de cleanup
  return () => mediaQuery.removeEventListener('change', handleChange)
}

/**
 * Gera variáveis CSS customizadas para temas
 */
export function generateThemeVariables(colors: Record<string, string>) {
  return Object.entries(colors)
    .map(([key, value]) => `--${key}: ${value}`)
    .join('; ')
}

/**
 * Paleta de cores para temas
 */
export const themeColors = {
  light: {
    primary: '222.2 84% 4.9%',
    secondary: '210 40% 96%',
    accent: '210 40% 94%',
    muted: '210 40% 96%',
    background: '0 0% 100%',
    foreground: '222.2 84% 4.9%',
    card: '0 0% 100%',
    border: '214.3 31.8% 91.4%',
    input: '214.3 31.8% 91.4%',
    ring: '222.2 84% 4.9%',
  },
  dark: {
    primary: '210 40% 98%',
    secondary: '222.2 84% 4.9%',
    accent: '217.2 32.6% 17.5%',
    muted: '217.2 32.6% 17.5%',
    background: '222.2 84% 4.9%',
    foreground: '210 40% 98%',
    card: '222.2 84% 4.9%',
    border: '217.2 32.6% 17.5%',
    input: '217.2 32.6% 17.5%',
    ring: '212.7 26.8% 83.9%',
  },
}

/**
 * Componente de visualização de tema
 */
export function ThemePreview({ theme, colors }: { 
  theme: 'light' | 'dark'
  colors?: Record<string, string> 
}) {
  const themeVars = colors ? generateThemeVariables(colors) : ''
  
  return (
    <div 
      className={`p-4 rounded-lg border ${theme === 'dark' ? 'dark' : ''}`}
      style={{ [theme === 'dark' ? 'colorScheme' : '']: theme } as any}
    >
      <div className="space-y-2">
        <div className="h-4 bg-primary rounded" />
        <div className="h-3 bg-secondary rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    </div>
  )
}
