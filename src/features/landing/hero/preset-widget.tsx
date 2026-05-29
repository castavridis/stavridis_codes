// ---------------------------------------------------------------------------
// Preset widget — "Saint Louis, MO is where I'm based. / It's currently
// 9:52 AM 72°F and sunny."
//
// Centered on the dark band below the hero; its bugs cycle location, time, and
// weather, which re-seed the hero's live Washes canvas.
// ---------------------------------------------------------------------------

import { useState } from "react";
import {
  weatherLabel,
  type DayPhase,
  type LocationInfo,
  type PhaseForecast,
  type WeatherKey,
} from "../lib/weather.js";

// A non-interactive "bug" chip — used for the read-only forecast values.
function DisplayBug({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <span className="inline-flex items-center rounded-[4px] bg-[#4f3d1b] px-[8px] text-[#fbf6ea]">
      {children}
    </span>
  );
}

export function PresetWidget({
  location,
  slot,
  time,
  temp,
  weather,
  dayPhase,
  forecast,
  onLocation,
  onTime,
  onWeather,
}: {
  location: LocationInfo;
  slot: number;
  time: string;
  temp: number;
  weather: WeatherKey;
  dayPhase: DayPhase;
  forecast: PhaseForecast[];
  onLocation: () => void;
  onTime: () => void;
  onWeather: () => void;
}): React.ReactElement {
  const [isMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  // slot 0 = "now"; 1..3 = the sunrise / mid-day / sunset forecast rows.
  const f = slot > 0 ? forecast[slot - 1] : null;
  return (
    <div className="flex flex-col items-center gap-[6px] px-[16px] py-[12px] font-mono text-[12px] leading-[24px] opacity-60 bg-[rgb(37,25,0)] rounded-md">
      <div className="flex items-center gap-[6px]">
        <PresetBug
          background="#4f3d1b"
          onClick={onLocation}
          label={`Change location (currently ${location.city})`}
        >
          {location.city}
        </PresetBug>
        <span className="text-[#fbf6ea] mix-blend-difference">
          {location.phrase}
        </span>
      </div>

      {f ? (
        <div className="flex items-center gap-[6px]">
          <span className="text-[#fbf6ea] mix-blend-difference">At</span>
          <PresetBug
            background="#4f3d1b"
            onClick={onTime}
            label={`Show the next time (now showing ${f.label})`}
          >
            {
              isMobile
               ? `${f.time}`
               : `${f.time} (${f.label.toLowerCase()})`
            }
          </PresetBug>
          <span className="text-[#fbf6ea] mix-blend-difference">
            it will be {f.temp}°F and
          </span>
          <DisplayBug>{weatherLabel(f.weather, f.phase)}</DisplayBug>
          <span className="text-[#fbf6ea] mix-blend-difference">.</span>
        </div>
      ) : (
        <div className="flex items-center gap-[6px]">
          <span className="text-[#fbf6ea] mix-blend-difference">
            It’s currently
          </span>
          <PresetBug
            background="#4f3d1b"
            onClick={onTime}
            label="Show the next forecast time"
          >
            {time}
          </PresetBug>
          <span className="text-[#fbf6ea] mix-blend-difference">
            , {temp}°F and
          </span>
          <PresetBug
            background="#4f3d1b"
            onClick={onWeather}
            label={`Change weather (currently ${weatherLabel(weather, dayPhase)})`}
          >
            {weatherLabel(weather, dayPhase)}
          </PresetBug>
          <span className="text-[#fbf6ea] mix-blend-difference">.</span>
        </div>
      )}
    </div>
  );
}

function PresetBug({
  background,
  onClick,
  label,
  children,
}: {
  background: string;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex items-center rounded-[4px] px-[8px] font-mono text-[12px] leading-[24px] text-[#fbf6ea] transition-transform hover:-translate-y-[1px]"
      style={{ backgroundColor: background }}
    >
      {children}
    </button>
  );
}
