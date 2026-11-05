import Button from './Button';
import { setGpuPaused, useGpuPaused } from '../lib/gpu-pause';

// Shown only while the GPU pause is on (src/lib/gpu-pause.ts), so a pause
// left over from a video call is never mistaken for a broken wash. Clicking
// it resumes. Toggle with Shift+Alt+P, or ?gpu=off / ?gpu=on.
export default function GpuPausePill() {
  const paused = useGpuPaused();
  if (!paused) return null;
  return (
    <Button
      variant="small"
      onClick={() => setGpuPaused(false)}
      title="Watercolor animations are paused to spare the GPU. Click (or Shift+Alt+P) to resume."
      aria-label="GPU paused. Resume watercolor animations"
      className="fixed bottom-[16px] left-[16px] z-[1000] gap-[6px] shadow-md"
    >
      <span aria-hidden="true">❚❚</span> GPU paused · Resume
    </Button>
  );
}
