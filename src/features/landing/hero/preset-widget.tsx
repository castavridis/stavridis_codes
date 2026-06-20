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
      // Scroll the WINDOW, not via scrollIntoView. The landing page root
      // has `overflow-hidden` (used by the Colophon breakout); some
      // browsers treat that as a scroll container and set ITS scrollTop
      // in response to scrollIntoView, which shifts content within the
      // clip and "destroys" the top padding / reveals empty bands at
      // the bottom. The wash canvas is at the top of the page, so a
      // window scrollTo(0) lands you there cleanly.
      window.scrollTo({ top: 0, behavior: "smooth" });
      // Wait for the smooth-scroll to start before kicking off the reset
      // animation so the user sees the canvas wipe AT the canvas, not as
      // they're still scrolling past the testimonial.
      window.setTimeout(() => {
        triggerReset();
        cb();
      }, 220);
    } else {
      // No scroll target — we're already at the canvas (e.g. the
      // paint-mode instance sitting directly under the wash). Still
      // reset the visualization; just skip the scroll. PR 4c-paint-4.
      triggerReset();
      cb();
    }
  };

  // slot 0 = "now"; 1..3 = the sunrise / mid-day / sunset forecast rows.
  const f = slot > 0 ? forecast[slot - 1] : null;

  // Connecting text styling — solid confetti-black on cream paper. The
  // earlier mix-blend-difference approach broke when the widget's
  // animated.div wrapper hit opacity < 1 mid-transition: opacity creates
  // a stacking context that isolates blend-mode, so the text would
  // briefly render as raw washes-paper (cream-on-cream → invisible).
  const textClass =
    "text-confetti-black font-mono text-[12px] leading-[24px]";

  // Desktop layout (Figma node 4014:43167) is a single horizontal row:
  //   [Location] is where I'm based. It's currently [Time], NN°F and [Weather].
  // Mobile (< 768px) keeps the two-row stack because the full sentence
  // overflows narrow screens. `whitespace-nowrap` on every chip + connector
  // prevents browser word-wrap inside the row at desktop widths.
  return (
    <div
      className={`font-mono flex items-center rounded-md text-[12px] leading-[24px] ${
        isMobile ? "flex-col gap-[6px]" : "flex-row flex-nowrap gap-[6px] whitespace-nowrap"
      }`}
    >
      <div className="flex items-center gap-[6px] whitespace-nowrap">
        <PresetBug
          onClick={wrapHandler(onLocation)}
          label={`Change location (currently ${location.city})`}
        >
          {location.city}
        </PresetBug>
        <span className={textClass}>{location.phrase}</span>
      </div>

      {f ? (
        <div className="flex items-center gap-[6px] whitespace-nowrap">
          <span className={textClass}>At</span>
          <PresetBug
            onClick={wrapHandler(onTime)}
            label={`Show the next time (now showing ${f.label})`}
          >
            {isMobile ? `${f.time}` : `${f.time} (${f.label.toLowerCase()})`}
          </PresetBug>
          <span className={textClass}>it will be {f.temp}°F and</span>
          <PresetBug
            onClick={wrapHandler(onWeather)}
            label={`Change weather (currently ${weatherLabel(f.weather, f.phase)})`}
          >
            {weatherLabel(f.weather, f.phase)}
          </PresetBug>
          <span className={textClass}>.</span>
        </div>
      ) : (
        <div className="flex items-center gap-[6px] whitespace-nowrap">
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
