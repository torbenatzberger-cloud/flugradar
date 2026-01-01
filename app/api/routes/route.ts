import { NextRequest, NextResponse } from 'next/server'

// In-memory cache for route data
const routeCache = new Map<string, { data: RouteData; timestamp: number }>()
const CACHE_DURATION_MS = 10 * 60 * 1000 // 10 minutes

interface RouteData {
  callsign: string
  origin: string | null
  originName: string | null
  destination: string | null
  destinationName: string | null
  airline: string | null
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
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    // Use adsbdb.com API - more reliable than OpenSky
    const response = await fetch(
      `https://api.adsbdb.com/v0/callsign/${normalizedCallsign}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Flugradar/1.2.1',
        },
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      // Not found - return empty result
      const emptyResult: RouteData = {
        callsign: normalizedCallsign,
        origin: null,
        originName: null,
        destination: null,
        destinationName: null,
        airline: null,
      }
      routeCache.set(normalizedCallsign, { data: emptyResult, timestamp: Date.now() })
      return NextResponse.json(emptyResult)
    }

    const data = await response.json()
    const flightroute = data?.response?.flightroute

    if (!flightroute) {
      const emptyResult: RouteData = {
        callsign: normalizedCallsign,
        origin: null,
        originName: null,
        destination: null,
        destinationName: null,
        airline: null,
      }
      routeCache.set(normalizedCallsign, { data: emptyResult, timestamp: Date.now() })
      return NextResponse.json(emptyResult)
    }

    // Extract route data
    const result: RouteData = {
      callsign: normalizedCallsign,
      origin: flightroute.origin?.icao_code || null,
      originName: flightroute.origin?.name || flightroute.origin?.municipality || null,
      destination: flightroute.destination?.icao_code || null,
      destinationName: flightroute.destination?.name || flightroute.destination?.municipality || null,
      airline: flightroute.airline?.name || null,
    }

    // Cache the result
    routeCache.set(normalizedCallsign, { data: result, timestamp: Date.now() })

    return NextResponse.json(result)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Route API error:', errorMessage)

    // Return empty result on error (don't cache errors)
    return NextResponse.json({
      callsign: normalizedCallsign,
      origin: null,
      originName: null,
      destination: null,
      destinationName: null,
      airline: null,
    })
  }
}
