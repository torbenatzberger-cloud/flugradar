import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')
  const dist = searchParams.get('dist')

  if (!lat || !lon || !dist) {
    return NextResponse.json(
      { error: 'Missing parameters: lat, lon, dist required' },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(
      `https://api.adsb.lol/v2/lat/${lat}/lon/${lon}/dist/${dist}`
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: `ADSB API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch flight data' },
      { status: 500 }
    )
  }
}
