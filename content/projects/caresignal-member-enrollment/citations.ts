// Sources cited on this page, for the shared <Citation> component. Numbers
// are assigned page-wide by first appearance; repeats of a key share one.
export const CITATIONS = {
	kpi: {
		citeKey: 'kpi',
		title: 'Call center KPIs',
		source: 'CareSignal call center KPI reporting.',
	},
	touch: {
		citeKey: 'touch',
		title: 'Touchpoint tracking',
		source: 'Campaign touchpoint tracking for cohort 1, from the enrollment analytics sheet.',
	},
	sched: {
		citeKey: 'sched',
		title: 'Campaign schedule',
		source:
			'Campaign communication schedule: agent calls began in week 3. The 8+ figure is from CareSignal outreach data for call-only campaigns.',
	},
	dialer: {
		citeKey: 'dialer',
		title: 'Power dialer, first week',
		source:
			'Enrollment reporting meeting notes on the power dialer’s early data: a senior agent who normally made about 180 calls a day made 275 on her best day that first week, then trained a teammate.',
	},
	cost: {
		citeKey: 'cost',
		title: 'Cost per enrollment',
		source:
			'Campaign touchpoint and cost tracking for cohort 1: about $79 per enrollment from mail, email, and text alone, and about $19 once agent calls were layered on.',
	},
	email: {
		citeKey: 'email',
		title: 'Email benchmark',
		source:
			'Cohort 1 email reporting. Industry averages from Mailchimp’s benchmarks: insurance 21.36% opens, health 21.48% opens.',
	},
} as const;
