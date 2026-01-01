import { NextRequest, NextResponse } from 'next/server'

// In-memory cache for route data
const routeCache = new Map<string, { data: RouteData; timestamp: number }>()
const CACHE_DURATION_MS = 5 * 60 * 1000 // 5 minutes

interface RouteData {
  callsign: string
  route: string[] | null
  origin: string | null
  destination: string | null
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const callsign = searchParams.get('callsign')

  if (!callsign) {
    return NextResponse.json(
      { error: 'Missing parameter: callsign required' },
      { status: 400 }
    )
  }

  // Normalize callsign (uppercase, trimmed)
  const normalizedCallsign = callsign.trim().toUpperCase()

  // Check cache first
  const cached = routeCache.get(normalizedCallsign)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    return NextResponse.json(cached.data)
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(
      `https://opensky-network.org/api/routes?callsign=${normalizedCallsign}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      // OpenSky returns 404 for unknown routes - that's okay
      if (response.status === 404) {
        const emptyResult: RouteData = {
          callsign: normalizedCallsign,
          route: null,
          origin: null,
          destination: null,
        }
        routeCache.set(normalizedCallsign, { data: emptyResult, timestamp: Date.now() })
        return NextResponse.json(emptyResult)
      }

      return NextResponse.json(
        { error: `OpenSky API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Transform the response to a cleaner format
    const result: RouteData = {
      callsign: normalizedCallsign,
      route: data.route || null,
      origin: data.route?.[0] || null,
      destination: data.route?.[data.route.length - 1] || null,
    }

    // Cache the result
    routeCache.set(normalizedCallsign, { data: result, timestamp: Date.now() })

    return NextResponse.json(result)
  } catch (error: unknown) {
    // Timeout or network error - return empty route without caching
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('OpenSky API error:', errorMessage)

    return NextResponse.json({
      callsign: normalizedCallsign,
      route: null,
      origin: null,
      destination: null,
      error: 'Route lookup failed',
    })
  }
}
