import type { ReactNode } from 'react';
import { X } from 'lucide-react';

import Text from './Text.js';

type PopoverProps = {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
  onClose?: () => void;
  // Extra root classes — e.g. a narrower width on mobile so the popover
  // keeps a right-margin instead of being clamped against the viewport edge.
  className?: string;
};

export default function Popover({ title, children, icon, onClose, className }: PopoverProps) {
  return (
    <div className={`bg-white rounded-[8px] w-[368px] pt-[24px] pb-[16px] px-[16px] flex flex-col gap-[8px] ${className ?? ''}`}>
      <div className="flex items-center gap-[12px] w-full">
        <div className="flex flex-1 min-w-0 items-center gap-[8px]">
          {icon ? <div className="size-[12px] shrink-0">{icon}</div> : null}
          <Text variant="headline-small-italic" className="flex-1 min-w-0 text-black break-words">
            {title}
          </Text>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="size-[24px] shrink-0 inline-flex items-center justify-center"
          >
            <X size={20} strokeWidth={1.5} aria-hidden />
          </button>
        ) : null}
      </div>
      <div className="w-full type-tag text-black break-words">{children}</div>
    </div>
  );
}
