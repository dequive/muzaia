// =============================================================================
// MOZAIA FRONTEND - DATA UTILITIES
// Manipulação de dados e estruturas
// =============================================================================

// =============================================================================
// TYPES
// =============================================================================

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

type SortDirection = 'asc' | 'desc'

interface SortOptions<T> {
  key: keyof T | string
  direction: SortDirection
  caseSensitive?: boolean
}

interface FilterOptions<T> {
  query?: string
  fields?: (keyof T)[]
  caseSensitive?: boolean
  exactMatch?: boolean
}

interface PaginationOptions {
  page: number
  limit: number
}

interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// =============================================================================
// OBJECT UTILITIES
// =============================================================================

/**
 * Deep clone de objeto
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T
  
  const cloned = {} as T
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  
  return cloned
}

/**
 * Merge profundo de objetos
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  ...sources: DeepPartial<T>[]
): T {
  if (!sources.length) return target
  
  const result = deepClone(target)
  
  sources.forEach(source => {
    if (source && typeof source === 'object') {
      mergeRecursive(result, source)
    }
  })
  
  return result
}

function mergeRecursive<T>(target: T, source: any): void {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key as keyof T]) {
          ;(target as any)[key] = {}
        }
        mergeRecursive(target[key as keyof T], source[key])
      } else {
        ;(target as any)[key] = source[key]
      }
    }
  }
}

/**
 * Obtém valor aninhado usando path de string
 */
export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * Define valor aninhado usando path de string
 */
export function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.')
  const lastKey = keys.pop()!
  
  const target = keys.reduce((current, key) => {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {}
    }
    return current[key]
  }, obj)
  
  target[lastKey] = value
}

/**
 * Remove propriedades undefined/null
 */
export function cleanObject<T extends Record<string, any>>(
  obj: T,
  removeNull: boolean = true,
  removeUndefined: boolean
