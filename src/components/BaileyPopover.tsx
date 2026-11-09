import Text from "./Text.js";

// Bailey popover — Figma node 4003:21309. Differs from the standard
// Popover chrome: narrower (228px), 12px padding; a title, a photo of
// Bailey, and a one-line caption below it (tag type, matching the standard
// Popover's body text). Used by the "warm, approachable experiences" hover
// affordance in the landing "then" copy and by the FloretteSeal.
export default function BaileyPopover(): React.ReactElement {
  return (
    <div className="flex w-[228px] flex-col items-start gap-[10px] rounded-[8px] bg-white p-[12px]">
      <Text variant="headline-small-italic" className="text-black">
        My role model,
        <br aria-hidden />
        Bailey
      </Text>
      <div className="aspect-[500/438] w-full overflow-hidden rounded-[2.128px]">
        <img
          src="/images/bailey.png"
          alt="Bailey, a Golden Retriever"
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      </div>
      <Text variant="tag" className="text-black">
        Like Bailey, I aspire to bring Big Golden Retriever Energy™ to my collaborations.
      </Text>
    </div>
  );
}
