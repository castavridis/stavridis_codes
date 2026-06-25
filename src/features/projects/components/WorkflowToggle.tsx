type WorkflowToggleProps = {
  src: string;
  title?: string;
  className?: string;
};

export default function WorkflowToggle({
  src,
  title = 'Workflow visualization',
  className,
}: WorkflowToggleProps) {
  return (
    <div
      className={
        className ??
        'h-[900px] md:h-[762px] w-full overflow-hidden rounded-[16px] bg-[#191716] border border-confetti-black/10'
      }
    >
      <iframe
        src={src}
        title={title}
        className="block size-full"
        loading="lazy"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
