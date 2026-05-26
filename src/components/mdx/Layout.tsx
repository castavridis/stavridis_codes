import type { ReactNode } from 'react';

// Tailwind's scanner only sees literal class names, so the spans are spelled out
// rather than built with a `col-span-${n}` template. Columns are full width on
// small screens and take their span at the `md` breakpoint and up.
const SPAN = {
  1: 'col-span-12 md:col-span-1',
  2: 'col-span-12 md:col-span-2',
  3: 'col-span-12 md:col-span-3',
  4: 'col-span-12 md:col-span-4',
  5: 'col-span-12 md:col-span-5',
  6: 'col-span-12 md:col-span-6',
  7: 'col-span-12 md:col-span-7',
  8: 'col-span-12 md:col-span-8',
  9: 'col-span-12 md:col-span-9',
  10: 'col-span-12 md:col-span-10',
  11: 'col-span-12 md:col-span-11',
  12: 'col-span-12',
} as const;

type Span = keyof typeof SPAN;

// A 12-column grid container. Place one or more <MDXColumn> children inside it.
// The surrounding `.prose` (see blog-post.tsx) cascades into the columns via
// descendant selectors, so markdown inside still gets typography styles.
export function MDXWrapper({ children }: { children: ReactNode }) {
  return <div className="my-8 grid grid-cols-12 gap-6">{children}</div>;
}

// A single grid item spanning `span` of 12 columns. Wrap markdown in exactly one
// of these — a markdown block expands into many sibling elements, and the column
// needs a single element to carry the span.
export function MDXColumn({ span = 12, children }: { span?: Span; children: ReactNode }) {
  return <div className={SPAN[span]}>{children}</div>;
}
