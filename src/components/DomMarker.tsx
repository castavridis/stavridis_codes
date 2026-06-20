import { useEffect, useRef, type ReactNode } from 'react';

// Wraps children with real HTML comment nodes (`<!-- name:start -->` ...
// `<!-- name:end -->`) for debugging. The comments appear in the rendered
// DOM and devtools but contribute zero layout / styling impact.
//
// React can't render comment nodes from JSX directly, so this uses a tiny
// useEffect-after-mount swap: render two zero-height invisible <span>s,
// then replace each with a real comment node via `document.createComment`.
export default function DomMarker({
  name,
  children,
}: {
  name: string;
  children: ReactNode;
}) {
  const startRef = useRef<HTMLSpanElement>(null);
  const endRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const start = startRef.current;
    const end = endRef.current;
    if (!start || !end) return;
    const startComment = document.createComment(` ${name}:start `);
    const endComment = document.createComment(` ${name}:end `);
    start.parentNode?.replaceChild(startComment, start);
    end.parentNode?.replaceChild(endComment, end);
    return () => {
      startComment.remove();
      endComment.remove();
    };
  }, [name]);

  return (
    <>
      <span ref={startRef} hidden aria-hidden />
      {children}
      <span ref={endRef} hidden aria-hidden />
    </>
  );
}
