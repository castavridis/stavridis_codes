// The case-study introduction, placed below Figure 1 (the design renders it
// here, not in the front matter — FrontMatter omits it via hideIntroduction).
// Reads larger than body copy: Funnel Sans 24/32, light. FrontMatterWashes
// finds the "sole Product Designer" phrase here and underlines it.
export function Introduction() {
	return (
		<div className="mt-[40px] flex w-full max-w-[944px] flex-col">
			<p
				className="m-0 text-confetti-black [text-wrap:pretty]"
				style={{
					fontFamily: 'var(--font-body)',
					fontWeight: 300,
					fontSize: 24,
					lineHeight: '32px',
				}}
			>
				<strong style={{ fontWeight: 600 }}>As CareSignal’s sole Product Designer through acquisition</strong>, our clinician
				web application was my responsibility. I combined my skills in product
				design, engineering, branding, and service design to take our app from a
				clinically‑proven proof of concept to a commercial product.
			</p>
		</div>
	);
}
