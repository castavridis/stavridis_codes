import type { ReactNode } from 'react';

type PopoverProps = {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
  onClose?: () => void;
};

export default function Popover({ title, children, icon, onClose }: PopoverProps) {
  return (
    <div className="bg-white rounded-[8px] w-[368px] pt-[24px] pb-[16px] px-[16px] flex flex-col gap-[8px]">
      <div className="flex items-center gap-[12px] w-full">
        <div className="flex flex-1 min-w-0 items-center gap-[8px]">
          {icon ? <div className="size-[12px] shrink-0">{icon}</div> : null}
          <p className="flex-1 min-w-0 font-kyoto italic font-medium text-[24px] leading-[32px] text-black break-words">
            {title}
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="size-[24px] shrink-0 inline-flex items-center justify-center"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
              <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </button>
        ) : null}
      </div>
      <div className="w-full font-mono font-normal text-[12px] leading-[20px] text-black break-words">{children}</div>
    </div>
  );
}
