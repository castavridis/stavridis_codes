// nav-gum — the sticky section-nav card "peels" off the page like chewed gum
// when it sticks: it strains up on invisible strands that snap one by one
// (border + shadow building in), then springs free; un-sticking plays a squish
// back down. Framework-agnostic, like the orbit / wash-drop modules — the repo's
// SectionNav and the design's dc page can both drive it from a stick/unstick
// transition instead of each carrying gumPeel/gumPress on a Component class.
//
// The card must read its border + shadow from CSS custom properties, so a host
// framework's static style can't clobber the running animation:
//   border-color: var(--nav-border, transparent);
//   box-shadow:   var(--nav-shadow, 0 4px 14px rgba(57,31,0,0));
//
// API: peel(card, scroller) on stick (scroller = the scroll container, or null
// to read window.scrollY); press(card) on unstick; set(card, stuck, {animate})
// for the resting chrome (initial / reduced motion); end(card) to cancel.

const INK = 'var(--color-confetti-black)';
const STUCK_SHADOW = '0 4px 14px rgba(57,31,0,0.10)';
const CLEAR_SHADOW = '0 4px 14px rgba(57,31,0,0)';
const TRANSITION =
	'border-color 260ms ease, background-color 260ms ease, box-shadow 260ms ease';

const gums = new WeakMap();

function setVars(card, border, shadow) {
	card.style.setProperty('--nav-border', border);
	card.style.setProperty('--nav-shadow', shadow);
}

export function set(card, stuck, opts = {}) {
	if (!card) return;
	card.style.transition = opts.animate ? TRANSITION : '';
	setVars(card, stuck ? INK : 'transparent', stuck ? STUCK_SHADOW : CLEAR_SHADOW);
}

export function end(card) {
	const g = card && gums.get(card);
	if (!g) return;
	cancelAnimationFrame(g.raf);
	gums.delete(card);
}

export function peel(card, scroller) {
	if (!card || gums.has(card)) return;
	const n = 3 + Math.floor(Math.random() * 2);
	const strands = Array.from({ length: n }, () => ({
		snap: 34 + Math.random() * 70,
		at: 0,
	}));
	const sy0 = scroller ? scroller.scrollTop : window.scrollY;
	card.style.transition = 'none';
	const look = (lift, k) => {
		const L = Math.max(0, Math.min(1.15, lift));
		setVars(
			card,
			`color-mix(in srgb, var(--color-confetti-black) ${Math.round(Math.min(1, L) * 100)}%, transparent)`,
			`0 ${(1 + 3 * L + 3 * k).toFixed(1)}px ${(4 + 10 * L + 8 * k).toFixed(1)}px rgba(57,31,0,${(0.1 * L + 0.04 * k).toFixed(3)})`,
		);
	};
	const done = () => {
		card.style.transition = TRANSITION;
		setVars(card, INK, STUCK_SHADOW);
		card.style.transform = '';
		card.style.transformOrigin = '';
	};
	const g = { raf: 0, lift: 0, kick: 0, last: 0, t0: 0, sprung: false, done };
	gums.set(card, g);
	const tick = (now) => {
		if (gums.get(card) !== g) return;
		if (!g.t0) g.t0 = now;
		const cur = scroller ? scroller.scrollTop : window.scrollY;
		const Lp = Math.max(0, cur - sy0);
		const age = now - g.t0;
		const dt = Math.min(0.05, (now - (g.last || now)) / 1000);
		g.last = now;
		let held = 0;
		let k = 0;
		for (const s of strands) {
			if (!s.at && (Lp >= s.snap || age > 1100 + s.snap * 6 || cur < sy0 - 4)) {
				s.at = now;
				g.kick += 0.35;
			}
			if (!s.at) {
				held++;
				k = Math.max(k, Math.min(1, Lp / s.snap));
			}
		}
		const target = (n - held) / n;
		g.lift += (target + g.kick - g.lift) * (1 - Math.exp(-dt * 14));
		g.kick *= Math.exp(-dt * 9);
		look(g.lift, held ? k : 0);
		if (held) {
			card.style.transformOrigin = '50% 100%';
			card.style.transform = `translateY(${(-k * 6).toFixed(2)}px) scaleY(${(1 + k * 0.025).toFixed(4)})`;
		} else if (!g.sprung) {
			g.sprung = true;
			card.style.transform = '';
			card.animate?.(
				[
					{ transform: `translateY(${-k * 6}px)`, transformOrigin: '50% 100%' },
					{ transform: 'translateY(3px) scaleY(0.985)', transformOrigin: '50% 100%', offset: 0.45 },
					{ transform: 'translateY(-1px) scaleY(1.004)', transformOrigin: '50% 100%', offset: 0.75 },
					{ transform: 'none', transformOrigin: '50% 100%' },
				],
				{ duration: 480, easing: 'cubic-bezier(.2,.7,.3,1)' },
			);
		}
		if (!held && Math.abs(g.lift - 1) < 0.01 && g.kick < 0.01) {
			gums.delete(card);
			done();
			return;
		}
		g.raf = requestAnimationFrame(tick);
	};
	g.raf = requestAnimationFrame(tick);
}

export function press(card) {
	if (!card) return;
	end(card);
	card.style.transition = TRANSITION;
	setVars(card, 'transparent', CLEAR_SHADOW);
	card.animate?.(
		[
			{ transform: 'scaleY(1)', transformOrigin: '50% 0' },
			{ transform: 'scaleY(0.975) scaleX(1.01)', transformOrigin: '50% 0', offset: 0.4 },
			{ transform: 'none', transformOrigin: '50% 0' },
		],
		{ duration: 320, easing: 'ease-out' },
	);
}

export default { peel, press, end, set };
