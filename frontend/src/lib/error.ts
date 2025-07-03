export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public metadata?: Record<string, any>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export interface ErrorState {
  code: string
  message: string
  metadata?: Record<string, any>
  timestamp: number
}
