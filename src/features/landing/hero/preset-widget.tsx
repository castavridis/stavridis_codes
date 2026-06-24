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
    <span className="ml-[6px] bg-caresignal-white text-confetti-black inline-flex">
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
  const triggerReset = usePaintStore((s) => s.triggerReset);
  const paintActive = usePaintStore((s) => s.paintActive);
  const setPaintActive = usePaintStore((s) => s.setPaintActive);

  const wrapHandler = (cb: () => void) => () => {
    // Bottom (in-flow) instance + not yet painting → scroll up, open
    // paint mode, then reset the visualization. Once paint mode is open
    // the paint-mode preset widget (above the wash) takes over as the
    // primary, and the bottom one fades back (landing-page handles the
    // opacity transition tied to paintActive).
    if (scrollTargetRef?.current && !paintActive) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.setTimeout(() => {
        setPaintActive(true);
        triggerReset();
        cb();
      }, 220);
      return;
    }
    // Either already painting, or no scroll target (paint-mode instance) —
    // just reset the visualization without scrolling.
    triggerReset();
    cb();
  };

  // slot 0 = "now"; 1..3 = the sunrise / mid-day / sunset forecast rows.
  const f = slot > 0 ? forecast[slot - 1] : null;

  // Connecting text styling — solid confetti-black on cream paper. The
  // earlier mix-blend-difference approach broke when the widget's
  // animated.div wrapper hit opacity < 1 mid-transition: opacity creates
  // a stacking context that isolates blend-mode, so the text would
  // briefly render as raw washes-paper (cream-on-cream → invisible).
  const textClass = "text-confetti-black type-tag";

  // Layout (Figma node 4014:43167): a single horizontal row at md+ —
  //   [Location] is where I'm based. It's currently [Time], NN°F and [Weather].
  // Below md it stacks into two rows because the full sentence overflows
  // narrow screens. Driven by Tailwind `md:` (not a JS snapshot) so it tracks
  // the real viewport; `whitespace-nowrap` at md+ keeps each chip + connector
  // from wrapping mid-row.
  return (
    <div className="flex flex-col items-center gap-[6px] rounded-md type-tag md:flex-row md:flex-nowrap md:whitespace-nowrap">

      <div className="flex items-center gap-[0px] whitespace-nowrap">
        <span className={`${textClass} hidden md:inline`}>Visualization above based on </span>
        <PresetBug
          onClick={wrapHandler(onLocation)}
          label={`Change location (currently ${location.city})`}
        >
          {location.city}
        </PresetBug>
        <span className={textClass}>{location.phrase}</span>
      </div>

      {f ? (
        <div className="flex items-center whitespace-nowrap">
          <span className={textClass}>At</span>
          <PresetBug
            onClick={wrapHandler(onTime)}
            label={`Show the next time (now showing ${f.label})`}
          >
            {f.time}
            <span className="hidden md:inline">{` (${f.label.toLowerCase()})`}</span>
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
        <div className="flex items-center whitespace-nowrap">
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
      className="ml-[6px] bg-confetti-black text-caresignal-white type-tag inline-flex items-center rounded-[4px] px-[8px] transition-transform hover:-translate-y-[2px]"
    >
      {children}
    </button>
  );
}
