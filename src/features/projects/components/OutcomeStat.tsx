import Text from '../../../components/Text.js';

type OutcomeStatProps = {
  stat: string;
  caption: string;
};

export default function OutcomeStat({ stat, caption }: OutcomeStatProps) {
  return (
    <div className="flex w-[303px] flex-col items-start gap-[8px] rounded-[8px] bg-[#f0eeeb] px-[16px] pt-[24px] pb-[16px] text-confetti-black">
      <Text variant="outcome" className="m-0 w-full">
        {stat}
      </Text>
      <Text variant="copy-large" className="m-0 w-full">
        {caption}
      </Text>
    </div>
  );
}
