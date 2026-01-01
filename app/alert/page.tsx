'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getAircraftTypeName } from '../lib/aircraftTypes'
import { getAirportName } from '../lib/airports'

// App version
const APP_VERSION = 'v1.2.1'

// Default: Werastraße 18, Holzgerlingen
const DEFAULT_LOCATION = { lat: 48.6406, lon: 9.0118 }
const ALERT_RADIUS_KM = 2
const SEARCH_RADIUS_KM = 15
const REFRESH_INTERVAL = 5000 // Schnelleres Update für Alerts

interface Flight {
  hex: string
  callsign: string
  altitude: number | null
  distance: number
  type: string | null
  registration: string | null
  color: string
  name: string
  isApproaching: boolean
}

interface FlightRoute {
  origin: string | null
  destination: string | null
}

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

const getAirlineInfo = (callsign: string | null): { color: string; name: string } => {
  if (!callsign) return { color: 'bg-gray-600', name: '' }
  const prefix = callsign.substring(0, 3).toUpperCase()
  const airlines: Record<string, { color: string; name: string }> = {
    'DLH': { color: 'bg-yellow-500', name: 'Lufthansa' },
    'EWG': { color: 'bg-orange-500', name: 'Eurowings' },
    'RYR': { color: 'bg-blue-600', name: 'Ryanair' },
    'EZY': { color: 'bg-orange-600', name: 'easyJet' },
    'SWR': { color: 'bg-red-600', name: 'Swiss' },
    'TUI': { color: 'bg-blue-500', name: 'TUI fly' },
    'CFG': { color: 'bg-blue-400', name: 'Condor' },
    'WZZ': { color: 'bg-purple-600', name: 'Wizz Air' },
    'AUA': { color: 'bg-red-700', name: 'Austrian' },
    'UAE': { color: 'bg-red-500', name: 'Emirates' },
    'THY': { color: 'bg-red-600', name: 'Turkish' },
    'AFR': { color: 'bg-blue-800', name: 'Air France' },
    'BAW': { color: 'bg-blue-900', name: 'British Airways' },
    'KLM': { color: 'bg-sky-600', name: 'KLM' },
  }
  return airlines[prefix] || { color: 'bg-slate-500', name: prefix }
}

export default function AlertMode() {
  const [alertFlight, setAlertFlight] = useState<Flight | null>(null)
  const [alertRoute, setAlertRoute] = useState<FlightRoute | null>(null)
  const [showAlert, setShowAlert] = useState(false)
  const [lastAlertTime, setLastAlertTime] = useState<Date | null>(null)
  const [totalFlights, setTotalFlights] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const lastAlertedRef = useRef<Set<string>>(new Set())
  const prevDistancesRef = useRef<Map<string, number>>(new Map())
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const routeCacheRef = useRef<Map<string, FlightRoute>>(new Map())

  // Fetch route for a callsign
  const fetchRoute = useCallback(async (callsign: string) => {
    // Check cache first
    if (routeCacheRef.current.has(callsign)) {
      setAlertRoute(routeCacheRef.current.get(callsign) || null)
      return
    }

    try {
      const response = await fetch(`/api/routes?callsign=${encodeURIComponent(callsign)}`)
      const data = await response.json()
      const route: FlightRoute = {
        origin: data.origin || null,
        destination: data.destination || null,
      }
      routeCacheRef.current.set(callsign, route)
      setAlertRoute(route)
    } catch {
      setAlertRoute(null)
    }
  }, [])

  const fetchFlights = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/flights?lat=${DEFAULT_LOCATION.lat}&lon=${DEFAULT_LOCATION.lon}&dist=${SEARCH_RADIUS_KM}`
      )

      if (!response.ok) return

      const data = await response.json()

      if (data.ac) {
        const nearbyFlights = data.ac
          .filter((ac: any) => ac.lat && ac.lon)
          .map((ac: any) => {
            const distance = getDistance(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon, ac.lat, ac.lon)
            const prevDistance = prevDistancesRef.current.get(ac.hex)
            const isApproaching = prevDistance !== undefined && distance < prevDistance
            prevDistancesRef.current.set(ac.hex, distance)

            return {
              hex: ac.hex,
              callsign: ac.flight?.trim() || ac.hex,
              altitude: ac.alt_baro || ac.alt_geom,
              distance,
              type: ac.t,
              registration: ac.r,
              isApproaching,
              ...getAirlineInfo(ac.flight?.trim())
            }
          })
          .filter((f: Flight) => f.distance <= ALERT_RADIUS_KM)
          .sort((a: Flight, b: Flight) => a.distance - b.distance)

        setTotalFlights(data.ac.length)

        // Check for NEW flights in zone
        const newFlights = nearbyFlights.filter((f: Flight) => !lastAlertedRef.current.has(f.hex))

        if (newFlights.length > 0) {
          const closest = newFlights[0]
          setAlertFlight(closest)
          setShowAlert(true)
          setLastAlertTime(new Date())

          // Fetch route for this flight
          if (closest.callsign && closest.callsign !== closest.hex) {
            fetchRoute(closest.callsign)
          } else {
            setAlertRoute(null)
          }

          // Play sound
          if (audioRef.current) {
            audioRef.current.currentTime = 0
            audioRef.current.play().catch(() => {})
          }

          // Add to alerted set
          newFlights.forEach((f: Flight) => lastAlertedRef.current.add(f.hex))

          // Hide alert after 15 seconds
          if (alertTimeoutRef.current) {
            clearTimeout(alertTimeoutRef.current)
          }
          alertTimeoutRef.current = setTimeout(() => {
            setShowAlert(false)
          }, 15000)
        }

        // Clean up flights that left the zone
        const currentHexes = new Set(nearbyFlights.map((f: Flight) => f.hex))
        lastAlertedRef.current.forEach(hex => {
          if (!currentHexes.has(hex)) {
            lastAlertedRef.current.delete(hex)
          }
        })
      }
    } catch (err) {
      console.error('Fetch error:', err)
    }
  }, [fetchRoute])

  useEffect(() => {
    fetchFlights()
    const interval = setInterval(fetchFlights, REFRESH_INTERVAL)
    return () => {
      clearInterval(interval)
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current)
      }
    }
  }, [fetchFlights])

  // Format altitude
  const formatAlt = (m: number | null) => m ? `${Math.round(m * 3.28084).toLocaleString()} ft` : ''

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      {/* Alert Sound - louder beep */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp6ZkYV4bGZpd4WSnZ2XjYF0aGVqdIKQnJ2Zi4J2amVodYOQm5yZi4J2amZpdoSRm5yYioF1aGVodYORm5yYioJ2aWZpdoSRm5uYioJ2aWdqdoSRm5uXiYF1aGZpdoORm5uXiYJ2aWdqd4SRmpuXiYJ2aWdqd4WRmpqWiIF1aGZpd4WRmpqWiIF2aWdqeIWRmpmViIF2aWdqeIWRmpmViIJ3amdreYWRmZmUh4F2aWhreYaRmZiUh4J3a2hseoeRmJiThoF2a2hseoeRmJeThoJ3a2lte4iRl5eThoJ4bGpufImRlpaShoJ4bGpufImRlpaShoN5bWtvfYqRlZWRhYN5bWtwfYqQlJSQhIN5bmtwfouQk5SPg4N5bmxxf4yQk5OOg4R6b2xyf4yPkpKNgoR7cG1zgI2PkZGMgoR7cW50gY2OkJCLgYV8cm91go6OjYoAAAA=" type="audio/wav"/>
      </audio>

      {showAlert && alertFlight ? (
        // ALERT VIEW - Big, bold, easy to see from distance
        <div className="alert-pulse w-full max-w-lg">
          <div className="bg-red-900/80 border-4 border-red-500 rounded-3xl p-8 text-center">
            <div className="text-6xl mb-4">✈️</div>

            <div className="text-2xl text-red-300 mb-2">FLUGZEUG!</div>

            <div className={`${alertFlight.color} inline-block px-6 py-2 rounded-xl text-3xl font-bold mb-4`}>
              {alertFlight.callsign}
            </div>

            {alertFlight.name && (
              <div className="text-xl text-gray-300 mb-2">{alertFlight.name}</div>
            )}

            {/* Route Info */}
            {alertRoute?.destination && (
              <div className="mb-4">
                <div className="text-sm text-gray-500">Ziel</div>
                <div className="text-2xl text-yellow-400 font-bold">
                  {getAirportName(alertRoute.destination)}
                </div>
                {alertRoute.origin && (
                  <div className="text-sm text-gray-500 mt-1">
                    von {getAirportName(alertRoute.origin)}
                  </div>
                )}
              </div>
            )}

            <div className="text-5xl font-bold text-white mb-2">
              {alertFlight.distance < 1
                ? `${Math.round(alertFlight.distance * 1000)}m`
                : `${alertFlight.distance.toFixed(1)}km`
              }
            </div>

            <div className="text-xl text-gray-400">
              {formatAlt(alertFlight.altitude)}
              {alertFlight.type && ` • ${getAircraftTypeName(alertFlight.type)}`}
            </div>

            {alertFlight.registration && (
              <div className="mt-2 text-gray-500 font-mono">
                {alertFlight.registration}
              </div>
            )}

            {alertFlight.isApproaching && (
              <div className="mt-4 text-green-400 text-lg">
                ↓ Kommt näher
              </div>
            )}
          </div>
        </div>
      ) : (
        // IDLE VIEW - Minimal, dark
        <div className="text-center opacity-30">
          <div className="text-4xl mb-4">✈️</div>
          <div className="text-xl text-gray-500">Warte auf Flieger...</div>
          <div className="text-sm text-gray-600 mt-2">
            {totalFlights} Flugzeuge im Radar
          </div>
          {lastAlertTime && (
            <div className="text-xs text-gray-700 mt-4">
              Letzter Alert: {lastAlertTime.toLocaleTimeString('de-DE')}
            </div>
          )}
        </div>
      )}

      {/* Back link - subtle */}
      <a
        href="/"
        className="fixed bottom-4 left-4 text-gray-700 hover:text-gray-500 text-sm"
      >
        ← Vollansicht
      </a>

      {/* Demo link */}
      <a
        href="/demo"
        className="fixed top-4 right-4 text-gray-700 hover:text-gray-500 text-xs"
      >
        🧪 Demo
      </a>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 flex items-center gap-2 text-xs text-gray-700">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        Live • {APP_VERSION}
      </div>
    </div>
  )
}
