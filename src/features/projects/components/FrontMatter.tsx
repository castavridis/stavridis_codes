import TopNavigation from './TopNavigation.js';

type FrontMatterProps = {
  headline: string;
  introduction: string;
  tags?: string;
  onClose?: () => void;
};

export default function FrontMatter({ headline, introduction, tags, onClose }: FrontMatterProps) {
  return (
    <div className="flex w-[944px] flex-col items-start gap-[84px]">
      <TopNavigation tags={tags} onClose={onClose} />
      <div className="flex w-full flex-col items-start gap-[16px] text-confetti-black">
        <h1 className="font-kyoto m-0 w-full text-[48px] font-medium leading-[60px]">
          {headline}
        </h1>
        <p className="font-body m-0 max-w-[704px] text-[24px] font-normal leading-[32px]">
          {introduction}
        </p>
      </div>
    </div>
  );
}
