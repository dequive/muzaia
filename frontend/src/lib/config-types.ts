/**
 * Tipos adicionais para configuração
 */

export interface DatabaseConfig {
  supabase: {
    url: string
    anonKey: string
    serviceKey?: string
  }
  postgres?: {
    host: string
    port: number
    database: string
    username: string
    password: string
  }
}

export interface AuthConfig {
  providers: {
    email: boolean
    google: boolean
    github: boolean
    microsoft: boolean
  }
  session: {
    maxAge: number
    updateAge: number
  }
  jwt: {
    secret: string
    expiresIn: string
  }
}

export interface NotificationConfig {
  push: {
    enabled: boolean
    vapidPublicKey?: string
  }
  email: {
    enabled: boolean
    provider: 'sendgrid' | 'resend' | 'nodemailer'
    apiKey?: string
  }
  sms: {
    enabled: boolean
    provider: 'twilio' | 'aws-sns'
    apiKey?: string
  }
}

export interface FileStorageConfig {
  provider: 'supabase' | 'aws-s3' | 'cloudinary' | 'local'
  bucket?: string
  region?: string
  accessKey?: string
  secretKey?: string
  maxFileSize: number
  allowedTypes: string[]
}

export interface SearchConfig {
  provider: 'algolia' | 'elasticsearch' | 'typesense' | 'local'
  apiKey?: string
  appId?: string
  indexName?: string
  enabled: boolean
}

export interface IntegrationConfig {
  slack?: {
    enabled: boolean
    webhookUrl?: string
    botToken?: string
  }
  discord?: {
    enabled: boolean
    webhookUrl?: string
    botToken?: string
  }
  teams?: {
    enabled: boolean
    webhookUrl?: string
  }
  zapier?: {
    enabled: boolean
    webhookUrl?: string
  }
}

export interface ExperimentConfig {
  enabled: boolean
  provider: 'launchdarkly' | 'split' | 'optimizely' | 'custom'
  apiKey?: string
  experiments: Record<string, {
    enabled: boolean
    variations: string[]
    defaultVariation: string
  }>
}
