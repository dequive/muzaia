import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security headers for production
  if (process.env.NODE_ENV === 'production') {
    // HSTS - Force HTTPS
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')

    // Prevent clickjacking
    response.headers.set('X-Frame-Options', 'DENY')

    // Prevent MIME sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff')

    // XSS Protection
    response.headers.set('X-XSS-Protection', '1; mode=block')

    // Referrer Policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    // Content Security Policy
    response.headers.set('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://api.mozaia.ai wss://api.mozaia.ai",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '))
  }

  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Add rate limiting headers
    response.headers.set('X-RateLimit-Limit', '100')
    response.headers.set('X-RateLimit-Window', '60')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}