import { useEffect, useRef } from 'react';

// Title line above the tag row in MDXLayout's sticky chrome, as on the
// clinician case study ("Title: Subtitle"). The clinician study hard-codes
// it in CSS; here it comes from this case study's frontmatter (`title` and
// `summary`) and reaches the ::before rule in member-enrollment.css through
// the --chrome-title custom property on the case-study root.
export function ChromeTitle({ title, subtitle }: { title: string; subtitle?: string }) {
	const ref = useRef<HTMLSpanElement>(null);
	useEffect(() => {
		const root = ref.current?.closest<HTMLElement>('[data-case]');
		if (!root) return;
		// JSON string syntax is valid CSS string syntax for plain text.
		root.style.setProperty('--chrome-title', JSON.stringify(subtitle ? `${title}: ${subtitle}` : title));
		return () => {
			root.style.removeProperty('--chrome-title');
		};
	}, [title, subtitle]);
	return <span ref={ref} hidden />;
}
