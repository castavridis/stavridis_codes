// ---------------------------------------------------------------------------
// Testimonial — 944×312 card with a faded watercolor backdrop and a Quartr
// engineer's quote. Figma node 4012:42402.
//
// Backdrop: a soft cream-to-rose gradient stand-in. We considered rendering
// a second Washes instance at opacity 0.16 but a static gradient costs zero
// frame budget and reads close enough to a faded wash that the testimonial
// reads as quietly decorated rather than as a second active surface.
// ---------------------------------------------------------------------------

import Text from "../../../components/Text.js";

export function Testimonial(): React.ReactElement {
  return (
    <section className="relative w-[944px] overflow-clip rounded-[12px]">
      {/* Faded washes backdrop. Anchored to the left so the wash reads as
          a soft warm blob behind the "My Favorite Testimonial" label, with
          the quote sitting in cleaner cream space to the right. Spread is
          tighter than the previous centered gradient so the wash doesn't
          wash out the body copy. */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          opacity: 0.22,
          background:
            "radial-gradient(ellipse 55% 90% at 15% 50%, rgba(227,175,8,0.6) 0%, rgba(165,14,83,0.45) 40%, rgba(16,139,160,0.25) 75%, rgba(251,246,234,0) 95%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundColor: "#fbf6ea",
          opacity: 0.35,
        }}
      />

      <div className="relative flex h-[312px] flex-col gap-[24px] px-[80px] pt-[72px]">
        <Text variant="headline-small-italic" className="text-[#251900]">
          My Favorite Testimonial
        </Text>

        <Text
          variant="copy-large"
          className="text-[#391f00]"
          style={{ maxWidth: 720 }}
        >
          “I love working with you, C. You have an infectious energy and passion
          for what you do and you know how to push people in the right
          directions or advise them to get the best out of them.”
        </Text>

        <Text variant="tag" className="text-[#391f00]">
          <span className="font-bold">Georgiana Ramona Turcsanyi</span>
          <span> · Senior Software Engineer, Quartr</span>
        </Text>
      </div>
    </section>
  );
}
