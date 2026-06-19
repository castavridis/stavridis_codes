type WashesCanvasProps = {
  className?: string;
};

/* TODO(PR 4c): wire to interactive Washes via Koota */
export default function WashesCanvas({ className }: WashesCanvasProps) {
  return (
    <div
      className={
        className ??
        'h-[391px] w-[1136px] rounded-tl-[12px] rounded-tr-[12px] bg-gradient-to-b from-[#fbf6ea] to-transparent'
      }
    />
  );
}
