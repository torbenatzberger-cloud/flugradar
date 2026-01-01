'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

interface FlightMapProps {
  flights: Flight[]
  userLocation: { lat: number; lon: number }
  alertRadius: number
  searchRadius: number
  onFlightClick: (flight: Flight) => void
}

export default function FlightMap({
  flights,
  userLocation,
  alertRadius,
  searchRadius,
  onFlightClick,
}: FlightMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const circlesRef = useRef<L.Circle[]>([])
  const userMarkerRef = useRef<L.Marker | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Only render on client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Initialize map
  useEffect(() => {
    if (!isClient || !mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current).setView(
      [userLocation.lat, userLocation.lon],
      11
    )

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OSM',
      maxZoom: 18,
    }).addTo(map)

    // User location marker
    const userIcon = L.divIcon({
      className: 'user-marker',
      html: '<div style="width: 16px; height: 16px; background: #3b82f6; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })

    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lon], {
      icon: userIcon,
    })
      .addTo(map)
      .bindPopup('Dein Standort')

    // Alert zone circle (red)
    const alertCircle = L.circle([userLocation.lat, userLocation.lon], {
      radius: alertRadius * 1000,
      color: '#ef4444',
      fillColor: '#ef4444',
      fillOpacity: 0.1,
      weight: 2,
    }).addTo(map)

    // Search radius circle (blue, dashed)
    const searchCircle = L.circle([userLocation.lat, userLocation.lon], {
      radius: searchRadius * 1000,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.05,
      weight: 1,
      dashArray: '5, 10',
    }).addTo(map)

    circlesRef.current = [alertCircle, searchCircle]
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [isClient, userLocation.lat, userLocation.lon, alertRadius, searchRadius])

  // Update user location and circles when location changes
  useEffect(() => {
    if (!mapRef.current || !userMarkerRef.current) return

    mapRef.current.setView([userLocation.lat, userLocation.lon], 11)
    userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lon])

    // Update circle positions
    circlesRef.current.forEach((circle) => {
      circle.setLatLng([userLocation.lat, userLocation.lon])
    })
  }, [userLocation.lat, userLocation.lon])

  // Update flight markers
  useEffect(() => {
    if (!mapRef.current) return

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    // Add flight markers
    flights.forEach((flight) => {
      const rotation = flight.heading || 0
      const isAlert = flight.isInAlertZone

      const planeIcon = L.divIcon({
        className: 'flight-marker',
        html: `
          <div style="
            transform: rotate(${rotation}deg);
            cursor: pointer;
            font-size: 20px;
            color: ${isAlert ? '#ef4444' : '#facc15'};
            text-shadow: 0 1px 2px rgba(0,0,0,0.5);
          ">✈</div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

      const marker = L.marker([flight.lat, flight.lon], { icon: planeIcon })
        .addTo(mapRef.current!)
        .bindTooltip(
          `${flight.callsign} • ${flight.distance.toFixed(1)}km`,
          {
            permanent: false,
            direction: 'top',
            offset: [0, -10],
          }
        )

      marker.on('click', () => onFlightClick(flight))
      markersRef.current.push(marker)
    })
  }, [flights, onFlightClick])

  if (!isClient) {
    return (
      <div className="h-64 md:h-80 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
        <span className="text-gray-400">Lade Karte...</span>
      </div>
    )
  }

  return (
    <div
      ref={mapContainerRef}
      className="h-64 md:h-80 rounded-xl overflow-hidden border border-slate-700"
    />
  )
}
