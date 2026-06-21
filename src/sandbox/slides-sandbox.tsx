import Slides, { Slide } from '../features/projects/components/Slides.js';
import Text from '../components/Text.js';

export default function SlidesSandbox() {
  return (
    <div className="bg-washes-paper min-h-screen w-full px-[88px] py-[64px]">
      <div className="mx-auto max-w-[944px]">
        <Text variant="headline" as="h1" className="mb-[8px] text-confetti-black">
          Slides sandbox
        </Text>
        <Text variant="copy" as="p" className="mb-[48px] text-confetti-black/70">
          Visual verification for{' '}
          <code className="font-mono">src/features/projects/components/Slides.tsx</code>.
          Prev/Next cycles through three placeholder slides.
        </Text>

        <Slides>
          <Slide
            caption={
              <span>
                <strong>Slide one</strong> — placeholder content with a tall block so the
                window viewport has something to anchor against.
              </span>
            }
          >
            <DemoContent label="Slide 1" tint="#fef3c7" />
          </Slide>

          <Slide
            caption={
              <span>
                <strong>Slide two</strong> — a different color so cycling is visually
                obvious.
              </span>
            }
          >
            <DemoContent label="Slide 2" tint="#dbeafe" />
          </Slide>

          <Slide
            caption={
              <span>
                <strong>Slide three</strong> — caption supports arbitrary ReactNode so
                authors can mix icons + bold + prose.
              </span>
            }
          >
            <DemoContent label="Slide 3" tint="#dcfce7" />
          </Slide>
        </Slides>
      </div>
    </div>
  );
}

function DemoContent({ label, tint }: { label: string; tint: string }) {
  return (
    <div
      className="flex h-[500px] w-full items-center justify-center text-[48px] font-medium text-confetti-black"
      style={{ background: tint }}
    >
      {label}
    </div>
  );
}
