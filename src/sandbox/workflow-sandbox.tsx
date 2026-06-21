import WorkflowToggle from '../features/projects/components/WorkflowToggle.js';
import Text from '../components/Text.js';

export default function WorkflowSandbox() {
  return (
    <div className="bg-washes-paper min-h-screen w-full px-[88px] py-[64px]">
      <div className="mx-auto max-w-[944px]">
        <Text variant="headline" as="h1" className="mb-[8px] text-confetti-black">
          WorkflowToggle sandbox
        </Text>
        <Text variant="copy" as="p" className="mb-[48px] text-confetti-black/70">
          Embedding the Claude Design artifact{' '}
          <code className="font-mono">CareSignal Care Models Minimal.dc.html</code> via
          iframe. Toggle Without / With / 24-7 Acute / Hub &amp; Spoke inside the frame.
        </Text>

        <WorkflowToggle
          src="/case-studies/caresignal/workflow/index.html"
          title="CareSignal care-models visualization"
        />
      </div>
    </div>
  );
}
