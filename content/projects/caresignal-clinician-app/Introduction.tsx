// The case-study introduction, placed between the front matter and Figure 1
// (rendered here rather than by FrontMatter, which omits it via
// hideIntroduction, so it keeps the bold lead and wash underline).
// Reads larger than body copy: Funnel Sans 28/1.35, light, full width, with
// a break after the bold lead (as the design's intro pass sets it). FrontMatterWashes
// finds the "sole Product Designer" phrase here and underlines it.
export function Introduction() {
	return (
		<div className="mt-[40px] flex w-full flex-col">
			<p
				className="m-0 text-confetti-black [text-wrap:pretty]"
				style={{
					fontFamily: 'var(--font-body)',
					fontWeight: 300,
					// 22px on phones (28px from ~500px up), so the intro doesn't fill
					// 1.5 screens before Figure 1.
					fontSize: 'clamp(22px, 5.6vw, 28px)',
					lineHeight: 1.35,
				}}
			>
				<strong style={{ fontWeight: 600 }}>As CareSignal’s sole Product Designer through acquisition</strong>,
				<br />
				our clinician web application was my responsibility. I combined my skills in product
				design, engineering, branding, and service design to take our app from a
				clinically‑proven proof of concept to a commercial product.
			</p>
		</div>
	);
}
