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
        'aspect-[1280/820] w-full overflow-hidden rounded-[16px] border border-confetti-black/10'
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
