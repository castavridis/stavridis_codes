import Button from '../../../components/Button.js';

type TopNavigationProps = {
  tags?: string;
  onClose?: () => void;
};

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
