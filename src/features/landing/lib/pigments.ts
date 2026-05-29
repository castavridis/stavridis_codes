// Pigments — the three primaries the design ships with. They drive the
// pigment selector, the per-card accent, and the active brush color.

export type PigmentKey = "rose" | "yellow" | "blue";

export const PIGMENTS: Record<PigmentKey, { label: string; color: string }> = {
  rose: { label: "Quinacridone Magenta", color: "#a50e53" },
  yellow: { label: "Hansa Yellow", color: "#e3af08" },
  blue: { label: "Cerulean Blue", color: "#108ba0" },
};

// Selector order, top → bottom, matches the Figma (magenta, yellow, blue).
export const PIGMENT_ORDER: PigmentKey[] = ["rose", "yellow", "blue"];
