'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// Default: Werastraße 18, Holzgerlingen
const DEFAULT_LOCATION = { lat: 48.6406, lon: 9.0118, name: 'Holzgerlingen' }
const ALERT_RADIUS_KM = 2 // 2km Alert-Zone
const SEARCH_RADIUS_KM = 30 // Suchradius für API
const REFRESH_INTERVAL = 8000 // 8 Sekunden

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
  prevDistance?: number
}

// Haversine distance formula
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

const getDirection = (degrees: number | null): string => {
  if (degrees === null || degrees === undefined) return '?'
  const dirs = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(degrees / 45) % 8]
}

const formatAltitude = (meters: number | null): string => {
  if (!meters) return '-'
  const feet = Math.round(meters * 3.28084)
  return `${feet.toLocaleString('de-DE')} ft`
}

const formatSpeed = (knots: number | null): string => {
  if (!knots) return '-'
  return `${Math.round(knots)} kts`
}

// Airline info
const getAirlineInfo = (callsign: string | null): { color: string; name: string } => {
  if (!callsign) return { color: 'bg-gray-600', name: 'Unbekannt' }
  const prefix = callsign.substring(0, 3).toUpperCase()
  const airlines: Record<string, { color: string; name: string }> = {
    'DLH': { color: 'bg-yellow-600', name: 'Lufthansa' },
    'EWG': { color: 'bg-orange-500', name: 'Eurowings' },
    'RYR': { color: 'bg-blue-700', name: 'Ryanair' },
    'EZY': { color: 'bg-orange-600', name: 'easyJet' },
    'WZZ': { color: 'bg-purple-600', name: 'Wizz Air' },
    'SWR': { color: 'bg-red-600', name: 'Swiss' },
    'AUA': { color: 'bg-red-700', name: 'Austrian' },
    'TUI': { color: 'bg-blue-500', name: 'TUI fly' },
    'CFG': { color: 'bg-blue-400', name: 'Condor' },
    'UAE': { color: 'bg-red-500', name: 'Emirates' },
    'THY': { color: 'bg-red-600', name: 'Turkish' },
    'AFR': { color: 'bg-blue-800', name: 'Air France' },
    'BAW': { color: 'bg-blue-900', name: 'British Airways' },
    'KLM': { color: 'bg-sky-600', name: 'KLM' },
  }
  return airlines[prefix] || { color: 'bg-slate-600', name: prefix }
}

export default function FlightRadar() {
  const [location, setLocation] = useState(DEFAULT_LOCATION)
  const [customLat, setCustomLat] = useState('')
  const [customLon, setCustomLon] = useState('')
  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [alertFlights, setAlertFlights] = useState<Flight[]>([])
  const [alertEnabled, setAlertEnabled] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const lastAlertRef = useRef<Set<string>>(new Set())
  const prevDistancesRef = useRef<Map<string, number>>(new Map())

  // Fetch flights from ADSB.lol API
  const fetchFlights = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/flights?lat=${location.lat}&lon=${location.lon}&dist=${SEARCH_RADIUS_KM}`
      )
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.ac) {
        const processedFlights: Flight[] = data.ac
          .filter((ac: any) => ac.lat && ac.lon)
          .map((ac: any) => {
            const distance = getDistance(location.lat, location.lon, ac.lat, ac.lon)
            const prevDistance = prevDistancesRef.current.get(ac.hex)
            const isApproaching = prevDistance !== undefined && distance < prevDistance
            const isDescending = ac.baro_rate && ac.baro_rate < -200
            const isLanding = isDescending && ac.alt_baro && ac.alt_baro < 10000
            const isInAlertZone = distance <= ALERT_RADIUS_KM
            
            // Update previous distance
            prevDistancesRef.current.set(ac.hex, distance)
            
            return {
              hex: ac.hex,
              callsign: ac.flight?.trim() || ac.hex,
              lat: ac.lat,
              lon: ac.lon,
              altitude: ac.alt_baro || ac.alt_geom,
              speed: ac.gs,
              heading: ac.track,
              verticalRate: ac.baro_rate,
              squawk: ac.squawk,
              type: ac.t,
              registration: ac.r,
              distance,
              isDescending,
              isLanding,
              isInAlertZone,
              isApproaching,
              prevDistance,
              ...getAirlineInfo(ac.flight?.trim())
            }
          })
          .sort((a: Flight, b: Flight) => a.distance - b.distance)
        
        setFlights(processedFlights)
        
        // Check for alerts - only approaching flights
        const inAlert = processedFlights.filter((f: Flight) => f.isInAlertZone)
        setAlertFlights(inAlert)
        
        // Play alert sound for NEW flights entering zone
        if (alertEnabled && inAlert.length > 0) {
          const newAlerts = inAlert.filter((f: Flight) => !lastAlertRef.current.has(f.hex))
          if (newAlerts.length > 0 && audioRef.current) {
            audioRef.current.play().catch(() => {})
          }
        }
        lastAlertRef.current = new Set(inAlert.map((f: Flight) => f.hex))
        
        setError(null)
      }
      
      setLastUpdate(new Date())
      setLoading(false)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }, [location, alertEnabled])

  // Initial fetch and interval
  useEffect(() => {
    fetchFlights()
    const interval = setInterval(fetchFlights, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchFlights])

  // Get GPS location
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            name: 'Mein Standort'
          })
          setCustomLat(pos.coords.latitude.toFixed(6))
          setCustomLon(pos.coords.longitude.toFixed(6))
        },
        (err) => setError('GPS nicht verfügbar: ' + err.message)
      )
    }
  }

  // Set custom location
  const handleSetCustomLocation = () => {
    const lat = parseFloat(customLat)
    const lon = parseFloat(customLon)
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      setLocation({ lat, lon, name: 'Benutzerdefiniert' })
      setShowSettings(false)
    }
  }

  const handleResetLocation = () => {
    setLocation(DEFAULT_LOCATION)
    setCustomLat('')
    setCustomLon('')
  }

  const closestFlight = flights[0]
  const flightsInApproach = flights.filter(f => f.isLanding)
  const approachingFlights = flights.filter(f => f.isApproaching && f.distance < 10)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white p-4">
      {/* Alert sound - simple beep */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp6ZkYV4bGZpd4WSnZ2XjYF0aGVqdIKQnJ2Zi4J2amVodYOQm5yZi4J2amZpdoSRm5yYioF1aGVodYORm5yYioJ2aWZpdoSRm5uYioJ2aWdqdoSRm5uXiYF1aGZpdoORm5uXiYJ2aWdqd4SRmpuXiYJ2aWdqd4WRmpqWiIF1aGZpd4WRmpqWiIF2aWdqeIWRmpmViIF2aWdqeIWRmpmViIJ3amdreYWRmZmUh4F2aWhreYaRmZiUh4J3a2hseoeRmJiThoF2a2hseoeRmJeThoJ3a2lte4iRl5eThoJ4bGpufImRlpaShoJ4bGpufImRlpaShoN5bWtvfYqRlZWRhYN5bWtwfYqQlJSQhIN5bmtwfouQk5SPg4N5bmxxf4yQk5OOg4R6b2xyf4yPkpKNgoR7cG1zgI2PkZGMgoR7cW50gY2OkJCLgYV8cm91go6OjYoAAAA=" type="audio/wav"/>
      </audio>

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              ✈️ Flugradar
            </h1>
            <p className="text-sm text-gray-400">
              📍 {location.name} • Alert: {ALERT_RADIUS_KM}km
            </p>
          </div>
          <div className="flex gap-2">
            <a 
              href="/alert" 
              className="p-2 bg-red-900/50 rounded-lg hover:bg-red-800/50 transition text-sm"
              title="Alert-Only Modus"
            >
              🚨
            </a>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-slate-800 rounded-xl p-4 mb-4 border border-slate-700">
            <h3 className="font-semibold mb-3">Einstellungen</h3>
            
            <div className="space-y-3">
              <button
                onClick={handleGetLocation}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 rounded-lg transition flex items-center justify-center gap-2"
              >
                📍 GPS-Standort verwenden
              </button>
              
              <button
                onClick={handleResetLocation}
                className="w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
              >
                🏠 Zurück zu Holzgerlingen
              </button>
              
              <div className="border-t border-slate-600 pt-3">
                <p className="text-sm text-gray-400 mb-2">Manuelle Koordinaten:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Lat (z.B. 48.6406)"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-900 rounded-lg border border-slate-600 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Lon (z.B. 9.0118)"
                    value={customLon}
                    onChange={(e) => setCustomLon(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-900 rounded-lg border border-slate-600 text-sm"
                  />
                </div>
                <button
                  onClick={handleSetCustomLocation}
                  className="w-full mt-2 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition"
                >
                  Koordinaten setzen
                </button>
              </div>
              
              <div className="flex items-center justify-between border-t border-slate-600 pt-3">
                <span className="text-sm">🔔 Alert-Sound</span>
                <button
                  onClick={() => setAlertEnabled(!alertEnabled)}
                  className={`px-4 py-1 rounded-full text-sm transition ${
                    alertEnabled ? 'bg-green-600' : 'bg-slate-600'
                  }`}
                >
                  {alertEnabled ? 'AN' : 'AUS'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Alert Zone */}
        {alertFlights.length > 0 && (
          <div className="alert-pulse bg-red-900/50 border-2 border-red-500 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">🚨</span>
              <div>
                <span className="font-bold text-red-300 text-lg">
                  FLUGZEUG ÜBER DIR!
                </span>
                <div className="text-sm text-red-200">
                  {alertFlights.length} {alertFlights.length === 1 ? 'Flieger' : 'Flieger'} im {ALERT_RADIUS_KM}km Radius
                </div>
              </div>
            </div>
            {alertFlights.slice(0, 3).map(flight => (
              <div key={flight.hex} className="bg-red-950/50 rounded-lg p-3 mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
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
              </div>
            ))}
          </div>
        )}

        {/* Closest Flight (if not in alert) */}
        {closestFlight && !closestFlight.isInAlertZone && (
          <div className="bg-slate-800 rounded-xl p-4 mb-4 border border-slate-700">
            <div className="text-sm text-gray-400 mb-2">Nächstes Flugzeug</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`${closestFlight.color} px-2 py-1 rounded font-bold`}>
                  {closestFlight.callsign}
                </span>
                <span className="text-gray-300">{closestFlight.name}</span>
                {closestFlight.isLanding && (
                  <span className="px-2 py-0.5 bg-orange-600 rounded text-xs">→ STR</span>
                )}
                {closestFlight.isApproaching && (
                  <span className="text-green-400 text-xs">↓ nähernd</span>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-400">
                  {closestFlight.distance.toFixed(1)}km
                </div>
                <div className="text-sm text-gray-400">
                  {formatAltitude(closestFlight.altitude)}
                </div>
              </div>
            </div>
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

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin text-4xl mb-2">✈️</div>
            <p className="text-gray-400">Suche Flugzeuge...</p>
          </div>
        )}

        {/* Flight List */}
        <div className="space-y-2 hide-scrollbar">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">
            Flugzeuge im Umkreis ({SEARCH_RADIUS_KM}km)
          </h3>
          
          {flights.slice(0, 15).map(flight => (
            <div 
              key={flight.hex}
              className={`bg-slate-800/80 rounded-lg p-3 border transition ${
                flight.isInAlertZone 
                  ? 'border-red-500 bg-red-900/20' 
                  : flight.isLanding 
                    ? 'border-orange-500/50' 
                    : 'border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
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
          ))}
        </div>

        {flights.length > 15 && (
          <div className="text-center mt-4 text-gray-500 text-sm">
            + {flights.length - 15} weitere
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-600 space-y-1">
          <div>Daten: ADSB.lol (ODbL) • Update: {REFRESH_INTERVAL/1000}s</div>
          {lastUpdate && (
            <div>Letztes Update: {lastUpdate.toLocaleTimeString('de-DE')}</div>
          )}
        </div>
      </div>
    </div>
  )
}
