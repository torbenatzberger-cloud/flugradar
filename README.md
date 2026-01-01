# ✈️ Flugradar Holzgerlingen

Live Flugzeug-Tracker für die Einflugschneise Stuttgart (STR).

![Demo](https://img.shields.io/badge/Status-Live-green)

## Features

- 🛫 **Live Flugdaten** via ADSB.lol API (kostenlos, keine Limits)
- 🚨 **2km Alert-Zone** mit Sound-Benachrichtigung
- 📍 **GPS-Standort** oder manuelle Koordinaten
- 🌙 **Alert-Only Modus** für Alexa Show / Raspberry Pi Display
- ✈️ **Airline-Erkennung** (Lufthansa, Eurowings, Ryanair, etc.)
- 📊 **Live Stats**: Flugzeuge im Anflug auf STR, nähernde Flieger

## URLs

- `/` - Vollständiges Radar mit allen Infos
- `/alert` - Alert-Only Modus (schwarzer Screen, nur Alerts)

## Deployment auf Vercel

### 1. Repository auf GitHub erstellen

```bash
# Im Projektordner
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/DEIN-USERNAME/flight-radar.git
git push -u origin main
```

### 2. Mit Vercel verbinden

1. Gehe zu [vercel.com](https://vercel.com)
2. "Add New Project"
3. Importiere dein GitHub Repository
4. Framework: **Next.js** (wird automatisch erkannt)
5. Deploy!

### 3. Fertig!

Deine App ist jetzt live unter `https://flight-radar-xxx.vercel.app`

## Lokale Entwicklung

```bash
# Dependencies installieren
npm install

# Dev Server starten
npm run dev

# Öffne http://localhost:3000
```

## Konfiguration

Die Standardkoordinaten sind für **Werastraße 18, Holzgerlingen** eingestellt:

```typescript
// In app/page.tsx und app/alert/page.tsx
const DEFAULT_LOCATION = { lat: 48.6406, lon: 9.0118, name: 'Holzgerlingen' }
```

Weitere Einstellungen:
- `ALERT_RADIUS_KM` - Alert-Zone (Standard: 2km)
- `SEARCH_RADIUS_KM` - Suchradius (Standard: 30km)
- `REFRESH_INTERVAL` - Update-Intervall (Standard: 8000ms)

## Für Alexa Show / Raspberry Pi

1. Öffne die `/alert` URL im Fullscreen-Browser
2. Der Screen bleibt schwarz und zeigt nur Alerts
3. Sound spielt bei jedem NEUEN Flieger in der Zone
4. Alert verschwindet nach 15 Sekunden automatisch

### Raspberry Pi Kiosk Setup

```bash
# Chromium im Kiosk-Modus starten
chromium-browser --kiosk --noerrdialogs --disable-infobars \
  https://deine-url.vercel.app/alert
```

## API

Daten von [ADSB.lol](https://api.adsb.lol) - Open Database License (ODbL)

- Kostenlos
- Keine API-Keys nötig
- Keine Rate Limits
- Weltweite ADS-B Daten

## Tech Stack

- Next.js 14
- React 18
- Tailwind CSS
- TypeScript

---

Made with ☕ für die Einflugschneise Stuttgart
