export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public metadata?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ApiError extends AppError {
  constructor(
    public status: number,
    message: string,
    code: string,
    metadata?: Record<string, unknown>
  ) {
    super(code, message, metadata)
    this.name = 'ApiError'
  }

  static fromError(error: unknown): ApiError {
    if (error instanceof ApiError) return error

    if (error instanceof Error) {
      return new ApiError(
        500,
        error.message,
        'INTERNAL_ERROR',
        { originalError: error.stack }
      )
    }

    return new ApiError(
      500,
      'Erro desconhecido',
      'UNKNOWN_ERROR',
      { originalError: error }
    )
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public errors: Record<string, string[]>
  ) {
    super('VALIDATION_ERROR', message, { errors })
    this.name = 'ValidationError'
  }
}
