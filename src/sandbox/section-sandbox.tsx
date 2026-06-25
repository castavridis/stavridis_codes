import Section from '../features/projects/components/Section.js';
import { mdxComponents } from '../features/projects/components/MDXLayout.js';
import Text from '../components/Text.js';

// Pull the h2 / p overrides off the project's MDX components so the sandbox
// reads the same typography as a real case study.
const H2 = mdxComponents.h2;
const P = mdxComponents.p;

export default function SectionSandbox() {
  return (
    <div className="min-h-screen w-full bg-white">
      <div className="mx-auto max-w-[1104px] px-[72px]">
        <div className="mx-auto w-[944px] pt-[128px] pb-[256px]">
          <Text variant="headline" as="h1" className="mb-[8px] text-confetti-black">
            Section sandbox
          </Text>
          <Text variant="copy" as="p" className="mb-[48px] text-confetti-black/70">
            Three stacked sections rendered against the v2 case-study chrome
            (cream paper + 944px column + h2/p typography from{' '}
            <code className="font-mono">mdxComponents</code>). Spacing between
            sections is the Section component's <code className="font-mono">mt-[120px]</code>{' '}
            with <code className="font-mono">first:mt-0</code> on the first.
          </Text>

          <Section>
            <H2>Clinical teams work within complex software environments</H2>
            <P>
              Many of our users sit in tightly-controlled hospital settings — Epic,
              Teams, Outlook, all open at once, with a phone tucked in their
              shoulder. A new tool has to fit into that scrum without asking for
              real-estate it can't earn.
            </P>
            <DemoVisual tint="#fef3c7" label="Monitors illustration" />
          </Section>

          <Section>
            <H2>We designed a low-burden way to offer clinicians a snapshot</H2>
            <P>
              The triage status icons were the first visual anchor — high, medium,
              and low risk in a single glance, with a notch to show the
              direction of change since the last assessment.
            </P>
            <DemoVisual tint="#dbeafe" label="Triage statuses illustration" />
          </Section>

          <Section>
            <H2>Two object types tied the system together</H2>
            <P>
              Alerts and Patients each had their own canonical row, composable
              across the dashboard, the side panel, and the daily-task queue.
            </P>
            <DemoVisual tint="#dcfce7" label="Key objects illustration" />
          </Section>
        </div>
      </div>
    </div>
  );
}

function DemoVisual({ label, tint }: { label: string; tint: string }) {
  return (
    <div
      className="mt-[24px] flex h-[300px] w-full items-center justify-center rounded-[12px] text-[32px] font-medium text-confetti-black"
      style={{ background: tint }}
    >
      {label}
    </div>
  );
}
