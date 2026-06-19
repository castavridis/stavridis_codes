type CalloutProps = {
  title?: string;
  content: string;
  attribution?: string;
};

export default function Callout({ title, content, attribution }: CalloutProps) {
  return (
    <div className="flex w-[944px] flex-col items-center justify-center overflow-clip rounded-[8px] bg-[#f0eeeb] px-[80px] py-[60px]">
      <div className="flex w-full flex-col items-start gap-[24px] text-black">
        {title ? (
          <p className="font-kyoto m-0 w-full text-[24px] font-medium italic leading-none">
            {title}
          </p>
        ) : null}
        <p className="font-body m-0 w-full text-[36px] font-light leading-[40px]">
          {content}
        </p>
        {attribution ? (
          <p className="font-mono m-0 w-full text-[14px] font-bold leading-[28px]">
            {attribution}
          </p>
        ) : null}
      </div>
    </div>
  );
}
