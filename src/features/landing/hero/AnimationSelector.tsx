import { useState } from 'react';
import { CARD_TRANSITION_PRESETS, ANIM_STORAGE_KEY, DEFAULT_PRESET_ID } from './card-transition-presets.js';

export function AnimationSelector({
  onSelect,
}: {
  onSelect: (id: string) => void;
}): React.ReactElement {
  const [open, setOpen] = useState(() => !localStorage.getItem(ANIM_STORAGE_KEY));
  const [current, setCurrent] = useState(
    () => localStorage.getItem(ANIM_STORAGE_KEY) ?? DEFAULT_PRESET_ID,
  );

  const handleChange = (id: string) => {
    localStorage.setItem(ANIM_STORAGE_KEY, id);
    setCurrent(id);
    onSelect(id);
    setOpen(false);
  };

  return (
    <div className="absolute bottom-3 left-3 z-40 flex flex-col items-start gap-1" style={{ pointerEvents: 'auto' }}>
      {open ? (
        <div className="flex flex-col gap-1 rounded-[4px] bg-[rgba(37,25,0,0.7)] px-2 py-1.5 backdrop-blur-sm">
          <p className="font-mono text-[9px] leading-none text-[rgba(251,246,234,0.5)] mb-1">
            card transition
          </p>
          {Object.values(CARD_TRANSITION_PRESETS).map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleChange(preset.id)}
              className={`text-left font-mono text-[10px] leading-[18px] transition-opacity hover:opacity-100 ${
                current === preset.id ? 'text-[rgba(251,246,234,1)]' : 'text-[rgba(251,246,234,0.55)] hover:text-[rgba(251,246,234,0.85)]'
              }`}
            >
              {current === preset.id ? '▸ ' : '  '}{preset.label}
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Select card transition animation"
          className="font-mono text-[10px] leading-none text-[rgba(251,246,234,0.3)] transition-opacity hover:text-[rgba(251,246,234,0.6)]"
        >
          ⚙
        </button>
      )}
    </div>
  );
}
