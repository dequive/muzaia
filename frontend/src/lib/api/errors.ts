export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string,
    public data?: any,
    public retryable = false
  ) {
    super(message)
    this.name = 'ApiError'
  }

  static isRetryable(error: unknown): boolean {
    if (error instanceof ApiError) {
      return error.retryable
    }
    return false
  }
}

export class NetworkError extends ApiError {
  constructor(message: string) {
    super(0, message, 'NETWORK_ERROR', null, true)
    this.name = 'NetworkError'
  }
}

export class TimeoutError extends ApiError {
  constructor(message: string) {
    super(408, message, 'TIMEOUT_ERROR', null, true)
    this.name = 'TimeoutError' 
  }
}
