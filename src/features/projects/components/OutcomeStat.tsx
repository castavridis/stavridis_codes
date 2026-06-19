type OutcomeStatProps = {
  stat: string;
  caption: string;
};

export default function OutcomeStat({ stat, caption }: OutcomeStatProps) {
  return (
    <div className="flex w-[303px] flex-col items-start gap-[8px] rounded-[8px] bg-[#f0eeeb] px-[16px] pt-[24px] pb-[16px] text-confetti-black">
      <p className="font-kyoto m-0 w-full text-[64px] font-medium italic leading-[64px]">
        {stat}
      </p>
      <p className="font-body m-0 w-full text-[24px] font-normal leading-[32px]">
        {caption}
      </p>
    </div>
  );
}
