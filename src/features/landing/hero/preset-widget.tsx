// ---------------------------------------------------------------------------
// Preset widget — "Saint Louis, MO is where I'm based. / It's currently
// 9:52 AM 72°F and sunny."
//
// Centered below the v2 Washes canvas. Bug chips cycle location, time, and
// weather; each click additionally:
//   1. Scrolls the page up to the Washes canvas (smooth).
//   2. Bumps the paint store's `resetVersion`, which kicks off the canvas's
//      fade-out → clear → reseed → fade-in cycle.
//
// The existing `onLocation`/`onTime`/`onWeather` callbacks still fire — the
// scroll + reset are additive side effects, so the hero (which also still
// uses this widget) keeps working unchanged.
//
// Annotation (Figma `Location / Time / Weather Selectors`): "Clicking
// Location, Time, or Weather scrolls up to the Washes canvas and then
// resets the visualization."
// ---------------------------------------------------------------------------

import { useState } from "react";
import {
  weatherLabel,
  type DayPhase,
  type LocationInfo,
  type PhaseForecast,
  type WeatherKey,
} from "../lib/weather.js";
import { usePaintStore } from "../../../lib/paint-store.js";

// A non-interactive "bug" chip — used for the read-only forecast values.
function DisplayBug({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <span className="bg-confetti-black text-caresignal-white inline-flex items-center rounded-[4px] px-[8px]">
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
  scrollTargetRef,
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
  // Optional — when provided, clicking a bug scrolls smoothly to this
  // element AND bumps the canvas reset version. The hero passes nothing
  // (it uses its own in-place wipe).
  scrollTargetRef?: React.RefObject<HTMLDivElement | null>;
}): React.ReactElement {
  const [isMobile] = useState(() =>
    window.matchMedia("(max-width: 767px)").matches,
  );
  const triggerReset = usePaintStore((s) => s.triggerReset);

  const wrapHandler = (cb: () => void) => () => {
    if (scrollTargetRef?.current) {
      scrollTargetRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      // Wait for the smooth-scroll to start before kicking off the reset
      // animation so the user sees the canvas wipe AT the canvas, not as
      // they're still scrolling past the testimonial.
      window.setTimeout(() => {
        triggerReset();
        cb();
      }, 220);
    } else {
      cb();
    }
  };

  // slot 0 = "now"; 1..3 = the sunrise / mid-day / sunset forecast rows.
  const f = slot > 0 ? forecast[slot - 1] : null;

  // Connecting text styling — mix-blend-difference against confetti-black bg
  // gives the inverted-cream effect from the new Figma.
  const textClass =
    "text-washes-paper mix-blend-difference font-mono text-[12px] leading-[24px]";

  return (
    <div className="font-mono flex flex-col items-center gap-[6px] rounded-md text-[12px] leading-[24px]">
      <div className="flex items-center gap-[6px]">
        <PresetBug
          onClick={wrapHandler(onLocation)}
          label={`Change location (currently ${location.city})`}
        >
          {location.city}
        </PresetBug>
        <span className={textClass}>{location.phrase}</span>
      </div>

      {f ? (
        <div className="flex items-center gap-[6px]">
          <span className={textClass}>At</span>
          <PresetBug
            onClick={wrapHandler(onTime)}
            label={`Show the next time (now showing ${f.label})`}
          >
            {isMobile ? `${f.time}` : `${f.time} (${f.label.toLowerCase()})`}
          </PresetBug>
          <span className={textClass}>it will be {f.temp}°F and</span>
          <DisplayBug>{weatherLabel(f.weather, f.phase)}</DisplayBug>
          <span className={textClass}>.</span>
        </div>
      ) : (
        <div className="flex items-center gap-[6px]">
          <span className={textClass}>It’s currently</span>
          <PresetBug
            onClick={wrapHandler(onTime)}
            label="Show the next forecast time"
          >
            {time}
          </PresetBug>
          <span className={textClass}>, {temp}°F and</span>
          <PresetBug
            onClick={wrapHandler(onWeather)}
            label={`Change weather (currently ${weatherLabel(weather, dayPhase)})`}
          >
            {weatherLabel(weather, dayPhase)}
          </PresetBug>
          <span className={textClass}>.</span>
        </div>
      )}
    </div>
  );
}

function PresetBug({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="bg-confetti-black text-caresignal-white font-mono inline-flex items-center rounded-[4px] px-[8px] text-[12px] leading-[24px] transition-transform hover:-translate-y-[1px]"
    >
      {children}
    </button>
  );
}
