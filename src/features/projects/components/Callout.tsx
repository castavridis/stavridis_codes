import Text from '../../../components/Text.js';

type CalloutProps = {
  title?: string;
  content: React.ReactNode;
  attribution?: React.ReactNode;
};

export default function Callout({ title, content, attribution }: CalloutProps) {
  return (
    <div className="flex w-full max-w-[944px] flex-col items-center justify-center overflow-clip rounded-[8px] bg-[#f0eeeb] px-[24px] py-[32px] md:px-[80px] md:py-[60px]">
      <div className="flex w-full flex-col items-start gap-[24px] text-black">
        {title ? (
          <Text variant="callout-title" className="m-0 w-full">
            {title}
          </Text>
        ) : null}
        <Text variant="callout-body" className="m-0 w-full">
          {content}
        </Text>
        {attribution ? (
          <Text variant="callout-meta" className="m-0 w-full">
            {attribution}
          </Text>
        ) : null}
      </div>
    </div>
  );
}
