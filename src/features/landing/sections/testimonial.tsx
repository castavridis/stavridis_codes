// ---------------------------------------------------------------------------
// Testimonial — 944×312 card with a faded watercolor backdrop and a Quartr
// engineer's quote. Figma node 4012:42402.
//
// Backdrop: a soft cream-to-rose gradient stand-in. We considered rendering
// a second Washes instance at opacity 0.16 but a static gradient costs zero
// frame budget and reads close enough to a faded wash that the testimonial
// reads as quietly decorated rather than as a second active surface.
// ---------------------------------------------------------------------------

export function Testimonial(): React.ReactElement {
  return (
    <section className="relative w-[944px] overflow-clip rounded-[12px]">
      {/* Faded washes backdrop. */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          opacity: 0.16,
          background:
            "radial-gradient(ellipse 75% 70% at 30% 35%, rgba(227,175,8,0.55) 0%, rgba(165,14,83,0.45) 45%, rgba(16,139,160,0.45) 85%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundColor: "#fbf6ea",
          opacity: 0.6,
        }}
      />

      <div className="relative flex h-[312px] flex-col gap-[24px] px-[80px] pt-[72px]">
        <p className="font-kyoto text-[24px] leading-[28px] font-light text-[#251900]">
          My Favorite Testimonial
        </p>

        <p
          className="font-body text-[24px] leading-[28px] font-normal text-[#391f00]"
          style={{ maxWidth: 720 }}
        >
          “I love working with you, C. You have an infectious energy and passion
          for what you do and you know how to push people in the right
          directions or advise them to get the best out of them.”
        </p>

        <p className="font-mono text-[12px] leading-[20px] text-[#391f00]">
          <span className="font-bold">Georgiana Ramona Turcsanyi</span>
          <span> · Senior Software Engineer, Quartr</span>
        </p>
      </div>
    </section>
  );
}
