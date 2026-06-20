import Button from '../../../components/Button.js';

type TopNavigationProps = {
  tags?: string;
  onClose?: () => void;
};

// TODO(sticky-headers): deferred follow-up. Three approaches to choose
// from when the user picks: (a) sticky TopNavigation alone, (b) full
// header band (TopNav + WashesCanvas) sticky as one unit, (c) collapsing
// sticky band that shrinks on scroll. See user memory
// `project-overlay-sticky-headers` for context.
export default function TopNavigation({ tags, onClose }: TopNavigationProps) {
  return (
    <div className="flex w-[944px] items-center gap-[24px] overflow-clip">
      <p className="font-mono flex-1 min-w-0 text-[12px] leading-[20px] text-confetti-black opacity-50">
        {tags ?? ''}
      </p>
      <Button variant="outline" label="Close" onClick={onClose} />
    </div>
  );
}
