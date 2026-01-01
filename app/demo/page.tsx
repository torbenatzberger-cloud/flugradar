'use client'

import { useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { getAircraftTypeName } from '../lib/aircraftTypes'
import FlightDetailModal from '../components/FlightDetailModal'

const FlightMap = dynamic(() => import('../components/FlightMap'), {
  ssr: false,
  loading: () => (
    <div className="h-64 md:h-80 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
      <span className="text-gray-400">Lade Karte...</span>
    </div>
  ),
})

const DEMO_LOCATION = { lat: 48.6406, lon: 9.0118, name: 'Holzgerlingen (Demo)' }
const ALERT_RADIUS_KM = 2
const SEARCH_RADIUS_KM = 30

interface Flight {
  hex: string
  callsign: string
  lat: number
  lon: number
  altitude: number | null
  speed: number | null
  heading: number | null
  verticalRate: number | null
  squawk: string | null
  type: string | null
  registration: string | null
  distance: number
  isDescending: boolean
  isLanding: boolean
  isInAlertZone: boolean
  isApproaching: boolean
  color: string
  name: string
}

// Simulierte Flugdaten
const createDemoFlights = (): Flight[] => [
  {
    hex: 'demo1',
    callsign: 'DLH123',
    lat: 48.6410,
    lon: 9.0125,
    altitude: 2500,
    speed: 180,
    heading: 270,
    verticalRate: -800,
    squawk: '7000',
    type: 'A320',
    registration: 'D-AIBL',
    distance: 0.08,
    isDescending: true,
    isLanding: true,
    isInAlertZone: true,
    isApproaching: true,
    color: 'bg-yellow-600',
    name: 'Lufthansa',
  },
  {
    hex: 'demo2',
    callsign: 'EWG456',
    lat: 48.6450,
    lon: 9.0200,
    altitude: 5000,
    speed: 280,
    heading: 180,
    verticalRate: -400,
    squawk: '1234',
    type: 'A319',
    registration: 'D-AGWC',
    distance: 0.9,
    isDescending: true,
    isLanding: true,
    isInAlertZone: true,
    isApproaching: true,
    color: 'bg-orange-500',
    name: 'Eurowings',
  },
  {
    hex: 'demo3',
    callsign: 'RYR789',
    lat: 48.6600,
    lon: 9.0500,
    altitude: 12000,
    speed: 420,
    heading: 45,
    verticalRate: 0,
    squawk: '5555',
    type: 'B738',
    registration: 'EI-DCL',
    distance: 3.5,
    isDescending: false,
    isLanding: false,
    isInAlertZone: false,
    isApproaching: false,
    color: 'bg-blue-700',
    name: 'Ryanair',
  },
  {
    hex: 'demo4',
    callsign: 'SWR101',
    lat: 48.6800,
    lon: 9.1000,
    altitude: 8000,
    speed: 350,
    heading: 120,
    verticalRate: -600,
    squawk: '2222',
    type: 'A21N',
    registration: 'HB-JPA',
    distance: 7.2,
    isDescending: true,
    isLanding: true,
    isInAlertZone: false,
    isApproaching: true,
    color: 'bg-red-600',
    name: 'Swiss',
  },
  {
    hex: 'demo5',
    callsign: 'UAE55',
    lat: 48.7500,
    lon: 9.2000,
    altitude: 35000,
    speed: 520,
    heading: 280,
    verticalRate: 0,
    squawk: '3333',
    type: 'B77W',
    registration: 'A6-EGE',
    distance: 15.8,
    isDescending: false,
    isLanding: false,
    isInAlertZone: false,
    isApproaching: false,
    color: 'bg-red-500',
    name: 'Emirates',
  },
]

const demoRoutes = new Map([
  ['DLH123', { origin: 'EDDF', destination: 'LEMD' }],
  ['EWG456', { origin: 'EDDM', destination: 'EDDS' }],
  ['RYR789', { origin: 'LEBL', destination: 'EDDB' }],
  ['SWR101', { origin: 'LSZH', destination: 'EDDS' }],
  ['UAE55', { origin: 'OMDB', destination: 'KJFK' }],
])

const formatAltitude = (meters: number | null): string => {
  if (!meters) return '-'
  const feet = Math.round(meters * 3.28084)
  return `${feet.toLocaleString('de-DE')} ft`
}

const formatSpeed = (knots: number | null): string => {
  if (!knots) return '-'
  return `${Math.round(knots)} kts`
}

const getDirection = (degrees: number | null): string => {
  if (degrees === null || degrees === undefined) return '?'
  const dirs = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(degrees / 45) % 8]
}

export default function DemoPage() {
  const [flights] = useState<Flight[]>(createDemoFlights())
  const [showMap, setShowMap] = useState(false)
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null)
  const [alertEnabled, setAlertEnabled] = useState(true)
  const audioRef = useRef<HTMLAudioElement>(null)

  const alertFlights = flights.filter(f => f.isInAlertZone)
  const closestFlight = flights[0]
  const flightsInApproach = flights.filter(f => f.isLanding)
  const approachingFlights = flights.filter(f => f.isApproaching && f.distance < 10)

  const playAlertSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }
  }

  const handleFlightClick = (flight: Flight) => {
    setSelectedFlight(flight)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white p-4">
      {/* Alert sound */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp6ZkYV4bGZpd4WSnZ2XjYF0aGVqdIKQnJ2Zi4J2amVodYOQm5yZi4J2amZpdoSRm5yYioF1aGVodYORm5yYioJ2aWZpdoSRm5uYioJ2aWdqdoSRm5uXiYF1aGZpdoORm5uXiYJ2aWdqd4SRmpuXiYJ2aWdqd4WRmpqWiIF1aGZpd4WRmpqWiIF2aWdqeIWRmpmViIF2aWdqeIWRmpmViIJ3amdreYWRmZmUh4F2aWhreYaRmZiUh4J3a2hseoeRmJiThoF2a2hseoeRmJeThoJ3a2lte4iRl5eThoJ4bGpufImRlpaShoJ4bGpufImRlpaShoN5bWtvfYqRlZWRhYN5bWtwfYqQlJSQhIN5bmtwfouQk5SPg4N5bmxxf4yQk5OOg4R6b2xyf4yPkpKNgoR7cG1zgI2PkZGMgoR7cW50gY2OkJCLgYV8cm91go6OjYoAAAA=" type="audio/wav"/>
      </audio>

      <div className="max-w-2xl mx-auto">
        {/* Demo Banner */}
        <div className="bg-purple-900/50 border border-purple-500 rounded-xl p-3 mb-4 text-center">
          <span className="text-purple-300 font-bold">🧪 DEMO MODUS</span>
          <p className="text-sm text-purple-200 mt-1">
            Simulierte Flugdaten zum Testen der Funktionen
          </p>
          <button
            onClick={playAlertSound}
            className="mt-2 px-4 py-1 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm transition"
          >
            🔔 Alert-Sound testen
          </button>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              ✈️ Flugradar
            </h1>
            <p className="text-sm text-gray-400">
              📍 {DEMO_LOCATION.name} • Alert: {ALERT_RADIUS_KM}km
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowMap(!showMap)}
              className={`p-2 rounded-lg transition ${showMap ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
              title={showMap ? 'Liste anzeigen' : 'Karte anzeigen'}
            >
              {showMap ? '📋' : '🗺️'}
            </button>
            <a
              href="/"
              className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition text-sm"
              title="Zurück zur Live-Ansicht"
            >
              ← Live
            </a>
          </div>
        </div>

        {/* Alert Zone - Simuliert */}
        {alertFlights.length > 0 && (
          <div className="alert-pulse bg-red-900/50 border-2 border-red-500 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">🚨</span>
              <div>
                <span className="font-bold text-red-300 text-lg">
                  FLUGZEUG ÜBER DIR!
                </span>
                <div className="text-sm text-red-200">
                  {alertFlights.length} Flieger im {ALERT_RADIUS_KM}km Radius
                </div>
              </div>
            </div>
            {alertFlights.map(flight => {
              const route = demoRoutes.get(flight.callsign)
              return (
                <div
                  key={flight.hex}
                  className="bg-red-950/50 rounded-lg p-3 mt-2 cursor-pointer hover:bg-red-950/70 transition"
                  onClick={() => handleFlightClick(flight)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`${flight.color} px-2 py-0.5 rounded text-sm font-bold`}>
                        {flight.callsign}
                      </span>
                      <span className="text-gray-300">{flight.name}</span>
                      {flight.isApproaching && (
                        <span className="text-green-400 text-sm">↓ kommt näher</span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xl font-bold text-red-300">
                        {flight.distance < 1
                          ? `${Math.round(flight.distance * 1000)}m`
                          : `${flight.distance.toFixed(1)}km`
                        }
                      </div>
                      <div className="text-xs text-gray-400">{formatAltitude(flight.altitude)}</div>
                    </div>
                  </div>
                  {/* Route info */}
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                    <span>{getAircraftTypeName(flight.type)}</span>
                    {flight.registration && (
                      <span className="bg-slate-700 px-2 py-0.5 rounded font-mono">
                        {flight.registration}
                      </span>
                    )}
                    {route && (
                      <span className="text-yellow-400 font-semibold">
                        {route.origin} → {route.destination}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="bg-slate-800 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-blue-400">{flights.length}</div>
            <div className="text-xs text-gray-400">Gesamt</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-orange-400">{flightsInApproach.length}</div>
            <div className="text-xs text-gray-400">→ STR</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-green-400">{approachingFlights.length}</div>
            <div className="text-xs text-gray-400">Nähernd</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-red-400">{alertFlights.length}</div>
            <div className="text-xs text-gray-400">&lt;{ALERT_RADIUS_KM}km</div>
          </div>
        </div>

        {/* Map or Flight List */}
        {showMap ? (
          <div className="mb-4">
            <FlightMap
              flights={flights}
              userLocation={{ lat: DEMO_LOCATION.lat, lon: DEMO_LOCATION.lon }}
              alertRadius={ALERT_RADIUS_KM}
              searchRadius={SEARCH_RADIUS_KM}
              onFlightClick={handleFlightClick}
            />
          </div>
        ) : (
          <div className="space-y-2 hide-scrollbar">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">
              Flugzeuge im Umkreis ({SEARCH_RADIUS_KM}km)
            </h3>

            {flights.map(flight => {
              const route = demoRoutes.get(flight.callsign)
              return (
                <div
                  key={flight.hex}
                  onClick={() => handleFlightClick(flight)}
                  className={`bg-slate-800/80 rounded-lg p-3 border transition cursor-pointer hover:bg-slate-700/80 ${
                    flight.isInAlertZone
                      ? 'border-red-500 bg-red-900/20'
                      : flight.isLanding
                        ? 'border-orange-500/50'
                        : 'border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`${flight.color} px-2 py-0.5 rounded text-sm font-bold`}>
                        {flight.callsign}
                      </span>
                      <span className="text-gray-400 text-sm">{flight.name}</span>
                      {flight.isLanding && (
                        <span className="px-2 py-0.5 bg-orange-600/80 rounded text-xs">→ STR</span>
                      )}
                      {flight.isApproaching && (
                        <span className="text-green-400 text-xs">↓</span>
                      )}
                    </div>
                    <div className="font-mono text-blue-400">
                      {flight.distance < 1
                        ? `${Math.round(flight.distance * 1000)}m`
                        : `${flight.distance.toFixed(1)}km`
                      }
                    </div>
                  </div>

                  {/* Aircraft type, registration, route */}
                  <div className="flex items-center gap-2 mb-2 text-xs flex-wrap">
                    {flight.type && (
                      <span className="text-gray-500">
                        {getAircraftTypeName(flight.type)}
                      </span>
                    )}
                    {flight.registration && (
                      <span className="bg-slate-700 px-2 py-0.5 rounded font-mono text-gray-400">
                        {flight.registration}
                      </span>
                    )}
                    {route && (
                      <span className="text-yellow-400 font-semibold">
                        {route.origin} → {route.destination}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-slate-900/50 rounded py-1">
                      <div className="font-semibold">{formatAltitude(flight.altitude)}</div>
                      <div className="text-gray-500">Höhe</div>
                    </div>
                    <div className="bg-slate-900/50 rounded py-1">
                      <div className="font-semibold">{formatSpeed(flight.speed)}</div>
                      <div className="text-gray-500">Speed</div>
                    </div>
                    <div className="bg-slate-900/50 rounded py-1">
                      <div className="font-semibold">{getDirection(flight.heading)}</div>
                      <div className="text-gray-500">Richtung</div>
                    </div>
                    <div className="bg-slate-900/50 rounded py-1">
                      <div className={`font-semibold ${
                        flight.isDescending ? 'text-orange-400' :
                        flight.verticalRate && flight.verticalRate > 200 ? 'text-green-400' : ''
                      }`}>
                        {flight.verticalRate
                          ? `${flight.verticalRate > 0 ? '↑' : '↓'}${Math.abs(Math.round(flight.verticalRate/100))}`
                          : '—'}
                      </div>
                      <div className="text-gray-500">V/S</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-600 space-y-1">
          <div>🧪 Demo-Modus mit simulierten Daten</div>
          <a href="/" className="text-blue-400 hover:underline">
            → Zur Live-Ansicht
          </a>
        </div>
      </div>

      {/* Flight Detail Modal */}
      <FlightDetailModal
        flight={selectedFlight}
        origin={selectedFlight ? demoRoutes.get(selectedFlight.callsign)?.origin || null : null}
        destination={selectedFlight ? demoRoutes.get(selectedFlight.callsign)?.destination || null : null}
        onClose={() => setSelectedFlight(null)}
      />
    </div>
  )
}
