// ---------------------------------------------------------------------------
// Hero project card — live watercolor surface with an instantly-traced brush
// stroke (annotation: "SVG does not animate in, it's instantly on").
// ---------------------------------------------------------------------------

import { CREAM } from "../lib/colors.js";
import { PIGMENTS, type PigmentKey } from "../lib/pigments.js";

export type HeroProject = {
  id: string;
  label: string;
  title: string;
  image: string;
  pigment: PigmentKey;
  cta: { text: string; variant: "filled" | "outline" };
  // Position inside the hero (Figma coordinates, hero-relative).
  left: number;
  top: number;
  rotation: number;
  z: number;
  bob: boolean; // Annotation: Project 01 "gently move up and down".
};

export function HeroProjectCardButton({
  project,
  onClick,
  onActivate,
}: {
  project: HeroProject;
  onClick: () => void;
  onActivate: () => void;
}): React.ReactElement {
  const cta = project.cta;
  const ctaColor = PIGMENTS[project.pigment].color;
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onActivate}
      onTouchStart={onActivate}
      onFocus={onActivate}
      className="group relative flex w-[272px] cursor-pointer flex-col items-center gap-[24px] overflow-hidden rounded-[12px] px-[24px] pt-[24px] pb-[36px] text-left transition-transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fbf6ea]"
      style={{
        backgroundColor: CREAM,
        border: '1px solid rgba(79, 61, 27, 0.25)',
      }}
    >
      <div
        style={{
          backgroundSize: "60%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          top: "5rem",
          backgroundImage: `url('${project.image}')`,
        }}
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[12px] opacity-70 mix-blend-luminosity"
      />
      <div className="relative z-10 flex w-full flex-col gap-[24px]">
        <p className="font-mono text-[12px] leading-[24px] text-[#7d7d7d] mix-blend-difference">
          {project.label}
        </p>
        <p
          className="font-body text-[18px] leading-[24px] whitespace-pre-line text-black"
          style={{ minHeight: "202px" }}
        >
          {project.title}
        </p>
        {cta.variant === "filled" ? (
          <div
            className="mx-auto flex h-[36px] w-[180px] items-center justify-center rounded-[4px] font-mono text-[12px] leading-[24px] transition-[filter] group-hover:brightness-110"
            style={{
              backgroundColor: ctaColor,
              color: project.pigment === "yellow" ? "#100e08" : CREAM,
            }}
          >
            {cta.text}
          </div>
        ) : (
          <div
            className="mx-auto flex h-[36px] w-[180px] items-center justify-center rounded-[4px] border font-mono text-[12px] leading-[24px] text-black opacity-75"
            style={{
              backgroundColor: CREAM,
              borderColor: ctaColor,
            }}
          >
            {cta.text}
          </div>
        )}
      </div>
    </button>
  );
}

export function HeroProjectCard({
  project,
  topOffset = 0,
  onClick,
  onActivate,
}: {
  project: HeroProject;
  topOffset?: number;
  onClick: () => void;
  onActivate: () => void;
}): React.ReactElement {
  return (
    <div
      className="absolute"
      style={{
        left: `${project.left}px`,
        top: `${project.top + topOffset}px`,
        zIndex: project.z,
        transform: `rotate(${project.rotation}deg)`,
      }}
    >
      <div
        className={
          project.bob ? "animate-[card-bob_6s_ease-in-out_infinite]" : undefined
        }
      >
        <HeroProjectCardButton project={project} onClick={onClick} onActivate={onActivate} />
      </div>
    </div>
  );
}
