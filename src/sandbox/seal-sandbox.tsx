import RotatingSeal from '../components/RotatingSeal.js';
import Text from '../components/Text.js';
import { companies } from '../features/companies/companies.js';

const COMPANY_NAMES = Object.values(companies).map((c) => c.name);

export default function SealSandbox() {
  return (
    <div className="bg-washes-paper min-h-screen w-full px-[88px] py-[64px]">
      <div className="mx-auto max-w-[944px]">
        <Text variant="headline" as="h1" className="mb-[8px] text-confetti-black">
          Rotating Seal sandbox
        </Text>
        <Text variant="copy" as="p" className="mb-[48px] text-confetti-black/70">
          Small rotating seal — company name curved around the perimeter,{' '}
          <span className="font-mono">Featured Project</span> stationary in the center.
          Hover-pause not wired; rotation respects{' '}
          <span className="font-mono">prefers-reduced-motion</span>.
        </Text>

        <section className="mb-[64px]">
          <Text variant="headline-small" as="h2" className="mb-[24px] text-confetti-black">
            Each configured company
          </Text>
          <div className="flex flex-wrap items-center gap-[48px]">
            {COMPANY_NAMES.map((name) => (
              <div key={name} className="flex flex-col items-center gap-[12px]">
                <RotatingSeal companyName={name} />
                <Text variant="callout-meta" className="text-confetti-black/60">
                  {name}
                </Text>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-[64px]">
          <Text variant="headline-small" as="h2" className="mb-[24px] text-confetti-black">
            Size variations
          </Text>
          <div className="flex items-end gap-[48px]">
            {[80, 100, 120, 160, 200].map((size) => (
              <div key={size} className="flex flex-col items-center gap-[12px]">
                <RotatingSeal companyName="Stripe" size={size} />
                <Text variant="callout-meta" className="text-confetti-black/60">
                  {size}px
                </Text>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-[64px]">
          <Text variant="headline-small" as="h2" className="mb-[24px] text-confetti-black">
            Speed variations
          </Text>
          <div className="flex items-end gap-[48px]">
            {[10, 20, 30, 60].map((duration) => (
              <div key={duration} className="flex flex-col items-center gap-[12px]">
                <RotatingSeal companyName="Vercel" durationSeconds={duration} />
                <Text variant="callout-meta" className="text-confetti-black/60">
                  {duration}s
                </Text>
              </div>
            ))}
          </div>
        </section>

        <section>
          <Text variant="headline-small" as="h2" className="mb-[24px] text-confetti-black">
            On a dark surface
          </Text>
          <div className="bg-confetti-black flex items-center gap-[48px] rounded-[12px] p-[48px] text-white">
            <RotatingSeal companyName="Stripe" />
            <RotatingSeal companyName="Atomicdust" />
            <RotatingSeal companyName="vvd" />
          </div>
        </section>
      </div>
    </div>
  );
}
