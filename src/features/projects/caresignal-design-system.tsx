'use client';

import { ProjectPageShell, type OtherProject } from './ProjectPageShell.js';

// ---------------------------------------------------------------------------
// CareSignal Design System project page.
//
// Figma node 533:13960 — "Building CareSignal's Design System, a Friendly
// Interface for Users, Engineers, and Designers." The page sits on the
// shared coffee-deep canvas (handled by ProjectPageShell) with a blue
// (cerulean) pigment-tinted hero. Below the hero the body stacks:
//   1. company intro paragraph (560-wide)
//   2. value-prop headline (560-wide bold)
//   3. dark code-editor block previewing the design-system imports
//   4. primary "Patients dashboard" preview placeholder with mock metric chips
//   5. "Variations" subsection — gradient placeholder cards
//   6. the shared "Other Projects" footer (handled by ProjectPageShell)
// ---------------------------------------------------------------------------

const OTHER_PROJECTS: OtherProject[] = [
  { label: 'Sol LeWitt', href: '/projects/sol-lewitt', pigment: 'rose' },
  { label: 'CareSignal AI', href: '/projects/caresignal-ai', pigment: 'yellow' },
  { label: 'Washes UI', href: '/', pigment: 'blue' },
];

export default function CareSignalDesignSystemPage(): React.ReactElement {
  return (
    <ProjectPageShell
      title="Building CareSignal's Design System, a Friendly Interface for Users, Engineers, and Designers"
      tagline="Product Design • Front-End Engineering"
      pigment="blue"
      otherProjects={OTHER_PROJECTS}
    >
      <div className="flex flex-col items-center gap-[72px]">
        <IntroParagraph />
        <ValuePropHeadline />
        <CodeBlockSection />
        <PrimaryDashboard />
        <VariationsSection />
      </div>
    </ProjectPageShell>
  );
}

// ---------------------------------------------------------------------------
// 1. Company intro paragraph — 560-wide block in cream body type.
// ---------------------------------------------------------------------------

function IntroParagraph(): React.ReactElement {
  return (
    <section className="w-[560px] max-w-full">
      <p className="text-cream font-body text-[16px] leading-[26px]">
        CareSignal is a digital health company I co-founded and exited. I led CareSignal&rsquo;s
        Product and Brand and performed full-stack engineering to validate ideas or to improve user
        experience.
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 2. Value-prop headline — 560-wide bold body type.
// ---------------------------------------------------------------------------

function ValuePropHeadline(): React.ReactElement {
  return (
    <section className="w-[560px] max-w-full">
      <h2 className="text-cream font-body text-[24px] leading-[32px] font-bold">
        Helping Nurses Support 10x More Patients with Less Effort
      </h2>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 3. Code-block section — 798×451 rounded slate rectangle with monospaced
// import snippet styled to feel like a code editor. The snippet is the same
// one shown in Figma; tokens are colored with the standard "VS Code dark
// plus" palette so the preview reads as familiar IDE output.
// ---------------------------------------------------------------------------

function CodeBlockSection(): React.ReactElement {
  return (
    <section className="w-full max-w-[798px]">
      <div className="overflow-hidden rounded-[12px] bg-[#1e1e2e] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        {/* Editor chrome — three traffic-light buttons + file name */}
        <div className="flex h-[40px] items-center gap-[8px] border-b border-black/40 bg-[#181825] px-[16px]">
          <span className="block h-[12px] w-[12px] rounded-full bg-[#ff5f56]" />
          <span className="block h-[12px] w-[12px] rounded-full bg-[#ffbd2e]" />
          <span className="block h-[12px] w-[12px] rounded-full bg-[#27c93f]" />
          <span className="text-cream/60 ml-[16px] font-mono text-[12px]">PatientsDashboard.tsx</span>
        </div>
        {/* Code body — pre/code so the indentation is preserved and the text
            is selectable. Token colors approximate a "VS Code dark plus"
            palette so the JSX import block reads as familiar IDE output. */}
        <pre className="m-0 overflow-x-auto bg-[#1e1e2e] px-[24px] py-[24px] font-mono text-[14px] leading-[22px] text-[#cdd6f4]">
          <code>
            <Line>
              <Kw>import</Kw> {'{ '}
              <Var>Container</Var>, <Var>Col</Var>, <Var>Row</Var>
              {' }'} <Kw>from</Kw> <Str>&apos;@grid&apos;</Str>;
            </Line>
            <Line>
              <Kw>import</Kw> {'{ '}
              <Var>Text</Var>
              {' }'} <Kw>from</Kw> <Str>&apos;@atoms&apos;</Str>;
            </Line>
            <Line>
              <Kw>import</Kw> {'{ '}
              <Var>ErrorBoundary</Var>
              {' }'} <Kw>from</Kw> <Str>&apos;@molecules&apos;</Str>;
            </Line>
            <Line>
              <Kw>import</Kw> {'{'}
            </Line>
            <Line indent>
              <Var>GenerateActionsForPatient</Var>,
            </Line>
            <Line indent>
              <Var>RoomWrapper</Var>,
            </Line>
            <Line indent>
              <Var>RoomViewer</Var>,
            </Line>
            <Line indent>
              <Var>StatusBadge</Var>,
            </Line>
            <Line indent>
              <Var>ViewPatientAction</Var>,
            </Line>
            <Line indent>
              <Var>ViewPatientProgramAction</Var>,
            </Line>
            <Line indent>
              <Var>Chats</Var>,
            </Line>
            <Line>
              {'}'} <Kw>from</Kw> <Str>&apos;@organisms&apos;</Str>;
            </Line>
          </code>
        </pre>
      </div>
    </section>
  );
}

function Line({
  children,
  indent = false,
}: {
  children: React.ReactNode;
  indent?: boolean;
}): React.ReactElement {
  return <span className={indent ? 'block pl-[1.5em]' : 'block'}>{children}</span>;
}

function Kw({ children }: { children: React.ReactNode }): React.ReactElement {
  return <span className="text-[#cba6f7]">{children}</span>;
}

function Var({ children }: { children: React.ReactNode }): React.ReactElement {
  return <span className="text-[#89b4fa]">{children}</span>;
}

function Str({ children }: { children: React.ReactNode }): React.ReactElement {
  return <span className="text-[#a6e3a1]">{children}</span>;
}

// ---------------------------------------------------------------------------
// 4. Primary "Patients" dashboard preview — 1137×707 image placeholder. The
// Figma asset URLs expire in 7 days, so we ship a CSS-gradient rectangle with
// a centered label + a row of "mock badge" metric chips that match the
// Figma copy ("Patients Total: 301", "Active Alerts: 139", etc.).
// ---------------------------------------------------------------------------

type MetricChip = { label: string; value: string; tone: 'blue' | 'rose' | 'yellow' | 'neutral' };

const PRIMARY_METRICS: MetricChip[] = [
  { label: 'Patients Total', value: '301', tone: 'blue' },
  { label: 'Active Alerts', value: '139', tone: 'rose' },
  { label: 'Less-Engaged', value: '16', tone: 'yellow' },
  { label: 'Engaged', value: '285', tone: 'blue' },
  { label: 'Paused', value: '0', tone: 'neutral' },
  { label: 'Snoozed', value: '0', tone: 'neutral' },
];

function PrimaryDashboard(): React.ReactElement {
  return (
    <section className="flex w-full max-w-[1137px] flex-col items-stretch gap-[16px]">
      {/* TODO swap in real screenshot */}
      <div
        className="relative flex h-[707px] w-full items-center justify-center overflow-hidden rounded-[12px]"
        style={{
          background: 'linear-gradient(135deg, #108ba0 0%, #5187a8 35%, #cae7ed 70%, #fbf6ea 100%)',
        }}
        aria-label="CareSignal patients dashboard preview placeholder"
      >
        {/* Browser chrome strip */}
        <div className="absolute top-0 right-0 left-0 flex h-[40px] items-center gap-[8px] bg-[#1c1c1c]/85 px-[16px]">
          <span className="block h-[12px] w-[12px] rounded-full bg-[#ff5f56]" />
          <span className="block h-[12px] w-[12px] rounded-full bg-[#ffbd2e]" />
          <span className="block h-[12px] w-[12px] rounded-full bg-[#27c93f]" />
          <span className="text-cream/60 ml-[16px] font-mono text-[12px]">
            app.caresignal.health/patients
          </span>
        </div>

        {/* Centered label */}
        <span className="font-display rounded-[8px] bg-black/40 px-[20px] py-[12px] text-[20px] text-[#fbf6ea]">
          Patients dashboard preview
        </span>

        {/* Metric chip strip — anchored near the top of the placeholder */}
        <div className="absolute top-[64px] right-0 left-0 flex flex-wrap justify-center gap-[12px] px-[24px]">
          {PRIMARY_METRICS.map((m) => (
            <MetricBadge key={m.label} metric={m} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MetricBadge({ metric }: { metric: MetricChip }): React.ReactElement {
  const toneClasses: Record<MetricChip['tone'], string> = {
    blue: 'bg-[#108ba0]/85 text-[#fbf6ea]',
    rose: 'bg-[#a50e53]/85 text-[#fbf6ea]',
    yellow: 'bg-[#e3af08]/90 text-[#100e08]',
    neutral: 'bg-[#fbf6ea]/85 text-[#100e08]',
  };
  return (
    <div
      className={`flex h-[36px] items-center gap-[8px] rounded-[18px] px-[14px] font-mono text-[12px] leading-[20px] ${toneClasses[metric.tone]}`}
    >
      <span>{metric.label}:</span>
      <span className="font-bold">{metric.value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. Variations section — bold headline, soft subhead, and a row of gradient
// placeholder rectangles. Three placeholders read as "Web Light", "Web Dark",
// and "Print Collateral" so a reader can intuit what the variations are
// without needing real screenshots yet.
// ---------------------------------------------------------------------------

type Variation = {
  id: string;
  label: string;
  background: string;
};

const VARIATIONS: Variation[] = [
  {
    id: 'web-light',
    label: 'Web · Light',
    background: 'linear-gradient(160deg, #fbf6ea 0%, #cae7ed 60%, #108ba0 100%)',
  },
  {
    id: 'web-dark',
    label: 'Web · Dark',
    background: 'linear-gradient(160deg, #0e0000 0%, #1b1207 50%, #108ba0 100%)',
  },
  {
    id: 'print',
    label: 'Print Collateral',
    background: 'linear-gradient(160deg, #fbf6ea 0%, #e9e2c7 50%, #a50e53 100%)',
  },
];

function VariationsSection(): React.ReactElement {
  return (
    <section className="flex w-full max-w-[1137px] flex-col gap-[24px]">
      <div className="flex w-[560px] max-w-full flex-col gap-[8px]">
        <h2 className="text-cream font-body text-[24px] leading-[32px] font-bold">Variations</h2>
        <p className="text-cream font-body text-[16px] leading-[26px]">
          Branded details that span CareSignal&rsquo;s digital and print footprint.
        </p>
      </div>
      <div className="flex w-full flex-wrap justify-between gap-[24px]">
        {VARIATIONS.map((v) => (
          // TODO swap in real screenshot
          <div
            key={v.id}
            className="flex h-[260px] w-[363px] max-w-full items-end justify-start overflow-hidden rounded-[12px]"
            style={{ background: v.background }}
            aria-label={`${v.label} variation placeholder`}
          >
            <span className="m-[16px] rounded-[6px] bg-black/40 px-[10px] py-[6px] font-mono text-[12px] text-[#fbf6ea]">
              {v.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
