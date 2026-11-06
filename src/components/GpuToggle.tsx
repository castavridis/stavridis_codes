import { toggleGpuPaused, useGpuPaused } from '../lib/gpu-pause';

// A very small, always-present play/pause for the GPU pause
// (src/lib/gpu-pause.ts), fixed to the bottom-right corner. Pause icon while
// the watercolor sims run; play icon while they're paused. Same switch as
// Shift+Alt+P and the "GPU paused" pill.
export default function GpuToggle() {
  const paused = useGpuPaused();
  const label = paused
    ? 'Resume watercolor animations (Shift+Alt+P)'
    : 'Pause watercolor animations to spare the GPU (Shift+Alt+P)';
  return (
    <button
      type="button"
      onClick={toggleGpuPaused}
      aria-label={label}
      aria-pressed={paused}
      title={label}
      className="border-confetti-black/40 text-confetti-black/70 hover:border-confetti-black hover:text-confetti-black focus-visible:outline-confetti-black fixed right-[16px] bottom-[16px] z-[1000] flex size-[28px] cursor-pointer items-center justify-center rounded-full border bg-white/85 p-0 shadow-sm backdrop-blur-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
        {paused ? (
          <path d="M2.5 1.2 L8.8 5 L2.5 8.8 Z" />
        ) : (
          <>
            <rect x="2" y="1.5" width="2.2" height="7" rx="0.4" />
            <rect x="5.8" y="1.5" width="2.2" height="7" rx="0.4" />
          </>
        )}
      </svg>
    </button>
  );
}
