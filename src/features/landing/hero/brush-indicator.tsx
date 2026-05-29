// ---------------------------------------------------------------------------
// Brush indicator — a 64px (default) ring that follows the cursor over the
// hero band, scales with the Washes brush size, and recolors to the pigment.
// ---------------------------------------------------------------------------

export function BrushIndicator({
  cursor,
  size,
  color,
}: {
  cursor: { x: number; y: number; visible: boolean };
  size: number;
  color: string;
}): React.ReactElement {
  return (
    <div
      className="pointer-events-none absolute z-20 rounded-full border-2 transition-[width,height,opacity] duration-150 ease-out"
      style={{
        width: size,
        height: size,
        top: 0,
        left: 0,
        transform: `translate(${cursor.x - size / 2}px, ${cursor.y - size / 2}px)`,
        backgroundColor: `${color}40`,
        borderColor: `${color}80`,
        boxShadow: `0 0 12px ${color}66`,
        opacity: cursor.visible ? 1 : 0,
        willChange: "transform, opacity",
      }}
      aria-hidden="true"
    />
  );
}
