import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combina classes CSS usando clsx e tailwind-merge.
 * Remove duplicatas, prioriza classes Tailwind e aceita formatos condicionais.
 * 
 * @param inputs - Classes CSS a serem combinadas
 * @returns String de classes CSS otimizada
 * 
 * @example
 * cn('px-4 py-2', 'bg-blue-500', { 'text-white': true })
 * // 'px-4 py-2 bg-blue-500 text-white'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(...inputs))
}
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
