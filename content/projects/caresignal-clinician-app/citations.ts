// Citation sources for the CareSignal Clinician Application case study, in
// DOM order. Several are placeholders the handoff README flags as open
// content items — fill before launch.
export type CitationSource = {
	title: string;
	source: string;
	href?: string;
};

const EPHARMIX_ENGAGEMENT: CitationSource = {
	title: 'Patient engagement',
	source:
		'Epharmix study, JMIR Formative Research (2017): at least 80% weekly patient engagement for nine consecutive months across 929 patients.',
	href: 'https://www.caresignal.health/news/2017/09/21/study-sms-texting-phone-based-platform-epharmix-maintains-80-patient-engagement-during-9-month-study-while-collecting-patient-generated-health-data-alerting-pr',
};

const PLACEHOLDER = 'Placeholder — source and details to come.';

export const CITATIONS = {
	engagement: EPHARMIX_ENGAGEMENT,
	visitLength: { title: 'Visit length', source: PLACEHOLDER },
	visitFrequency: { title: 'Visit frequency', source: PLACEHOLDER },
	wakingHours: {
		title: 'Waking Hours',
		source:
			'The estimate of 6,208 waking hours assumes that the average American adult sleeps seven hours a day. Based on data collected by the CDC from the 2014 Behavioral Risk Factor Surveillance System (BRFSS), 2 in 3 adults, 18 to 60, reported sleeping 7 hours or more per day.',
	},
	historicalData: {
		title: 'Historical data',
		source:
			'Good candidates are usually identified via claims, diagnoses, or recent hospital use.',
	},
	standardCaseload: { title: 'Standard caseload', source: PLACEHOLDER },
	standardCaseload2: {
		title: 'Standard caseload (second source)',
		source: PLACEHOLDER,
	},
	dialysisProgram: { title: 'Dialysis program', source: PLACEHOLDER },
	prototypeRoi: { title: 'Prototype ROI', source: PLACEHOLDER },
	dialysisRct: { title: 'Dialysis RCT', source: PLACEHOLDER },
	dialysisResults: { title: 'Dialysis trial results', source: PLACEHOLDER },
	publications: { title: 'Peer-reviewed publications', source: PLACEHOLDER },
	salesCycle: { title: 'Enterprise sales cycle', source: PLACEHOLDER },
} satisfies Record<string, CitationSource>;
