'use client'

import { getAircraftTypeName } from '../lib/aircraftTypes'
import { getAirportName } from '../lib/airports'

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

interface FlightDetailModalProps {
  flight: Flight | null
  origin: string | null
  originName: string | null
  destination: string | null
  destinationName: string | null
  onClose: () => void
}

export default function FlightDetailModal({
  flight,
  origin,
  originName,
  destination,
  destinationName,
  onClose,
}: FlightDetailModalProps) {
  if (!flight) return null

  const formatAltitude = (meters: number | null): string => {
    if (!meters) return '-'
    const feet = Math.round(meters * 3.28084)
    return `${feet.toLocaleString('de-DE')} ft`
  }

  const formatSpeed = (knots: number | null): string => {
    if (!knots) return '-'
    return `${Math.round(knots)} kts`
  }

  const formatVerticalRate = (fpm: number | null): string => {
    if (!fpm) return '-'
    const sign = fpm > 0 ? '+' : ''
    return `${sign}${Math.round(fpm)} ft/min`
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 z-[9999] flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-800 p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`${flight.color} px-3 py-1 rounded font-bold text-lg`}
            >
              {flight.callsign}
            </span>
            <span className="text-gray-300">{flight.name}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition text-gray-400"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Route Info */}
          {(originName || destinationName) && (
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                {/* Von */}
                <div className="text-center flex-1">
                  <div className="text-xs text-gray-500 mb-1">Von</div>
                  <div className="text-lg font-bold">{originName || 'Unbekannt'}</div>
                  {origin && <div className="text-xs text-gray-500 font-mono">{origin}</div>}
                </div>

                {/* Pfeil */}
                <div className="px-4 text-2xl text-gray-500">✈</div>

                {/* Nach */}
                <div className="text-center flex-1">
                  <div className="text-xs text-gray-500 mb-1">Nach</div>
                  <div className="text-lg font-bold text-yellow-400">{destinationName || 'Unbekannt'}</div>
                  {destination && <div className="text-xs text-gray-500 font-mono">{destination}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Aircraft Info */}
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-2">Flugzeug</div>
            <div className="text-lg font-semibold">
              {getAircraftTypeName(flight.type)}
            </div>
            {flight.registration && (
              <div className="text-gray-400 font-mono mt-1">
                {flight.registration}
              </div>
            )}
          </div>

          {/* Flight Data Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/50 rounded-lg p-3">
              <div className="text-xs text-gray-500">Höhe</div>
              <div className="text-lg font-semibold">
                {formatAltitude(flight.altitude)}
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3">
              <div className="text-xs text-gray-500">Geschwindigkeit</div>
              <div className="text-lg font-semibold">
                {formatSpeed(flight.speed)}
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3">
              <div className="text-xs text-gray-500">Kurs</div>
              <div className="text-lg font-semibold">
                {flight.heading ? `${Math.round(flight.heading)}°` : '-'}
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3">
              <div className="text-xs text-gray-500">Vertikalrate</div>
              <div
                className={`text-lg font-semibold ${
                  flight.isDescending
                    ? 'text-orange-400'
                    : flight.verticalRate && flight.verticalRate > 200
                      ? 'text-green-400'
                      : ''
                }`}
              >
                {formatVerticalRate(flight.verticalRate)}
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-slate-900/50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Entfernung</span>
              <span className="font-mono">{flight.distance.toFixed(2)} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">ICAO Hex</span>
              <span className="font-mono uppercase">{flight.hex}</span>
            </div>
            {flight.squawk && (
              <div className="flex justify-between">
                <span className="text-gray-400">Squawk</span>
                <span className="font-mono">{flight.squawk}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">Position</span>
              <span className="font-mono">
                {flight.lat.toFixed(4)}, {flight.lon.toFixed(4)}
              </span>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            {flight.isInAlertZone && (
              <span className="px-3 py-1 bg-red-600 rounded-full text-sm">
                In Alert Zone
              </span>
            )}
            {flight.isLanding && (
              <span className="px-3 py-1 bg-orange-600 rounded-full text-sm">
                Im Anflug
              </span>
            )}
            {flight.isApproaching && (
              <span className="px-3 py-1 bg-green-600 rounded-full text-sm">
                Kommt näher
              </span>
            )}
            {flight.isDescending && (
              <span className="px-3 py-1 bg-yellow-600 rounded-full text-sm">
                Sinkflug
              </span>
            )}
          </div>

          {/* External Links */}
          <div className="flex gap-2 pt-2">
            <a
              href={`https://www.flightradar24.com/${flight.callsign}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-center transition text-sm"
            >
              Flightradar24
            </a>
            <a
              href={`https://globe.adsbexchange.com/?icao=${flight.hex}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-center transition text-sm"
            >
              ADSBexchange
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
