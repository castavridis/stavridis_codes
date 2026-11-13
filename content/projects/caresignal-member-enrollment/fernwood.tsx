import type { ReactNode } from 'react';

// Recreations of the enrollment materials under a fictional brand,
// Fernwood Health. Static, presentational markup; styles live under `.mk`
// in member-enrollment.css. Several pieces appear more than once (the
// postcard back and email in both the hero and the redesign figure), so
// each is a component with the variant differences as props.

function Logo({ dark = false }: { dark?: boolean }) {
	return (
		<span className={dark ? 'logo dark' : 'logo'}>
			<i />
			Fernwood Health
		</span>
	);
}

// ── Postcard ────────────────────────────────────────────────

export function PostcardFront() {
	return (
		<div className="pc">
			<div className="pc-top">
				<h5>Introducing Fernwood Heart Care</h5>
				<b>For a life well-lived, follow your heart</b>
				<p>
					Your journey to a long, happy life begins on a heart-healthy path.
					Take that journey with Fernwood Health at your side. A new program
					gives eligible members the support they need, when they need it, at
					no extra cost. <i>Learn more ▸</i>
				</p>
			</div>
			<div className="pc-addr">
				<Logo dark />
				<div>
					Fernwood Health c/o CareSignal
					<br />
					<br />
					Member Name
					<br />
					123 Main Street
					<br />
					Anytown, USA 00000
				</div>
				<div className="stamp">
					PRSRT STD
					<br />
					U.S. POSTAGE
					<br />
					PAID
				</div>
			</div>
		</div>
	);
}

export function PostcardBack({ rounded = false }: { rounded?: boolean }) {
	return (
		<div className={rounded ? 'pc mk' : 'pc'}>
			<div className="pc-bt">
				<h5>
					Care Tailored to <em>You</em>
				</h5>
				<p>
					Fernwood Heart Care is a new program provided at no cost. Eligible
					members will get the added support they need when they need it.
					Check your eligibility today. Do it for yourself, for your heart, and
					for everyone who loves you.
				</p>
				<div className="pc-badge">
					<b>Don’t miss out!</b>Space is limited. Enroll by 4/11 to keep your
					spot.
				</div>
			</div>
			<div className="pc-bb">
				<h6>
					Check your eligibility in <em>one of three ways</em>
				</h6>
				<ol>
					<li>
						<b>1 · Answer our call</b>An enrollment coordinator will call you in
						the next two weeks.
					</li>
					<li>
						<b>2 · Give us a ring</b>Enroll right away by calling 1 (800)
						555-0100.
					</li>
					<li>
						<b>3 · Visit us online</b>Use our self-service web portal:
						fhp.link/m1
					</li>
				</ol>
			</div>
		</div>
	);
}

export function PostcardBackRedesign() {
	return (
		<div className="pc mk">
			<div className="pc-deadline">Enroll by April 11 to keep your spot</div>
			<div className="pc-bt">
				<h5>Join in one minute, online</h5>
				<div className="pc-code">
					<span>Go to</span>
					<b>fhp.link/07BH6L9K</b>
					<span>Your code</span>
					<b className="code">07BH 6L9K</b>
				</div>
				<p>Your code is built into the link. No app, no password, no cost.</p>
			</div>
			<div className="pc-bb">
				<h6>Prefer the phone?</h6>
				<ol className="two">
					<li>
						<b>Call us</b>1 (800) 555-0100
					</li>
					<li>
						<b>Or answer our call</b>A coordinator will call you within two
						weeks.
					</li>
				</ol>
			</div>
		</div>
	);
}

// ── Email ───────────────────────────────────────────────────

function EmailFrame({
	subject,
	preheader,
	children,
}: {
	subject: string;
	preheader: string;
	children: ReactNode;
}) {
	return (
		<div className="mk mk-email">
			<div className="em">
				<div className="em-subj">
					<b>{subject}</b>
					<br />
					{preheader}
				</div>
				<div className="em-logo">
					<Logo dark />
				</div>
				{children}
				<div className="em-foot">Unsubscribe · Fernwood Health</div>
			</div>
		</div>
	);
}

function EmailFold() {
	return (
		<div className="em-fold">
			<span>typical phone screen ends here</span>
		</div>
	);
}

// The email as shipped. `short` drops the three benefit paragraphs (the
// portal figure shows it beside the form, where only the fold matters).
export function Email({ short = false }: { short?: boolean }) {
	return (
		<EmailFrame
			subject="Take Control of your Heart Health with Fernwood Heart Care"
			preheader="This new benefit is for select members. Check your eligibility today."
		>
			<div className="em-hd">
				<h5>Introducing Better Heart Health with Fernwood Heart Care</h5>
				<div className="em-img" aria-hidden="true">
					♥
				</div>
			</div>
			<div className="em-body">
				<p>
					<b>For a life well-lived, follow your heart.</b> When you live with
					heart failure or high blood pressure, your journey to a long and
					happy life begins with taking good care of your heart.
				</p>
				<p>
					Fernwood Heart Care gives you an easy way to monitor your numbers and
					receive assistance from home, at no added cost.
				</p>
				{short ? null : (
					<>
						<p>
							<b>Take control of your heart health:</b> Track your numbers over
							automated text messages or phone calls.
						</p>
						<p>
							<b>Share your numbers:</b> Depending on your numbers, someone from
							Fernwood may reach out to connect you to the right care.
						</p>
						<p>
							<b>Set your mind at ease:</b> You’ll get personalized support via
							phone or text when you need a little extra attention.
						</p>
					</>
				)}
				<EmailFold />
				<p style={{ textAlign: 'center' }}>
					<b>Join Fernwood Heart Care.</b>
				</p>
				<div className="em-btn">JOIN NOW</div>
				<div className="em-code">
					Your Quick Access Code:<b>07BH6L</b>
				</div>
			</div>
		</EmailFrame>
	);
}

export function EmailRedesign() {
	return (
		<EmailFrame
			subject="Your heart health check-ins are ready to start"
			preheader="Free for select Fernwood members. Takes one minute."
		>
			<div className="em-hd">
				<h5>A care team watching your heart health, at no cost to you</h5>
			</div>
			<div className="em-body">
				<p>
					Check in by text or phone from home. If your numbers change, a nurse
					reaches out.
				</p>
				<div className="em-btn">CHECK MY ELIGIBILITY</div>
				<div className="em-code">
					Your code is built into the button:<b>07BH 6L9K</b>
				</div>
				<EmailFold />
				<p>
					<b>Take control of your heart health:</b> track your numbers by text
					or phone.
				</p>
				<p>
					<b>Share your numbers:</b> your care team connects you to the right
					care.
				</p>
			</div>
		</EmailFrame>
	);
}

// ── Letter ──────────────────────────────────────────────────

export function Letter() {
	return (
		<div className="mk mk-letter">
			<div className="lt-top">
				<span className="logo dark" style={{ fontSize: 13 }}>
					<i />
					Fernwood Health
				</span>
				<div className="lt-call">
					You’ll love this new heart-healthy program for select members:
					Fernwood Heart Care. Enroll by <b>April 11</b>. Call{' '}
					<b>1 (800) 555-0100</b> or visit <b>fhp.link/m2</b>.
				</div>
			</div>
			<p>Dear Member,</p>
			<p>
				As vice president of medical management at Fernwood Health, I’m in
				charge of helping you get the right care.
			</p>
			<p>
				When you live with heart failure or high blood pressure, your journey to
				a long and happy life begins with taking good care of your heart. I’m
				pleased to announce that you now have access to Fernwood Heart Care, a
				free program to help you take control of your heart health.
			</p>
			<p>
				Once you’re enrolled, you can connect for added support by phone or text
				from home. There’s no app to download or website to log in to.
			</p>
			<p>We look forward to walking beside you on a heart-healthy journey.</p>
			<div className="lt-sig">Medical Director signature</div>
			<p style={{ fontSize: 9, color: '#555' }}>
				Vice President of Medical Management · Fernwood Health
			</p>
		</div>
	);
}

// ── Texts ───────────────────────────────────────────────────

export function Sms({ messages }: { messages: ReactNode[] }) {
	return (
		<div className="mk mk-sms">
			<div className="sms-from">Fernwood Health</div>
			{messages.map((m, i) => (
				<div key={i} className="sms">
					{m}
				</div>
			))}
		</div>
	);
}

const SMS_FOLLOW_UP =
	'We’ll send more information over time. You have until 4/11 to take advantage of this program. Text ENROLL at any time to enroll, STOP to end future messages.';

// First text as sent (touchpoint strip: phone number in the body).
export function SmsIntro() {
	return (
		<Sms
			messages={[
				'It’s Fernwood Health, your health plan. We have a new program to enhance the care you receive. Call 1-800-555-0100 for more information. Message and data rates may apply.',
				SMS_FOLLOW_UP,
			]}
		/>
	);
}

// First text as sent, link variant (the one the redesign figure critiques).
export function SmsIntroLink() {
	return (
		<Sms
			messages={[
				<>
					It’s Fernwood Health, your health plan. We have a new program to
					enhance the care you receive. Learn more at <u>fhp.link/t1</u>.
					Message and data rates may apply.
				</>,
				SMS_FOLLOW_UP,
			]}
		/>
	);
}

export function SmsRedesign() {
	return (
		<Sms
			messages={[
				<>
					It’s Fernwood Health, your health plan. You’re invited to a free heart
					health program. Join in 1 minute, your code is already filled in:{' '}
					<u>fhp.link/07BH6L9K</u>
				</>,
				'Prefer to talk? Call 1-800-555-0100. Enroll by 4/11. Reply STOP to opt out.',
			]}
		/>
	);
}

// ── Self-enrollment portal ──────────────────────────────────

function PortalShell({ url, children }: { url?: string; children: ReactNode }) {
	return (
		<div className="mk mk-portal">
			<div className="pt">
				{url ? <div className="pt-url">🔒 {url}</div> : null}
				<div className="pt-bar">
					<Logo />
				</div>
				{children}
			</div>
		</div>
	);
}

function Field({
	label,
	value,
	wide = false,
	placeholder = false,
}: {
	label: string;
	value?: string;
	wide?: boolean;
	placeholder?: boolean;
}) {
	return (
		<div className={wide ? 'w' : undefined}>
			<span className="lbl">
				{label} <span>(required)</span>
			</span>
			<div className={placeholder ? 'pt-in ph' : 'pt-in'}>{value}</div>
		</div>
	);
}

// Screens 1–2: the verification form. `tip` shows the name-field help.
export function PortalForm({ url, tip = false }: { url: string; tip?: boolean }) {
	return (
		<PortalShell url={url}>
			<div className="pt-body">
				<div className="pt-f">
					{tip ? (
						<div className="pt-tip" style={{ right: 6, top: -18 }}>
							Your first and last name, as they appear on your Fernwood Health
							member card
						</div>
					) : null}
					<Field label="First Name" value="Elizabeth" />
					<Field label="Last Name" value="Blackwell" />
					<Field label="Date of Birth" value="02/03/1821" wide />
					<Field label="ZIP Code" value="00000" wide />
					<Field label="Your Unique Code or Member ID" value="07BH 6L9K" wide />
				</div>
				<div className="pt-link">Can’t find your unique code?</div>
				<div className="pt-btn">Join Now</div>
			</div>
		</PortalShell>
	);
}

// Screen 3: “Can’t find your unique code?” expanded.
export function PortalHelp() {
	return (
		<PortalShell url="fhp.link/join">
			<div className="pt-body">
				<div className="pt-f">
					<Field label="Your Unique Code or Member ID" wide placeholder />
				</div>
				<div className="pt-link">Can’t find your unique code?</div>
			</div>
			<div className="pt-help">
				That’s ok! You may use your Member ID. It’s on your Fernwood Health card
				in the areas highlighted below.
				<div className="pt-card">
					<Logo />
					ID: <mark>W1234 56789</mark>-01
					<br />
					NAME: <mark>JOHN Q SAMPLE</mark>
					<br />
					PCP: Dr. Example · GRP: 123456
				</div>
				<div className="pt-card" style={{ marginLeft: 24 }}>
					<Logo />
					MEMBER: <mark>MARY JONES</mark>
					<br />
					ID #: <mark>BBCCDDFA</mark>
				</div>
			</div>
			<div className="pt-body">
				<div className="pt-btn">Join Now</div>
			</div>
		</PortalShell>
	);
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Screens 4–5: program settings. `confirm` fills the form and shows the
// confirmation dialog over it.
export function PortalSettings({ confirm = false }: { confirm?: boolean }) {
	const picked = confirm ? ['Wed', 'Fri'] : [];
	return (
		<PortalShell>
			<div className="pt-body">
				<h5>Choose your program settings</h5>
				<div className="pt-opt">
					<span className="pt-cb" />
					<div>
						<b>Track blood pressures</b>Send in your blood pressure readings
						after you take them.
					</div>
				</div>
				<div className="pt-opt off">
					<span className="pt-cb" />
					<div>
						<b>Concerns about housing, food, or transportation?</b>Your care
						team can refer you to the right resources.
					</div>
				</div>
				<div className="pt-q">What is the best phone number for you?</div>
				<div className={confirm ? 'pt-in' : 'pt-in ph'}>
					{confirm ? '555-555-0100' : 'XXX-XXX-XXXX'}
				</div>
				<div className="pt-q">Calls or texts?</div>
				<div className="pt-radio">
					<span>
						<i className="on" />
						Text Message
					</span>
					<span>
						<i />
						Phone Call
					</span>
				</div>
				<div className="pt-note">
					Texts are not encrypted. By choosing texts, you accept the risk that
					someone other than you could see health information. Standard message
					and data rates may apply.
				</div>
				<div className="pt-q">Which language do you prefer?</div>
				<div className="pt-radio">
					<span>
						<i className="on" />
						English
					</span>
					<span>
						<i />
						Spanish
					</span>
				</div>
				<div className="pt-q">Which days? Select 2</div>
				<div className="pt-days">
					{DAYS.map((d) => (
						<span key={d} className={picked.includes(d) ? 'on' : undefined}>
							{d}
						</span>
					))}
				</div>
				<div className="pt-btn">Confirm Preferences</div>
			</div>
			{confirm ? (
				<div className="pt-dim">
					<div className="pt-dialog">
						<b>Confirm enrollment</b>
						<p>
							Are your settings correct? You may click cancel to edit your
							settings.
						</p>
						<div className="acts">
							<span>Cancel</span>
							<span className="p">Confirm</span>
						</div>
					</div>
				</div>
			) : null}
		</PortalShell>
	);
}
