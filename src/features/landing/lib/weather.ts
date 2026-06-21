// ---------------------------------------------------------------------------
// Weather / time domain — powers the preset widget and seeds the hero's live
// Washes canvas. Locations, the Open-Meteo forecast model, day-phase
// classification, and the location-aware clock all live here.
//
// Annotation (Location selector): cycles through four places, each with its
// own descriptive phrase; default Saint Louis, MO. Clicking resets the Washes
// canvas — the canvas should quickly fade out and fade back in.
// Annotation (Weather selector): "Use Open Meteo API to pull in data."
// ---------------------------------------------------------------------------

import { CREAM } from "./colors.js";

export type LocationInfo = {
  city: string;
  phrase: string;
  lat: number;
  lon: number;
  fallbackTemp: number;
  fallbackWeather: WeatherKey;
  // UTC offset used only when the Open-Meteo lookup is unavailable; the live
  // fetch (timezone=auto) returns the real, DST-correct offset.
  fallbackOffsetSec: number;
};

export const LOCATIONS: LocationInfo[] = [
  {
    city: "Saint Louis, MO",
    phrase: ", where I’m based.",
    lat: 38.627,
    lon: -90.199,
    fallbackTemp: 72,
    fallbackWeather: "sunny",
    fallbackOffsetSec: -18000,
  },
  {
    city: "Prescott, AZ",
    phrase: ", where I grew up.",
    lat: 34.54,
    lon: -112.468,
    fallbackTemp: 64,
    fallbackWeather: "sunny",
    fallbackOffsetSec: -25200,
  },
  {
    city: "Osaka, Japan",
    phrase: ", where my heart is.",
    lat: 34.694,
    lon: 135.502,
    fallbackTemp: 70,
    fallbackWeather: "cloudy",
    fallbackOffsetSec: 32400,
  },
  {
    city: "Taipei, Taiwan",
    phrase: ", where I see myself retiring.",
    lat: 25.033,
    lon: 121.565,
    fallbackTemp: 81,
    fallbackWeather: "rainy",
    fallbackOffsetSec: 28800,
  },
];

export type WeatherKey = "sunny" | "cloudy" | "rainy" | "stormy" | "snowy";
// Weather drives the atmospheric *animation* overlay only. The *background*
// time-wash is chosen by the local day phase (see DayPhase below), per the
// Time Selector annotation.
export const WEATHER_PRESETS: Record<
  WeatherKey,
  { label: string; animation: string }
> = {
  sunny: { label: "sunny", animation: "sunny" },
  cloudy: { label: "cloudy", animation: "partlyCloudy" },
  rainy: { label: "rainy", animation: "rainy" },
  stormy: { label: "stormy", animation: "thunderstorm" },
  snowy: { label: "snowy", animation: "snowing" },
};
export const WEATHER_ORDER: WeatherKey[] = [
  "sunny",
  "cloudy",
  "rainy",
  "stormy",
  "snowy",
];

// Map an Open-Meteo WMO weather code to one of our animation presets.
export function weatherFromCode(code: number): WeatherKey {
  if (code === 0) return "sunny";
  if (code <= 48) return "cloudy";
  if (code >= 71 && code <= 77) return "snowy";
  if (code === 85 || code === 86) return "snowy";
  if (code >= 95) return "stormy";
  return "rainy";
}

// The widget label for the current weather. After sunset (night phase) a clear
// sky reads as "clear" rather than "sunny".
export function weatherLabel(weather: WeatherKey, dayPhase: DayPhase): string {
  if (weather === "sunny" && dayPhase === "night") return "clear";
  return WEATHER_PRESETS[weather].label;
}

// Annotation (Time Selector): the background visualization tracks the selected
// location's local day phase, derived from Open-Meteo's sunrise/sunset. Each
// phase maps to one of the Washes time-wash backgrounds (TIME_WASHES).
export type DayPhase = "sunrise" | "day" | "sunset" | "night";
export const DAY_PHASE_BACKGROUND: Record<DayPhase, string> = {
  sunrise: "dawn",
  day: "day",
  sunset: "sunset",
  night: "night",
};

// Paper tint per day phase, applied to both the Washes paper color and the
// canvas background color.
export const DAY_PHASE_PAPER: Record<DayPhase, string> = {
  sunrise: "#fdf3c8", // pastel yellow
  day: CREAM,
  sunset: "#f9d0e3", // pastel rose
  night: "#c8eaf0", // pastel blue
};

export type SunTimes = { sunriseMin: number; sunsetMin: number };
// Generic fallback (≈6:00 sunrise / ≈19:30 sunset) when the lookup is offline.
export const FALLBACK_SUN: SunTimes = {
  sunriseMin: 6 * 60,
  sunsetMin: 19 * 60 + 30,
};

// Minutes-since-midnight from an Open-Meteo local ISO time ("...THH:MM").
export function isoToMinutes(iso: string | undefined): number | null {
  if (!iso) return null;
  const m = /T(\d{2}):(\d{2})/.exec(iso);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

// Classify a local time (minutes since midnight) into a day phase, using a
// transition window straddling sunrise and sunset.
export function dayPhaseFor(nowMin: number, sun: SunTimes): DayPhase {
  const W = 75; // minutes on each side of sunrise/sunset
  if (nowMin < sun.sunriseMin) return "night";
  if (nowMin < sun.sunriseMin + W) return "sunrise";
  if (nowMin < sun.sunsetMin - W) return "day";
  if (nowMin < sun.sunsetMin + W) return "sunset";
  return "night";
}

// The location's current wall-clock minutes-since-midnight, given its UTC
// offset (null → the viewer's own local time).
export function localMinutes(offsetSec: number | null): number {
  if (offsetSec == null) {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }
  const d = new Date(Date.now() + offsetSec * 1000);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

// One forecast row: a day-phase, the time it occurs, and the predicted
// conditions there (from Open-Meteo hourly data, within the next 24h).
export type PhaseForecast = {
  phase: DayPhase;
  label: string;
  time: string;
  temp: number;
  weather: WeatherKey;
};

export function formatHourMinute(h: number, min: number): string {
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(min).padStart(2, "0")} ${ampm}`;
}

// Format a local "...THH:MM" ISO time as "7:05 AM".
export function formatIsoTime(iso: string): string {
  const m = /T(\d{2}):(\d{2})/.exec(iso);
  return m ? formatHourMinute(Number(m[1]), Number(m[2])) : "";
}

export type ForecastPayload = {
  daily?: { sunrise?: string[]; sunset?: string[] };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    weather_code?: number[];
  };
};

// Build the sunrise / mid-day / sunset forecast. For each phase we take its
// next occurrence within the coming 24h and read the nearest hourly sample.
// Unsuffixed Open-Meteo ISO times are local wall-clock; parsing them as UTC
// (append "Z") makes them comparable to the location's "now".
export function buildForecast(
  data: ForecastPayload,
  offsetSec: number,
): PhaseForecast[] | null {
  const sr = data.daily?.sunrise;
  const ss = data.daily?.sunset;
  const ht = data.hourly?.time;
  const htemp = data.hourly?.temperature_2m;
  const hcode = data.hourly?.weather_code;
  if (!sr || !ss || !ht || !htemp || !hcode || sr.length < 2 || ss.length < 2)
    return null;

  const toVal = (iso: string) => Date.parse(`${iso}Z`);
  const nowVal = Date.now() + offsetSec * 1000;
  const next = (candidates: string[]) =>
    candidates.find((c) => toVal(c) >= nowVal) ??
    candidates[candidates.length - 1];
  const sampleAt = (iso: string) => {
    const target = toVal(iso);
    let best = 0;
    let bestDiff = Infinity;
    for (let i = 0; i < ht.length; i++) {
      const diff = Math.abs(toVal(ht[i]) - target);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = i;
      }
    }
    return { temp: Math.round(htemp[best] ?? 0), code: hcode[best] ?? 0 };
  };
  const noon = (iso: string) => `${iso.slice(0, 10)}T12:00`;
  const midnight = (iso: string) => `${iso.slice(0, 10)}T00:00`;
  const rows: { phase: DayPhase; label: string; iso: string }[] = [
    { phase: 'sunrise', label: 'Sunrise', iso: next([sr[0], sr[1]]) },
    { phase: 'day', label: 'Mid-Day', iso: next([noon(sr[0]), noon(sr[1])]) },
    { phase: 'sunset', label: 'Sunset', iso: next([ss[0], ss[1]]) },
    // Night is represented at local midnight (symmetric to Mid-Day at noon).
    { phase: 'night', label: 'Night', iso: next([midnight(sr[0]), midnight(sr[1])]) },
  ];
  // Order by when each phase next occurs so cycling from "now" advances to the
  // next chronological time (after sunrise → mid-day; after sunset → sunrise).
  rows.sort((a, b) => toVal(a.iso) - toVal(b.iso));
  return rows.map(({ phase, label, iso }) => {
    const { temp, code } = sampleAt(iso);
    return { phase, label, time: formatIsoTime(iso), temp, weather: weatherFromCode(code) };
  });
}

// Offline fallback so the widget always renders three rows.
export function fallbackForecast(loc: LocationInfo): PhaseForecast[] {
  const row = (phase: DayPhase, label: string, min: number): PhaseForecast => ({
    phase,
    label,
    time: formatHourMinute(Math.floor(min / 60), min % 60),
    temp: loc.fallbackTemp,
    weather: loc.fallbackWeather,
  });
  return [
    row('sunrise', 'Sunrise', FALLBACK_SUN.sunriseMin),
    row('day', 'Mid-Day', 12 * 60),
    row('sunset', 'Sunset', FALLBACK_SUN.sunsetMin),
    row('night', 'Night', 0),
  ];
}

// Format the current wall-clock time for a given UTC offset (seconds). When
// `offsetSec` is null we have no location timezone yet, so fall back to the
// viewer's own local time. Shifting the epoch by the offset and reading the
// UTC fields yields the location's local time independent of the browser's tz.
export function formatClock(offsetSec: number | null): string {
  let h: number;
  let m: number;
  if (offsetSec == null) {
    const d = new Date();
    h = d.getHours();
    m = d.getMinutes();
  } else {
    const d = new Date(Date.now() + offsetSec * 1000);
    h = d.getUTCHours();
    m = d.getUTCMinutes();
  }
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}
