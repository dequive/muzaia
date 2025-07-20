// =============================================================================
// MOZAIA FRONTEND - FILE UTILITIES
// Manipulação e validação de arquivos
// =============================================================================

import { formatBytes } from './number'

// =============================================================================
// TYPES
// =============================================================================

interface FileValidationOptions {
  maxSize?: number // em bytes
  allowedTypes?: string[]
  allowedExtensions?: string[]
  minSize?: number
}

interface FileValidationResult {
  isValid: boolean
  errors: string[]
}

interface ImageResizeOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
}

// =============================================================================
// FILE VALIDATION
// =============================================================================

/**
 * Valida arquivo com múltiplos critérios
 */
export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): FileValidationResult {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB por padrão
    allowedTypes = [],
    allowedExtensions = [],
    minSize = 0
  } = options

  const errors: string[] = []

  // Verificar se arquivo existe
  if (!file) {
    errors.push('Arquivo é obrigatório')
    return { isValid: false, errors }
  }

  // Verificar tamanho mínimo
  if (file.size < minSize) {
    errors.push(`Arquivo deve ter pelo menos ${formatBytes(minSize)}`)
  }

  // Verificar tamanho máximo
  if (file.size > maxSize) {
    errors.push(`Arquivo deve ter no máximo ${formatBytes(maxSize)}`)
  }

  // Verificar tipo MIME
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push(`Tipo de arquivo não permitido. Permitidos: ${allowedTypes.join(', ')}`)
  }

  // Verificar extensão
  if (allowedExtensions.length > 0) {
    const extension = getFileExtension(file.name)
    if (!allowedExtensions.includes(extension)) {
      errors.push(`Extensão não permitida. Permitidas: ${allowedExtensions.join(', ')}`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Obtém extensão do arquivo
 */
export function getFileExtension(filename: string): string {
  if (!filename || typeof filename !== 'string') return ''
  
  const lastDot = filename.lastIndexOf('.')
  return lastDot !== -1 ? filename.slice(lastDot + 1).toLowerCase() : ''
}

/**
 * Obtém nome do arquivo sem extensão
 */
export function getFileName(filename: string): string {
  if (!filename || typeof filename !== 'string') return ''
  
  const lastDot = filename.lastIndexOf('.')
  const lastSlash = Math.max(filename.lastIndexOf('/'), filename.lastIndexOf('\\'))
  
  const startIndex = lastSlash + 1
  const endIndex = lastDot !== -1 ? lastDot : filename.length
  
  return filename.slice(startIndex, endIndex)
}

/**
 * Verifica se arquivo é imagem
 */
export function isImageFile(file: File | string): boolean {
  const imageTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp'
  ]

  if (file instanceof File) {
    return imageTypes.includes(file.type)
  }

  if (typeof file === 'string') {
    const extension = getFileExtension(file)
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']
    return imageExtensions.includes(extension)
  }

  return false
}

/**
 * Verifica se arquivo é vídeo
 */
export function isVideoFile(file: File | string): boolean {
  const videoTypes = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo', // AVI
    'video/x-ms-wmv',
    'video/webm'
  ]

  if (file instanceof File) {
    return videoTypes.includes(file.type)
  }

  if (typeof file === 'string') {
    const extension = getFileExtension(file)
    const videoExtensions = ['mp4', 'mpeg', 'mpg', 'avi', 'mov', 'wmv', 'webm']
    return videoExtensions.includes(extension)
  }

  return false
}

/**
 * Verifica se arquivo é áudio
 */
export function isAudioFile(file: File | string): boolean {
  const audioTypes = [
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/mp3',
    'audio/mp4',
    'audio/webm'
  ]

  if (file instanceof File) {
    return audioTypes.includes(file.type)
  }

  if (typeof file === 'string') {
    const extension = getFileExtension(file)
    const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'webm']
    return audioExtensions.includes(extension)
  }

  return false
}

/**
 * Verifica se arquivo é documento
 */
export function isDocumentFile(file: File | string): boolean {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv'
  ]

  if (file instanceof File) {
    return documentTypes.includes(file.type)
  }

  if (typeof file === 'string') {
    const extension = getFileExtension(file)
    const docExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv']
    return docExtensions.includes(extension)
  }

  return false
}

// =============================================================================
// FILE CONVERSION
// =============================================================================

/**
 * Converte File para Base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Erro ao converter arquivo para Base64'))
      }
    }
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
    
    reader.readAsDataURL(file)
  })
}

/**
 * Converte Base64 para Blob
 */
export function base64ToBlob(base64: string, contentType: string = ''): Blob {
  const byteCharacters = atob(base64.split(',')[1] || base64)
  const byteNumbers = new Array(byteCharacters.length)
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: contentType })
}

/**
 * Redimensiona imagem (apenas no lado cliente)
 */
export function resizeImage(
  file: File,
  options: ImageResizeOptions = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'jpeg'
  } = options

  return new Promise((resolve, reject) => {
    if (!isImageFile(file)) {
      reject(new Error('Arquivo não é uma imagem'))
      return
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calcular novas dimensões
      let { width, height } = img

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      // Redimensionar
      canvas.width = width
      canvas.height = height

      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: `image/${format}`,
                lastModified: Date.now()
              })
              resolve(resizedFile)
            } else {
              reject(new Error('Erro ao redimensionar imagem'))
            }
          },
          `image/${format}`,
          quality
        )
      }
    }

    img.onerror = () => reject(new Error('Erro ao carregar imagem'))
    img.src = URL.createObjectURL(file)
  })
}

// =============================================================================
// FILE UTILITIES
// =============================================================================

/**
 * Gera nome único para arquivo
 */
export function generateUniqueFileName(originalName: string): string {
  const extension = getFileExtension(originalName)
  const nameWithoutExt = getFileName(originalName)
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  
  return `${nameWithoutExt}_${timestamp}_${random}.${extension}`
}

/**
 * Sanitiza nome de arquivo
 */
export function sanitizeFileName(filename: string): string {
  if (!filename || typeof filename !== 'string') return 'arquivo'
  
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9.\-_]/g, '_') // Substitui caracteres especiais
    .replace(/_{2,}/g, '_') // Remove underscores duplos
    .replace(/^_|_$/g, '') // Remove underscores das bordas
    .toLowerCase()
}

/**
 * Agrupa arquivos por tipo
 */
export function groupFilesByType(files: File[]): Record<string, File[]> {
  const groups: Record<string, File[]> = {
    images: [],
    videos: [],
    audios: [],
    documents: [],
    others: []
  }

  files.forEach(file => {
    if (isImageFile(file)) {
      groups.images.push(file)
    } else if (isVideoFile(file)) {
      groups.videos.push(file)
    } else if (isAudioFile(file)) {
      groups.audios.push(file)
    } else if (isDocumentFile(file)) {
      groups.documents.push(file)
    } else {
      groups.others.push(file)
    }
  })

  return groups
}

/**
 * Calcula tamanho total de arquivos
 */
export function getTotalFileSize(files: File[]): number {
  return files.reduce((total, file) => total + file.size, 0)
}

/**
 * Formata informações do arquivo
 */
export function getFileInfo(file: File): {
  name: string
  size: string
  type: string
  extension: string
  lastModified: string
} {
  return {
    name: file.name,
    size: formatBytes(file.size),
    type: file.type || 'Desconhecido',
    extension: getFileExtension(file.name),
    lastModified: new Date(file.lastModified).toLocaleDateString('pt-BR')
  }
}

// =============================================================================
// DOWNLOAD UTILITIES
// =============================================================================

/**
 * Força download de arquivo
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Força download de string como arquivo de texto
 */
export function downloadTextFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  downloadFile(blob, filename)
}

/**
 * Força download de JSON como arquivo
 */
export function downloadJsonFile(data: any, filename: string): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  downloadFile(blob, filename)
}
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}
