import type {
  CSSProperties,
  ElementType,
  HTMLAttributes,
  ReactNode,
} from "react";

// Typography variants — each maps to a `type-*` utility defined in
// src/globals.css. Source of truth is the Figma Text Styles in file
// `fWYYke3w9yQdqU0j5HD4Yh`. Add or rename here AND in globals.css
// together — they're paired.
export const TEXT_VARIANTS = [
  "headline",
  "headline-italic",
  "headline-small",
  "headline-small-italic",
  "headline-meta",
  "logotype",
  "nav",
  "tag",
  "copy-large",
  "copy",
  "eyebrow",
  "callout-title",
  "callout-body",
  "callout-meta",
  "outcome",
] as const;

export type TextVariant = (typeof TEXT_VARIANTS)[number];

// Non-polymorphic on purpose: `as` is just an ElementType. Avoids a
// recursive generic that React Compiler can choke on. Consumers can
// pass any HTML attribute via `...rest`, type-checked against the
// shared HTMLAttributes set (any tag-specific props get cast).
type TextProps = {
  variant: TextVariant;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "style" | "children">;

export default function Text({
  variant,
  as: Tag = "p",
  className,
  ...rest
}: TextProps) {
  return (
    <Tag
      {...rest}
      className={`type-${variant}${className ? ` ${className}` : ""}`}
    />
  );
}
