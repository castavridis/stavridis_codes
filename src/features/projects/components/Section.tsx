import type { ReactNode } from 'react';

type SectionProps = {
  children: ReactNode;
  className?: string;
};

// Vertical-rhythm wrapper for case-study content. A Section is an MDX wrapper
// — the author writes `## Title`, prose paragraphs, and bespoke visual
// components inside, and `MDXLayout`'s overrides (`h2`, `p`, etc.) handle
// typography. `Section` just provides the consistent gap between adjacent
// sections so the page rhythm stays uniform across case studies.
//
// `first:mt-0` resets the top margin on the first Section so it sits
// against `MDXLayout`'s own `pt-[72px]` (below the FrontMatter block)
// without adding a second gap.
export default function Section({ children, className }: SectionProps) {
  return (
    <section className={`mt-[120px] first:mt-0 ${className ?? ''}`}>
      {children}
    </section>
  );
}
