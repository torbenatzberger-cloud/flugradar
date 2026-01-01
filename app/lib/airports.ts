// ICAO to Airport name mapping - wichtige europäische Flughäfen
export const AIRPORTS: Record<string, { name: string; city: string; country: string }> = {
  // Deutschland
  'EDDF': { name: 'Frankfurt', city: 'Frankfurt', country: 'DE' },
  'EDDM': { name: 'München', city: 'München', country: 'DE' },
  'EDDB': { name: 'Berlin BER', city: 'Berlin', country: 'DE' },
  'EDDL': { name: 'Düsseldorf', city: 'Düsseldorf', country: 'DE' },
  'EDDH': { name: 'Hamburg', city: 'Hamburg', country: 'DE' },
  'EDDS': { name: 'Stuttgart', city: 'Stuttgart', country: 'DE' },
  'EDDK': { name: 'Köln/Bonn', city: 'Köln', country: 'DE' },
  'EDDV': { name: 'Hannover', city: 'Hannover', country: 'DE' },
  'EDDN': { name: 'Nürnberg', city: 'Nürnberg', country: 'DE' },
  'EDDW': { name: 'Bremen', city: 'Bremen', country: 'DE' },
  'EDDC': { name: 'Dresden', city: 'Dresden', country: 'DE' },
  'EDDP': { name: 'Leipzig', city: 'Leipzig', country: 'DE' },
  'EDDT': { name: 'Berlin Tegel', city: 'Berlin', country: 'DE' },
  'EDFH': { name: 'Frankfurt-Hahn', city: 'Hahn', country: 'DE' },
  'EDLW': { name: 'Dortmund', city: 'Dortmund', country: 'DE' },
  'EDLP': { name: 'Paderborn', city: 'Paderborn', country: 'DE' },
  'EDSB': { name: 'Karlsruhe/Baden', city: 'Karlsruhe', country: 'DE' },
  'EDNY': { name: 'Friedrichshafen', city: 'Friedrichshafen', country: 'DE' },
  'EDJA': { name: 'Memmingen', city: 'Memmingen', country: 'DE' },

  // Österreich
  'LOWW': { name: 'Wien', city: 'Wien', country: 'AT' },
  'LOWS': { name: 'Salzburg', city: 'Salzburg', country: 'AT' },
  'LOWG': { name: 'Graz', city: 'Graz', country: 'AT' },
  'LOWI': { name: 'Innsbruck', city: 'Innsbruck', country: 'AT' },
  'LOWK': { name: 'Klagenfurt', city: 'Klagenfurt', country: 'AT' },
  'LOWL': { name: 'Linz', city: 'Linz', country: 'AT' },

  // Schweiz
  'LSZH': { name: 'Zürich', city: 'Zürich', country: 'CH' },
  'LSGG': { name: 'Genf', city: 'Genf', country: 'CH' },
  'LSZB': { name: 'Bern', city: 'Bern', country: 'CH' },
  'LSZA': { name: 'Lugano', city: 'Lugano', country: 'CH' },
  'LFSB': { name: 'Basel-Mulhouse', city: 'Basel', country: 'CH' },

  // Spanien
  'LEMD': { name: 'Madrid', city: 'Madrid', country: 'ES' },
  'LEBL': { name: 'Barcelona', city: 'Barcelona', country: 'ES' },
  'LEPA': { name: 'Palma de Mallorca', city: 'Mallorca', country: 'ES' },
  'LEMG': { name: 'Málaga', city: 'Málaga', country: 'ES' },
  'LEAL': { name: 'Alicante', city: 'Alicante', country: 'ES' },
  'LEVC': { name: 'Valencia', city: 'Valencia', country: 'ES' },
  'LEZL': { name: 'Sevilla', city: 'Sevilla', country: 'ES' },
  'GCTS': { name: 'Teneriffa Süd', city: 'Teneriffa', country: 'ES' },
  'GCXO': { name: 'Teneriffa Nord', city: 'Teneriffa', country: 'ES' },
  'GCLP': { name: 'Gran Canaria', city: 'Gran Canaria', country: 'ES' },
  'GCFV': { name: 'Fuerteventura', city: 'Fuerteventura', country: 'ES' },
  'GCRR': { name: 'Lanzarote', city: 'Lanzarote', country: 'ES' },
  'LEIB': { name: 'Ibiza', city: 'Ibiza', country: 'ES' },
  'LEMH': { name: 'Menorca', city: 'Menorca', country: 'ES' },

  // Italien
  'LIRF': { name: 'Rom Fiumicino', city: 'Rom', country: 'IT' },
  'LIMC': { name: 'Mailand Malpensa', city: 'Mailand', country: 'IT' },
  'LIME': { name: 'Bergamo', city: 'Bergamo', country: 'IT' },
  'LIPZ': { name: 'Venedig', city: 'Venedig', country: 'IT' },
  'LIRN': { name: 'Neapel', city: 'Neapel', country: 'IT' },
  'LIEA': { name: 'Sardinien Alghero', city: 'Alghero', country: 'IT' },
  'LIEE': { name: 'Sardinien Cagliari', city: 'Cagliari', country: 'IT' },
  'LICJ': { name: 'Palermo', city: 'Palermo', country: 'IT' },
  'LICC': { name: 'Catania', city: 'Catania', country: 'IT' },
  'LIPE': { name: 'Bologna', city: 'Bologna', country: 'IT' },
  'LIML': { name: 'Mailand Linate', city: 'Mailand', country: 'IT' },
  'LIPX': { name: 'Verona', city: 'Verona', country: 'IT' },
  'LIRP': { name: 'Pisa', city: 'Pisa', country: 'IT' },
  'LIRA': { name: 'Rom Ciampino', city: 'Rom', country: 'IT' },

  // Frankreich
  'LFPG': { name: 'Paris CDG', city: 'Paris', country: 'FR' },
  'LFPO': { name: 'Paris Orly', city: 'Paris', country: 'FR' },
  'LFML': { name: 'Marseille', city: 'Marseille', country: 'FR' },
  'LFLL': { name: 'Lyon', city: 'Lyon', country: 'FR' },
  'LFMN': { name: 'Nizza', city: 'Nizza', country: 'FR' },
  'LFBD': { name: 'Bordeaux', city: 'Bordeaux', country: 'FR' },
  'LFBO': { name: 'Toulouse', city: 'Toulouse', country: 'FR' },
  'LFRS': { name: 'Nantes', city: 'Nantes', country: 'FR' },
  'LFST': { name: 'Straßburg', city: 'Straßburg', country: 'FR' },

  // UK
  'EGLL': { name: 'London Heathrow', city: 'London', country: 'GB' },
  'EGKK': { name: 'London Gatwick', city: 'London', country: 'GB' },
  'EGSS': { name: 'London Stansted', city: 'London', country: 'GB' },
  'EGGW': { name: 'London Luton', city: 'London', country: 'GB' },
  'EGLC': { name: 'London City', city: 'London', country: 'GB' },
  'EGCC': { name: 'Manchester', city: 'Manchester', country: 'GB' },
  'EGBB': { name: 'Birmingham', city: 'Birmingham', country: 'GB' },
  'EGPH': { name: 'Edinburgh', city: 'Edinburgh', country: 'GB' },
  'EGPF': { name: 'Glasgow', city: 'Glasgow', country: 'GB' },
  'EGGD': { name: 'Bristol', city: 'Bristol', country: 'GB' },

  // Niederlande
  'EHAM': { name: 'Amsterdam', city: 'Amsterdam', country: 'NL' },
  'EHRD': { name: 'Rotterdam', city: 'Rotterdam', country: 'NL' },
  'EHEH': { name: 'Eindhoven', city: 'Eindhoven', country: 'NL' },

  // Belgien
  'EBBR': { name: 'Brüssel', city: 'Brüssel', country: 'BE' },
  'EBCI': { name: 'Charleroi', city: 'Charleroi', country: 'BE' },

  // Portugal
  'LPPT': { name: 'Lissabon', city: 'Lissabon', country: 'PT' },
  'LPPR': { name: 'Porto', city: 'Porto', country: 'PT' },
  'LPFR': { name: 'Faro', city: 'Faro', country: 'PT' },
  'LPMA': { name: 'Madeira', city: 'Funchal', country: 'PT' },

  // Griechenland
  'LGAV': { name: 'Athen', city: 'Athen', country: 'GR' },
  'LGTS': { name: 'Thessaloniki', city: 'Thessaloniki', country: 'GR' },
  'LGIR': { name: 'Heraklion', city: 'Kreta', country: 'GR' },
  'LGKO': { name: 'Kos', city: 'Kos', country: 'GR' },
  'LGRP': { name: 'Rhodos', city: 'Rhodos', country: 'GR' },
  'LGSR': { name: 'Santorini', city: 'Santorini', country: 'GR' },
  'LGMK': { name: 'Mykonos', city: 'Mykonos', country: 'GR' },
  'LGKR': { name: 'Korfu', city: 'Korfu', country: 'GR' },

  // Türkei
  'LTFM': { name: 'Istanbul', city: 'Istanbul', country: 'TR' },
  'LTBA': { name: 'Istanbul Atatürk', city: 'Istanbul', country: 'TR' },
  'LTAC': { name: 'Ankara', city: 'Ankara', country: 'TR' },
  'LTBJ': { name: 'Izmir', city: 'Izmir', country: 'TR' },
  'LTAI': { name: 'Antalya', city: 'Antalya', country: 'TR' },
  'LTFE': { name: 'Dalaman', city: 'Dalaman', country: 'TR' },
  'LTFJ': { name: 'Istanbul Sabiha', city: 'Istanbul', country: 'TR' },

  // Skandinavien
  'EKCH': { name: 'Kopenhagen', city: 'Kopenhagen', country: 'DK' },
  'ESSA': { name: 'Stockholm Arlanda', city: 'Stockholm', country: 'SE' },
  'ENGM': { name: 'Oslo', city: 'Oslo', country: 'NO' },
  'EFHK': { name: 'Helsinki', city: 'Helsinki', country: 'FI' },

  // Polen
  'EPWA': { name: 'Warschau', city: 'Warschau', country: 'PL' },
  'EPKK': { name: 'Krakau', city: 'Krakau', country: 'PL' },
  'EPGD': { name: 'Danzig', city: 'Danzig', country: 'PL' },
  'EPWR': { name: 'Breslau', city: 'Breslau', country: 'PL' },

  // Tschechien
  'LKPR': { name: 'Prag', city: 'Prag', country: 'CZ' },

  // Ungarn
  'LHBP': { name: 'Budapest', city: 'Budapest', country: 'HU' },

  // Kroatien
  'LDZA': { name: 'Zagreb', city: 'Zagreb', country: 'HR' },
  'LDSP': { name: 'Split', city: 'Split', country: 'HR' },
  'LDDU': { name: 'Dubrovnik', city: 'Dubrovnik', country: 'HR' },

  // Irland
  'EIDW': { name: 'Dublin', city: 'Dublin', country: 'IE' },

  // Ägypten
  'HECA': { name: 'Kairo', city: 'Kairo', country: 'EG' },
  'HEGN': { name: 'Hurghada', city: 'Hurghada', country: 'EG' },
  'HESH': { name: 'Sharm el-Sheikh', city: 'Sharm el-Sheikh', country: 'EG' },

  // VAE
  'OMDB': { name: 'Dubai', city: 'Dubai', country: 'AE' },
  'OMAA': { name: 'Abu Dhabi', city: 'Abu Dhabi', country: 'AE' },

  // USA (wichtigste)
  'KJFK': { name: 'New York JFK', city: 'New York', country: 'US' },
  'KEWR': { name: 'New York Newark', city: 'New York', country: 'US' },
  'KLGA': { name: 'New York LaGuardia', city: 'New York', country: 'US' },
  'KLAX': { name: 'Los Angeles', city: 'Los Angeles', country: 'US' },
  'KORD': { name: 'Chicago', city: 'Chicago', country: 'US' },
  'KSFO': { name: 'San Francisco', city: 'San Francisco', country: 'US' },
  'KMIA': { name: 'Miami', city: 'Miami', country: 'US' },
  'KATL': { name: 'Atlanta', city: 'Atlanta', country: 'US' },
  'KDFW': { name: 'Dallas', city: 'Dallas', country: 'US' },
  'KBOS': { name: 'Boston', city: 'Boston', country: 'US' },

  // Asien (wichtigste)
  'VHHH': { name: 'Hong Kong', city: 'Hong Kong', country: 'HK' },
  'WSSS': { name: 'Singapur', city: 'Singapur', country: 'SG' },
  'VTBS': { name: 'Bangkok', city: 'Bangkok', country: 'TH' },
  'RJTT': { name: 'Tokyo Haneda', city: 'Tokyo', country: 'JP' },
  'RJAA': { name: 'Tokyo Narita', city: 'Tokyo', country: 'JP' },
  'ZBAA': { name: 'Peking', city: 'Peking', country: 'CN' },
  'ZSPD': { name: 'Shanghai', city: 'Shanghai', country: 'CN' },
  'RKSI': { name: 'Seoul Incheon', city: 'Seoul', country: 'KR' },
  'VIDP': { name: 'Delhi', city: 'Delhi', country: 'IN' },
  'VABB': { name: 'Mumbai', city: 'Mumbai', country: 'IN' },
}

export function getAirportName(icao: string | null): string {
  if (!icao) return 'Unbekannt'
  const airport = AIRPORTS[icao.toUpperCase()]
  return airport ? airport.name : icao
}

export function getAirportCity(icao: string | null): string {
  if (!icao) return 'Unbekannt'
  const airport = AIRPORTS[icao.toUpperCase()]
  return airport ? airport.city : icao
}

export function getAirportInfo(icao: string | null): { name: string; city: string; country: string } | null {
  if (!icao) return null
  return AIRPORTS[icao.toUpperCase()] || null
}
