import type { ReactNode } from 'react';

import Section from '../../src/features/projects/components/Section';
import Text from '../../src/components/Text';
import { IllustrationPlaceholder } from '../../src/features/projects/components/Illustration';

// Brand asset directory. The five portraits + group photo are exported; every
// other slot renders a labelled placeholder at its Figma size until the user
// drops the exported asset in (see the case-study asset checklist).
const DIR = '/images/projects/caresignal-brand';

// Real exported photograph — object-cover inside a fixed-aspect rounded frame.
function Photo({
	src,
	alt,
	ratio,
	className,
}: {
	src: string;
	alt: string;
	ratio: string;
	className?: string;
}) {
	return (
		<div
			className={`overflow-hidden rounded-[12px] bg-[#f0eeeb] ${className ?? ''}`}
			style={{ aspectRatio: ratio }}
		>
			<img src={src} alt={alt} className="block size-full object-cover" />
		</div>
	);
}

// A body paragraph in the brand study's Copy Small measure (max 704px).
function Blurb({ children }: { children: ReactNode }) {
	return (
		<p className="type-copy m-0 max-w-[704px] text-confetti-black/80">{children}</p>
	);
}

// Brand callout card — italic title + copy-large body on the tinted paper.
// Smaller than the platform pull-quote Callout, matching the brand Figma.
function BrandCallout({
	title,
	children,
	className,
}: {
	title: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`flex h-full w-full flex-col gap-[16px] rounded-[8px] bg-[#f0eeeb] p-[24px] md:p-[32px] ${className ?? ''}`}
		>
			<Text variant="callout-title" className="m-0 text-confetti-black">
				{title}
			</Text>
			<div className="type-copy-large text-confetti-black">{children}</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Key Deliverables — Figma `Frame 221` top: heading, a two-up Mission / Vision
// callout row, and a full-width inline Values callout.
// ---------------------------------------------------------------------------
export function KeyDeliverables() {
	return (
		<Section>
			<div className="flex w-full flex-col gap-[24px]">
				<h2 className="type-headline-small m-0 text-confetti-black">Key Deliverables</h2>

				<div className="grid grid-cols-1 gap-[16px] md:grid-cols-2">
					<BrandCallout title="Mission">
						Highlight key moments for life-changing intervention, accentuating the care our partners provide.
					</BrandCallout>
					<BrandCallout title="Vision">
						Be the keystone for Standards of Care in digital health to deliver high-quality care to any patient.
					</BrandCallout>
				</div>

				<div className="flex w-full flex-col gap-[8px] rounded-[8px] bg-[#f0eeeb] p-[24px] md:flex-row md:items-baseline md:gap-[24px] md:p-[32px]">
					<Text variant="callout-title" className="m-0 shrink-0 text-confetti-black">
						Values
					</Text>
					<p className="type-copy-large m-0 text-confetti-black">
						Caring · Expert · Accessible · Impactful
					</p>
				</div>
			</div>
		</Section>
	);
}

// ---------------------------------------------------------------------------
// Brand visuals — Figma `Frame 221` imagery: brand overview, the four team
// portraits (real photos), stationery + website mockups, and the group photo.
// ---------------------------------------------------------------------------
export function BrandVisuals() {
	return (
		<Section>
			<div className="flex w-full flex-col gap-[16px]">
				<IllustrationPlaceholder
					name="Brand overview"
					width={944}
					height={531}
					background="#f0eeeb"
				/>

				<div className="grid grid-cols-2 gap-[16px] md:grid-cols-4">
					<Photo src={`${DIR}/jamie-lawrence.jpeg`} alt="Portrait of Jamie Lawrence" ratio="224 / 298" />
					<Photo src={`${DIR}/nathan-beck.jpeg`} alt="Portrait of Nathan Beck" ratio="224 / 298" />
					<Photo src={`${DIR}/jason-roche.jpeg`} alt="Portrait of Jason Roche" ratio="224 / 298" />
					<Photo src={`${DIR}/c-stavridis.jpeg`} alt="Portrait of C Stavridis" ratio="224 / 298" />
				</div>

				<IllustrationPlaceholder
					name="Stationery"
					width={944}
					height={708}
					background="#f0eeeb"
				/>
				<IllustrationPlaceholder
					name="Website mockup"
					width={944}
					height={660}
					background="#f0eeeb"
				/>

				<Photo
					src={`${DIR}/team-photo.jpeg`}
					alt="The CareSignal team gathered together for a group photo"
					ratio="944 / 671"
				/>
			</div>
		</Section>
	);
}

// ---------------------------------------------------------------------------
// Process — Figma `Frame 219`: the naming/rebrand narrative interleaved with
// research photos, interim-brand test, mark explorations, the objective /
// subjective criteria callouts, and closing image credits.
// ---------------------------------------------------------------------------
export function Process() {
	return (
		<Section>
			<div className="flex w-full flex-col gap-[28px]">
				<h2 className="type-headline-small m-0 text-confetti-black">Process</h2>

				<div className="flex flex-col gap-[16px]">
					<Blurb>
						As a fledgling company with a lean team and 12- to 18-month sales cycles, we were strapped for resources, namely, time. I needed to prove the value of our name change every step of the way. I started the process by conducting market research and interviewing buyers, clinical users, and patients. I led several workshops to build internal consensus and brand alignment by defining our mission, vision, and values.
					</Blurb>
					<Blurb>
						Using the data surfaced by those activities, I led a naming session with Karen, our Executive VP of Sales, and Jamie our Graphic Designer. We ended up with a shortlist of names and after researching trademarks and devising objective and subjective rubrics against which we measured our brand explorations. CareSignal won out.
					</Blurb>
				</div>

				<IllustrationPlaceholder
					name="Research & workshops"
					width={944}
					height={708}
					background="#f0eeeb"
				/>

				<Blurb>
					I priced out the cost of the rebrand. Designed and tested marks and visualizations. I aligned Account Success, Engineering, Marketing, and Sales to identify requirements to successful launches across all of our surfaces (clinical platform, patient-facing communications, industry announcements, marketing, etc.).
				</Blurb>

				<div className="flex flex-col items-center justify-center gap-[24px] rounded-[12px] bg-[#f0eeeb] p-[24px] md:flex-row">
					<IllustrationPlaceholder name="Interim full-page ad" width={305} height={390} background="#ffffff" />
					<IllustrationPlaceholder name="Interim landing page" width={529} height={418} background="#ffffff" />
				</div>

				<Blurb>
					After I priced out the costs of the rebrand in-house and with external consultants, we decided to move it in-house. Although we knew in our gut that CareSignal was better than Epharmix, we performed a quick A/B test with two conferences running at the same time. I quickly created an interim brand to test, including a landing page and full-page ad.
				</Blurb>

				<div className="grid grid-cols-2 gap-[16px] sm:grid-cols-3 md:grid-cols-5">
					<IllustrationPlaceholder name="Mark study 1" width={176} height={234} background="#f0eeeb" />
					<IllustrationPlaceholder name="Mark study 2" width={176} height={234} background="#f0eeeb" />
					<IllustrationPlaceholder name="Mark study 3" width={176} height={234} background="#f0eeeb" />
					<IllustrationPlaceholder name="Mark study 4" width={176} height={234} background="#f0eeeb" />
					<IllustrationPlaceholder name="Mark study 5" width={176} height={234} background="#f0eeeb" />
				</div>

				<Blurb>
					CareSignal lead to more leads and easier conversations than Epharmix. With that proof point, we sketched out marks and ran initial directions against our objective and subjective criteria with our internal team and designers within our networks.
				</Blurb>

				<div className="grid grid-cols-1 gap-[16px] md:grid-cols-2">
					<IllustrationPlaceholder name="Logo lockup" width={436} height={168} background="#f0eeeb" />
					<IllustrationPlaceholder name="Mark direction 1" width={436} height={168} background="#f0eeeb" />
					<IllustrationPlaceholder name="Mark direction 2" width={436} height={168} background="#f0eeeb" />
					<IllustrationPlaceholder name="Mark direction 3" width={436} height={168} background="#f0eeeb" />
				</div>

				<div className="grid grid-cols-1 gap-[16px] md:grid-cols-2">
					<BrandCallout title="Objective Criteria">
						<ol className="m-0 flex list-decimal flex-col gap-[8px] pl-[20px]">
							<li>Is it recognizable?</li>
							<li>Is it memorable?</li>
							<li>Is it unique in healthcare and legally protectable?</li>
							<li>Does it work across media and scale?</li>
							<li>Is it conducive to motion applications?</li>
						</ol>
					</BrandCallout>
					<BrandCallout title="Subjective Criteria">
						<ol className="m-0 flex list-decimal flex-col gap-[8px] pl-[20px]">
							<li>Does it communicate expertise in healthcare?</li>
							<li>Does it convey flexibility, dynamism, or nimbleness?</li>
							<li>Does it allude to our portfolio approach, that we’re not a single-point solution?</li>
							<li>Does it exude our friendly, do-whatever-it-takes approach to service?</li>
							<li>Will it standout memorably in a crowded space?</li>
							<li>Does the concept support the name “CareSignal”?</li>
							<li>How well does it communicate our core values?</li>
						</ol>
					</BrandCallout>
				</div>

				<IllustrationPlaceholder
					name="Final mark"
					width={944}
					height={365}
					background="#f0eeeb"
				/>

				<Blurb>
					The “fireworks” mark stood out with high marks across our criteria and when given the prompt to select their favorite mark without concerning the objective/subjective criteria. Most concerns raised about this mark were about its legibility at small sizes and if it were possible to convey the idea that CareSignal serves “rising-risk” patients.
				</Blurb>

				<div className="flex flex-col gap-[16px] md:flex-row md:items-start">
					<IllustrationPlaceholder name="Typography & colors" width={624} height={366} background="#f0eeeb" />
					<IllustrationPlaceholder name="Brand in use" width={304} height={366} background="#f0eeeb" />
				</div>

				<Blurb>
					As part of the update, Nathan and I researched content management systems to enable our Marketing team to update messaging on the fly. I eventually sourced HubSpot as one of the key tools in our Sales funnel and I coded our new marketing website and email templates in HubL.
				</Blurb>

				<ImageCredits />
			</div>
		</Section>
	);
}

// Image credits — Figma `Blurb` 4260:13285. Mono tag style with bold lead-ins.
function ImageCredits() {
	const credits: Array<{ lead: string; rest: string }> = [
		{ lead: 'Final Mark', rest: ' designed by C Stavridis; refined with Jamie Lawrence.' },
		{ lead: 'Team portraits and group photography', rest: ' taken and edited by Jamie Lawrence.' },
		{ lead: 'Stationery and Computer Mockups', rest: ' laid out by Jamie Lawrence.' },
		{
			lead: 'Final Designs in Mockups',
			rest: ' (Website, Folder, Letterhead, and Business Card) designed by C Stavridis with visual development by Jamie Lawrence.',
		},
		{ lead: 'Preliminary brand test', rest: ' (website and advertisement) designed by C Stavridis.' },
		{
			lead: 'Sketches and preliminary marks',
			rest: ' featured in process shots by Jamie Lawrence and C Stavridis.',
		},
	];
	return (
		<div className="mt-[8px] flex max-w-[704px] flex-col gap-[8px]">
			{credits.map((credit) => (
				<Text key={credit.lead} variant="tag" className="m-0 text-confetti-black/70">
					<span className="font-bold text-confetti-black">{credit.lead}</span>
					{credit.rest}
				</Text>
			))}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Visualizations — Figma `Frame 227`: a three-column explainer of the brand's
// core data-visualization idea (one column per audience).
// ---------------------------------------------------------------------------
export function Visualizations() {
	const columns: Array<{ name: string; caption: string; description: string }> = [
		{
			name: 'Disparate data points',
			caption: 'Disparate Data Points',
			description: 'For providers, CareSignal tools display which patients need care most.',
		},
		{
			name: 'Joined by trends',
			caption: 'Joined by Trends',
			description: 'For patients, CareSignal exchanges show that their clinical team cares for them.',
		},
		{
			name: 'Highlight new insights',
			caption: 'Highlight New Insights',
			description: 'For organizations, CareSignal services report where teams can make the most impact.',
		},
	];
	return (
		<Section>
			<div className="grid grid-cols-1 gap-[24px] md:grid-cols-3">
				{columns.map((column) => (
					<div key={column.caption} className="flex flex-col gap-[16px]">
						<IllustrationPlaceholder name={column.name} width={304} height={144} background="#f0eeeb" />
						<p className="type-tag m-0 font-bold text-confetti-black">{column.caption}</p>
						<p className="type-tag m-0 text-confetti-black/70">{column.description}</p>
					</div>
				))}
			</div>
		</Section>
	);
}
