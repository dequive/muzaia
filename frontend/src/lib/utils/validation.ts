// =============================================================================
// MOZAIA FRONTEND - VALIDATION UTILITIES
// Validadores robustos com suporte ao contexto moçambicano
// =============================================================================

// =============================================================================
// TYPES
// =============================================================================

interface PasswordValidationOptions {
  minLength?: number
  requireUppercase?: boolean
  requireLowercase?: boolean
  requireNumbers?: boolean
  requireSpecialChars?: boolean
  forbiddenWords?: string[]
}

interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong' | 'very-strong'
  score: number
}

interface PhoneValidationOptions {
  allowInternational?: boolean
  allowMozambique?: boolean
  allowPortugal?: boolean
  allowBrazil?: boolean
}

// =============================================================================
// EMAIL VALIDATION
// =============================================================================

/**
 * Valida email com regex RFC 5322 otimizada
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  const trimmedEmail = email.trim().toLowerCase()
  
  return emailRegex.test(trimmedEmail) && trimmedEmail.length <= 254
}

/**
 * Valida domínio de email
 */
export function isValidEmailDomain(email: string): boolean {
  if (!isValidEmail(email)) return false
  
  const domain = email.split('@')[1]
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  
  return domainRegex.test(domain)
}

// =============================================================================
// PASSWORD VALIDATION
// =============================================================================

/**
 * Valida senha com múltiplos critérios e cálculo de força
 */
export function isValidPassword(
  password: string,
  options: PasswordValidationOptions = {}
): PasswordValidationResult {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
    forbiddenWords = ['password', 'senha', '123456', 'qwerty', 'mozaia']
  } = options

  const errors: string[] = []
  let score = 0

  // Verificações básicas
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['Senha é obrigatória'],
      strength: 'weak',
      score: 0
    }
  }

  // Comprimento
  if (password.length < minLength) {
    errors.push(`Deve ter pelo menos ${minLength} caracteres`)
  } else {
    score += password.length >= 12 ? 25 : 15
  }

  // Maiúsculas
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Deve conter pelo menos uma letra maiúscula')
  } else if (/[A-Z]/.test(password)) {
    score += 15
  }

  // Minúsculas
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Deve conter pelo menos uma letra minúscula')
  } else if (/[a-z]/.test(password)) {
    score += 15
  }

  // Números
  if (requireNumbers && !/\d/.test(password)) {
    errors.push('Deve conter pelo menos um número')
  } else if (/\d/.test(password)) {
    score += 15
  }

  // Caracteres especiais
  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Deve conter pelo menos um caractere especial')
  } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 20
  }

  // Palavras proibidas
  const lowerPassword = password.toLowerCase()
  const foundForbidden = forbiddenWords.find(word => lowerPassword.includes(word))
  if (foundForbidden) {
    errors.push('Não deve conter palavras comuns')
    score -= 20
  }

  // Padrões sequenciais
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Não deve conter caracteres repetidos consecutivos')
    score -= 10
  }

  // Bonificações
  if (password.length >= 16) score += 10
  if (/[áàâãéèêíìîóòôõúùûç]/i.test(password)) score += 5 // Acentos

  score = Math.max(0, Math.min(100, score))

  // Determinar força
  let strength: PasswordValidationResult['strength']
  if (score >= 80) strength = 'very-strong'
  else if (score >= 60) strength = 'strong'
  else if (score >= 40) strength = 'medium'
  else strength = 'weak'

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score
  }
}

// =============================================================================
// URL VALIDATION
// =============================================================================

/**
 * Valida URL com verificação de protocolo
 */
export function isValidUrl(url: string, allowedProtocols: string[] = ['http', 'https']): boolean {
  if (!url || typeof url !== 'string') return false

  try {
    const urlObj = new URL(url.trim())
    return allowedProtocols.includes(urlObj.protocol.slice(0, -1))
  } catch {
    return false
  }
}

/**
 * Valida URL do Mozaia (domínios específicos)
 */
export function isValidMozaiaUrl(url: string): boolean {
  if (!isValidUrl(url)) return false
  
  const allowedDomains = ['mozaia.mz', 'www.mozaia.mz', 'api.mozaia.mz', 'cdn.mozaia.mz']
  
  try {
    const urlObj = new URL(url)
    return allowedDomains.includes(urlObj.hostname)
  } catch {
    return false
  }
}

// =============================================================================
// PHONE VALIDATION
// =============================================================================

/**
 * Valida telefone com suporte a múltiplos países
 */
export function isValidPhone(phone: string, options: PhoneValidationOptions = {}): boolean {
  if (!phone || typeof phone !== 'string') return false

  const {
    allowInternational = true,
    allowMozambique = true,
    allowPortugal = false,
    allowBrazil = false
  } = options

  const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '')

  // Moçambique: +258 XX XXX XXXX
  if (allowMozambique) {
    const mozambiqueRegex = /^(?:\+258|258)?[2-8]\d{7}$/
    if (mozambiqueRegex.test(cleanPhone)) return true
  }

  // Portugal: +351 XXX XXX XXX
  if (allowPortugal) {
    const portugalRegex = /^(?:\+351|351)?[29]\d{8}$/
    if (portugalRegex.test(cleanPhone)) return true
  }

  // Brasil: +55 XX XXXXX XXXX
  if (allowBrazil) {
    const brazilRegex = /^(?:\+55|55)?[1-9]\d{10}$/
    if (brazilRegex.test(cleanPhone)) return true
  }

  // Internacional genérico
  if (allowInternational) {
    const internationalRegex = /^\+?[1-9]\d{6,14}$/
    return internationalRegex.test(cleanPhone)
  }

  return false
}

/**
 * Valida especificamente telefone moçambicano
 */
export function isValidMozambiquePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false

  const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '')
  
  // Formatos aceitos:
  // +258 XX XXX XXXX
  // 258 XX XXX XXXX  
  // 8X XXX XXXX (móvel)
  // 2X XXX XXXX (fixo)
  
  const patterns = [
    /^\+258[2-8]\d{7}$/, // +258XXXXXXXX
    /^258[2-8]\d{7}$/,   // 258XXXXXXXX
    /^[2-8]\d{7}$/       // XXXXXXXX
  ]

  return patterns.some(pattern => pattern.test(cleanPhone))
}

// =============================================================================
// DOCUMENT VALIDATION (MOZAMBIQUE)
// =============================================================================

/**
 * Valida Bilhete de Identidade moçambicano
 */
export function isValidMozambiqueBI(bi: string): boolean {
  if (!bi || typeof bi !== 'string') return false

  const cleanBI = bi.replace(/\D/g, '')
  
  // BI moçambicano tem 13 dígitos
  if (cleanBI.length !== 13) return false
  
  // Verificar se todos são números
  if (!/^\d{13}$/.test(cleanBI)) return false
  
  // Verificar se não são todos iguais
  if (/^(\d)\1{12}$/.test(cleanBI)) return false

  return true
}

/**
 * Valida NUIT (Número Único de Identificação Tributária) moçambicano
 */
export function isValidMozambiqueNUIT(nuit: string): boolean {
  if (!nuit || typeof nuit !== 'string') return false

  const cleanNUIT = nuit.replace(/\D/g, '')
  
  // NUIT tem 9 dígitos
  if (cleanNUIT.length !== 9) return false
  
  // Verificar se todos são números
  if (!/^\d{9}$/.test(cleanNUIT)) return false
  
  // Verificar se não são todos iguais
  if (/^(\d)\1{8}$/.test(cleanNUIT)) return false

  return true
}

// =============================================================================
// CPF VALIDATION (BRASIL)
// =============================================================================

/**
 * Valida CPF brasileiro (mantido para compatibilidade)
 */
export function isValidCPF(cpf: string): boolean {
  if (!cpf || typeof cpf !== 'string') return false

  const cleanCpf = cpf.replace(/\D/g, '')
  
  if (cleanCpf.length !== 11 || /^(\d)\1{10}$/.test(cleanCpf)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (10 - i)
  }
  
  let checkDigit = 11 - (sum % 11)
  if (checkDigit === 10 || checkDigit === 11) checkDigit = 0
  if (checkDigit !== parseInt(cleanCpf.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (11 - i)
  }
  
  checkDigit = 11 - (sum % 11)
  if (checkDigit === 10 || checkDigit === 11) checkDigit = 0
  if (checkDigit !== parseInt(cleanCpf.charAt(10))) return false

  return true
}

// =============================================================================
// GENERIC VALIDATION
// =============================================================================

/**
 * Valida se string não está vazia
 */
export function isNotEmpty(value: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Valida se string tem comprimento mínimo
 */
export function hasMinLength(value: string, minLength: number): boolean {
  return typeof value === 'string' && value.length >= minLength
}

/**
 * Valida se string tem comprimento máximo
 */
export function hasMaxLength(value: string, maxLength: number): boolean {
  return typeof value === 'string' && value.length <= maxLength
}

/**
 * Valida se valor está em lista de opções
 */
export function isInList<T>(value: T, options: T[]): boolean {
  return options.includes(value)
}
