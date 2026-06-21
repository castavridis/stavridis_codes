import { useState, type ReactNode } from 'react';

export function ProjectSubheader ({ children, className }: {
  children: React.ReactNode;
  className?: string;
}) {
  let classes = "font-display font-light text-2xl mt-0";
  if (className) classes = classes.concat(" ", className);
  return (
    <h2 className={classes}>
      {children}
    </h2>
  )
}

export function ProjectImage ({ src, alt, className, placeholderColor = 'rgba(255,255,255,0.00)' }: {
  src: string;
  alt: string;
  className?: string;
  placeholderColor?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  let wrapperClasses = "my-0 block"
  if (className) wrapperClasses = wrapperClasses.concat(" ", className)
  return (
    <div className={wrapperClasses} style={{ backgroundColor: placeholderColor }}>
      <img
        className="my-0 block w-full"
        src={src}
        alt={alt}
        style={{
          opacity: loaded ? 1 : 0,
          transition: loaded ? 'opacity 400ms ease-out' : 'none',
        }}
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
}

export function ProjectDescription({ children }: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full content-center">
      { children }
    </div>
  )
}

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

const START = {
  1: 'md:col-start-1',
  2: 'md:col-start-2',
  3: 'md:col-start-3',
  4: 'md:col-start-4',
  5: 'md:col-start-5',
  6: 'md:col-start-6',
  7: 'md:col-start-7',
  8: 'md:col-start-8',
  9: 'md:col-start-9',
  10: 'md:col-start-10',
  11: 'md:col-start-11',
} as const;

type Start = keyof typeof START;

const END = {
  2: 'md:col-end-2',
  3: 'md:col-end-3',
  4: 'md:col-end-4',
  5: 'md:col-end-5',
  6: 'md:col-end-6',
  7: 'md:col-end-7',
  8: 'md:col-end-8',
  9: 'md:col-end-9',
  10: 'md:col-end-10',
  11: 'md:col-end-11',
  12: 'md:col-end-12',
} as const;

type End = keyof typeof END;

// A 12-column grid container. Place one or more <MDXColumn> children inside it.
// The surrounding `.prose` (see blog-post.tsx) cascades into the columns via
// descendant selectors, so markdown inside still gets typography styles.
export function MDXWrapper({ gap = 6, children }: { gap?: number, children: ReactNode }) {
  return <div className={`mb-8 grid grid-cols-12 gap-[${gap}px] leading-normal`}>{children}</div>;
}

// A single grid item spanning `span` of 12 columns. Wrap markdown in exactly one
// of these — a markdown block expands into many sibling elements, and the column
// needs a single element to carry the span.
export function MDXColumn({ span = 12, start, end, children }: { span?: Span; start?: Start; end?: End; children: ReactNode }) {
  let classes: string = SPAN[span].concat(" ", "h-full");
  if (start) { classes = classes.concat(" ", START[start]) }
  if (end) { classes = classes.concat(" ", END[end]) }
  return <div className={classes}>{children}</div>;
}
