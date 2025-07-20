
import { NextResponse } from 'next/server'

export async function GET() {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  }

  try {
    return NextResponse.json(healthcheck, { status: 200 })
  } catch (error) {
    const errorResponse = {
      message: 'Service Unavailable',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    }
    return NextResponse.json(errorResponse, { status: 503 })
  }
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
