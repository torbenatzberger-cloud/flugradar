'use client'

import { useState, useEffect, useRef } from 'react'
import { getAircraftTypeName } from '../lib/aircraftTypes'
import { getAirportName } from '../lib/airports'

const APP_VERSION = 'v1.4.1'
const DEMO_LOCATION = { lat: 48.6406, lon: 9.0118 }
const ALERT_RADIUS_KM = 2

interface Flight {
  hex: string
  callsign: string
  lat: number
  lon: number
  altitude: number | null
  speed: number | null
  heading: number | null
  verticalRate: number | null
  type: string | null
  registration: string | null
  distance: number
  isApproaching: boolean
  color: string
  name: string
  // Animation properties
  startLat: number
  startLon: number
  endLat: number
  endLon: number
  startAlt: number
  endAlt: number
}

// Haversine distance
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

// Flugzeuge die reinfliegen werden
const createAnimatedFlights = (): Flight[] => [
  {
    hex: 'demo1',
    callsign: 'DLH123',
    lat: 0, lon: 0, // wird animiert
    altitude: 8000,
    speed: 280,
    heading: 225, // kommt von Nordosten
    verticalRate: -600,
    type: 'A320',
    registration: 'D-AIBL',
    distance: 0,
    isApproaching: true,
    color: 'bg-yellow-600',
    name: 'Lufthansa',
    // Start: 15km entfernt, Ende: 0.5km (in Alert Zone)
    startLat: 48.75,
    startLon: 9.12,
    endLat: 48.644,
    endLon: 9.015,
    startAlt: 12000,
    endAlt: 3000,
  },
  {
    hex: 'demo2',
    callsign: 'EWG456',
    lat: 0, lon: 0,
    altitude: 6000,
    speed: 250,
    heading: 180, // kommt von Norden
    verticalRate: -800,
    type: 'A319',
    registration: 'D-AGWC',
    distance: 0,
    isApproaching: true,
    color: 'bg-orange-500',
    name: 'Eurowings',
    // Start: 12km entfernt, Ende: 0.8km
    startLat: 48.75,
    startLon: 9.01,
    endLat: 48.647,
    endLon: 9.012,
    startAlt: 10000,
    endAlt: 2500,
  },
]

const demoRoutes = new Map([
  ['DLH123', { origin: 'EDDF', destination: 'EDDS' }],
  ['EWG456', { origin: 'EDDM', destination: 'EDDS' }],
])

const formatAltitude = (meters: number | null): string => {
  if (!meters) return '-'
  const feet = Math.round(meters * 3.28084)
  return `${feet.toLocaleString('de-DE')} ft`
}

export default function DemoAlertPage() {
  const [flights, setFlights] = useState<Flight[]>([])
  const [alertFlight, setAlertFlight] = useState<Flight | null>(null)
  const [showAlert, setShowAlert] = useState(false)
  const [lastAlertTime, setLastAlertTime] = useState<Date | null>(null)
  const [progress, setProgress] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [totalFlights] = useState(2)
  const audioRef = useRef<HTMLAudioElement>(null)
  const alertedRef = useRef<Set<string>>(new Set())
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const ANIMATION_DURATION = 30000 // 30 Sekunden

  // Animation starten
  const startAnimation = () => {
    setIsRunning(true)
    setProgress(0)
    setShowAlert(false)
    setAlertFlight(null)
    alertedRef.current = new Set()
    setFlights(createAnimatedFlights())
  }

  // Animation stoppen
  const stopAnimation = () => {
    setIsRunning(false)
    setProgress(0)
    setFlights([])
    setShowAlert(false)
    setAlertFlight(null)
    alertedRef.current = new Set()
  }

  // Animation Loop
  useEffect(() => {
    if (!isRunning) return

    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min(elapsed / ANIMATION_DURATION, 1)
      setProgress(newProgress)

      if (newProgress >= 1) {
        setIsRunning(false)
        return
      }

      // Update flight positions
      setFlights(prevFlights => {
        const updatedFlights = prevFlights.map(flight => {
          // Interpoliere Position
          const lat = flight.startLat + (flight.endLat - flight.startLat) * newProgress
          const lon = flight.startLon + (flight.endLon - flight.startLon) * newProgress
          const altitude = flight.startAlt + (flight.endAlt - flight.startAlt) * newProgress
          const distance = getDistance(DEMO_LOCATION.lat, DEMO_LOCATION.lon, lat, lon)

          return {
            ...flight,
            lat,
            lon,
            altitude,
            distance,
          }
        }).sort((a, b) => a.distance - b.distance)

        // Check for new alerts
        const inAlertZone = updatedFlights.filter(f => f.distance <= ALERT_RADIUS_KM)
        const newAlerts = inAlertZone.filter(f => !alertedRef.current.has(f.hex))

        if (newAlerts.length > 0) {
          const closest = newAlerts[0]
          alertedRef.current.add(closest.hex)

          setAlertFlight(closest)
          setShowAlert(true)
          setLastAlertTime(new Date())

          // Play sound
          if (audioRef.current) {
            audioRef.current.currentTime = 0
            audioRef.current.play().catch(() => {})
          }

          // Hide alert after 15 seconds
          if (alertTimeoutRef.current) {
            clearTimeout(alertTimeoutRef.current)
          }
          alertTimeoutRef.current = setTimeout(() => {
            setShowAlert(false)
          }, 15000)
        }

        return updatedFlights
      })

      requestAnimationFrame(animate)
    }

    const animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [isRunning])

  // Cleanup
  useEffect(() => {
    return () => {
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current)
      }
    }
  }, [])

  const route = alertFlight ? demoRoutes.get(alertFlight.callsign) : null

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      {/* Alert Sound */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp6ZkYV4bGZpd4WSnZ2XjYF0aGVqdIKQnJ2Zi4J2amVodYOQm5yZi4J2amZpdoSRm5yYioF1aGVodYORm5yYioJ2aWZpdoSRm5uYioJ2aWdqdoSRm5uXiYF1aGZpdoORm5uXiYJ2aWdqd4SRmpuXiYJ2aWdqd4WRmpqWiIF1aGZpd4WRmpqWiIF2aWdqeIWRmpmViIF2aWdqeIWRmpmViIJ3amdreYWRmZmUh4F2aWhreYaRmZiUh4J3a2hseoeRmJiThoF2a2hseoeRmJeThoJ3a2lte4iRl5eThoJ4bGpufImRlpaShoJ4bGpufImRlpaShoN5bWtvfYqRlZWRhYN5bWtwfYqQlJSQhIN5bmtwfouQk5SPg4N5bmxxf4yQk5OOg4R6b2xyf4yPkpKNgoR7cG1zgI2PkZGMgoR7cW50gY2OkJCLgYV8cm91go6OjYoAAAA=" type="audio/wav"/>
      </audio>

      {/* Demo Banner */}
      <div className="fixed top-4 left-4 right-4 z-50">
        <div className="max-w-lg mx-auto bg-purple-900/80 border border-purple-500 rounded-xl p-3 text-center backdrop-blur">
          <span className="text-purple-300 font-bold">🧪 ALERT DEMO</span>
          <p className="text-sm text-purple-200 mt-1">
            Simuliert Flugzeuge die in die Alert-Zone fliegen
          </p>

          {/* Progress bar */}
          {isRunning && (
            <div className="mt-2 bg-purple-950 rounded-full h-2 overflow-hidden">
              <div
                className="bg-purple-400 h-full transition-all duration-100"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          )}

          <div className="mt-2 flex gap-2 justify-center">
            {!isRunning ? (
              <button
                onClick={startAnimation}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm transition font-semibold"
              >
                ▶️ Simulation starten
              </button>
            ) : (
              <button
                onClick={stopAnimation}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm transition font-semibold"
              >
                ⏹️ Stoppen
              </button>
            )}
            <a
              href="/"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition"
            >
              ← Live
            </a>
          </div>
        </div>
      </div>

      {/* Main Content - Alert Style */}
      {showAlert && alertFlight ? (
        // ALERT VIEW
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

            {/* Route */}
            {route && (
              <div className="mb-4">
                <div className="text-sm text-gray-500">Ziel</div>
                <div className="text-2xl text-yellow-400 font-bold">
                  {getAirportName(route.destination)}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  von {getAirportName(route.origin)}
                </div>
              </div>
            )}

            <div className="text-5xl font-bold text-white mb-2">
              {alertFlight.distance < 1
                ? `${Math.round(alertFlight.distance * 1000)}m`
                : `${alertFlight.distance.toFixed(1)}km`
              }
            </div>

            <div className="text-xl text-gray-400">
              {formatAltitude(alertFlight.altitude)}
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
        // IDLE VIEW
        <div className="text-center opacity-30">
          <div className="text-4xl mb-4">✈️</div>
          <div className="text-xl text-gray-500">
            {isRunning ? 'Flugzeuge im Anflug...' : 'Warte auf Start...'}
          </div>
          {isRunning && flights.length > 0 && (
            <div className="text-sm text-gray-600 mt-2">
              Nächstes Flugzeug: {flights[0]?.distance.toFixed(1)}km
            </div>
          )}
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

      {/* Flight positions during animation */}
      {isRunning && flights.length > 0 && !showAlert && (
        <div className="fixed bottom-20 left-4 right-4">
          <div className="max-w-lg mx-auto bg-slate-900/80 rounded-xl p-3 backdrop-blur">
            <div className="text-xs text-gray-400 mb-2">Anfliegende Flugzeuge:</div>
            {flights.map(flight => (
              <div key={flight.hex} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className={`${flight.color} px-2 py-0.5 rounded text-xs font-bold`}>
                    {flight.callsign}
                  </span>
                  <span className="text-gray-500 text-xs">{flight.name}</span>
                </div>
                <div className="text-right">
                  <span className={`font-mono text-sm ${flight.distance <= ALERT_RADIUS_KM ? 'text-red-400' : 'text-blue-400'}`}>
                    {flight.distance.toFixed(1)}km
                  </span>
                  <span className="text-gray-600 text-xs ml-2">
                    {formatAltitude(flight.altitude)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 flex items-center gap-2 text-xs text-gray-700">
        <div className={`w-2 h-2 rounded-full animate-pulse ${isRunning ? 'bg-green-500' : 'bg-gray-500'}`}></div>
        {isRunning ? 'Simulation läuft' : 'Gestoppt'} • {APP_VERSION}
      </div>
    </div>
  )
}
