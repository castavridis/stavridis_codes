import type { ReactNode } from 'react';
import { X } from 'lucide-react';

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
            <X size={20} strokeWidth={1.5} aria-hidden />
          </button>
        ) : null}
      </div>
      <div className="w-full font-mono font-normal text-[12px] leading-[20px] text-black break-words">{children}</div>
    </div>
  );
}
