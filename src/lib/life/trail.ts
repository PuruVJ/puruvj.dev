// the trail on /life: one 1px line that winds down the page, drawn in pieces that join up.
// every piece is an svg stretched over its stretch of page (preserveAspectRatio none), 1200 units
// wide, so x is in twelfths of the page: x = 3 is a quarter of the way across. the line keeps a
// 1px stroke however it is stretched (vector-effect), and every piece starts and ends going straight
// down, so where two pieces meet the line runs on without a kink. pure: it returns path data.

export const W = 1200;
const u = (c: number) => +(c * 100).toFixed(2);
const f = (n: number) => +n.toFixed(2);

// a trail walked by a person, not drawn by a ruler: it meanders in long slow curves, shakes a
// little all the way, and now and then something happens: a switchback up a steep bit, a kink
// round a rock, . every piece is seeded, so it
// is the same on every load, and every piece still leaves its ends going straight down at the
// exact lane, so the pieces join without a seam.

let n = 0;
function rng(seed: number) {
	return () => {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
/** zero at both ends, with zero slope there too, so the ends stay straight and on the lane */
const env = (t: number) => Math.sin(Math.PI * t) ** 2;

type Kind = 'switchback' | 'kink';
/** walk from t = 0 to 1 along a base x(t), adding the wander, the shake and the incidents */
function walk(base: (t: number) => number, wander: number, incidents: Kind[], seed: number, lift = 0) {
	const r = rng(seed);
	const f1 = wander < 20 ? 0.5 : 1 + r() * 1.2;
	const f2 = wander < 20 ? 1 : 1.8 + r() * 1.2;
	const p1 = r() * 6.28;
	const p2 = r() * 6.28;
	const a2 = wander * (0.25 + r() * 0.2);
	const g1 = 1.5 + r() * 1;
	const g2 = 3.2 + r() * 1.6;
	const f3 = 2.5 + r() * 1.5;
	const p3 = r() * 6.28;
	// a short stretch is squeezed into little height, where any tremor reads as a zigzag: none
	const a3 = wander < 20 ? 0 : 1.5;
	// incidents sit away from the ends, spread out
	const at = incidents.map((k, i) => ({ k, t: 0.22 + ((i + 0.3 + r() * 0.4) / incidents.length) * 0.56, side: r() < 0.5 ? -1 : 1 }));
	const N = 160;
	let d = '';
	let pen = false;
	for (let i = 0; i <= N; i++) {
		const t = i / N;
		let x = base(t) + env(t) * (wander * Math.sin(Math.PI * 2 * f1 * t + p1) + a2 * Math.sin(Math.PI * 2 * f2 * t + p2));
		// the hand: a fine, uneven tremor (smooth, not jagged: a pen wobbles, it doesn't buzz)
		x += env(t) * (a3 * Math.sin(Math.PI * 2 * f3 * t + p3) + a3 * 0.6 * Math.sin(Math.PI * 2 * f3 * 1.9 * t + p2));
		for (const c of at) {
			// wide and soft: a lane is stretched to whatever height its section has, so anything
			// short or sharp turns into a spike or a squiggle once stretched. a long, slow detour
			// survives any height and still reads as the path stepping round something.
			const u = (t - c.t) / 0.2;
			if (Math.abs(u) > 1) continue;
			const bell = (1 + Math.cos(Math.PI * u)) / 2;
			if (c.k === 'switchback') x += c.side * 26 * Math.sin(u * Math.PI) * bell;
			if (c.k === 'kink') x += c.side * 20 * bell;
		}
		// and it rises and dips as it goes, like ground that isn't flat: on a crossing, where the
		// line runs mostly sideways, this is what keeps it from reading as a ruled diagonal
		const y = t * 100 + env(t) * lift * (Math.sin(Math.PI * 2 * g1 * t + p1 * 1.3) + 0.5 * Math.sin(Math.PI * 2 * g2 * t + p2 * 0.7));
		d += `${pen ? 'L' : 'M'}${f(x)} ${f(y)}`;
		pen = true;
	}
	return d;
}

// one soft detour per long stretch; the path never breaks (a gap read as a broken line)
const pick = (r: () => number, long: boolean): Kind[] => (long ? [r() < 0.5 ? 'kink' : 'switchback'] : []);

/** a lane: the line walking down one place on the page, wandering on the way. `wander` is how far
 *  it strays, in 1200ths of the page; a short stretch strays less */
export const lane = (x: number, wander = 34) => {
	const seed = ++n * 977 + Math.round(x * 100);
	const r = rng(seed);
	const X = u(x);
	return walk(() => X, wander === 0 ? 10 : wander, pick(r, wander > 0), seed + 1);
};

/** a bend: the line swinging across the page from one lane to another, the way a path crosses a
 *  slope: not one clean sweep, a little uneven on the way */
export const bend = (a: number, b: number) => {
	const seed = ++n * 613 + Math.round(a * 37 + b * 101);
	const A = u(a);
	const B = u(b);
	// the old clean curve, as a function of t, for the walk to wander around
	const base = (t: number) => {
		const m = 1 - t;
		return m * m * m * A + 3 * m * m * t * A + 3 * m * t * t * B + t * t * t * B;
	};
	return walk(base, 10, [], seed, 9);
};

/** where a lane sits, as a left offset in css */
export const at = (x: number) => `${+((x / 12) * 100).toFixed(4)}%`;

/** a stop on the lane at x, with a short leader running sideways to its caption at `to` */
export const stop = (x: number, to: number) =>
	`--x: ${at(x)}; --l: ${at(Math.min(x, to))}; --w: ${at(Math.abs(to - x))}`;

// ---------- the mountains: the line climbs ----------
// the band is PH px tall and does not stretch in height, only in width. the line comes down the
// left lane, settles on the valley floor, climbs over the three treks, and leaves down the right.

export const PH = 250;
const BASE = 222;
const IN = 1; // the lane it comes down
export const OUT = 11.5; // the lane it leaves by

/** the three summits, in twelfths across and px above the band's top. kedarkantha stands tallest:
 *  12k ft, the one height on the page. the others are drawn, not measured. */
export const PEAKS = [
	{ x: 2.4, top: 30, w: 1.25 },
	{ x: 5.5, top: 64, w: 1.45 },
	{ x: 8.5, top: 78, w: 1.25 },
];
/** the next one: a peak in pencil, not walked yet */
export const NEXT = { x: 10.5, top: 74, w: 0.65 };

// a deterministic wobble, so the ridge is rough the same way on every load
const wob = (x: number) => Math.sin(x * 1.7) * 3.2 + Math.sin(x * 4.3 + 1) * 2 + Math.sin(x * 9.1 + 2) * 1.1;

const height = (x: number, peaks: { x: number; top: number; w: number }[]) => {
	let h = 0;
	for (const p of peaks) {
		const d = Math.abs(x - p.x) / p.w;
		if (d < 1) h = Math.max(h, (BASE - p.top) * (1 - d) ** 1.35);
	}
	return h;
};

const ridge_y = (c: number, peaks = PEAKS) => {
	const h = height(c, peaks);
	// rough on the slopes, smooth on the valley floor and right at the summit
	const rough = h > 4 ? wob(c * 10) * Math.min(1, h / 40) * (1 - Math.exp(-((c - nearest(c, peaks)) ** 2) * 30)) : 0;
	return BASE - h + rough;
};
const nearest = (c: number, peaks: { x: number }[]) =>
	peaks.reduce((a, p) => (Math.abs(p.x - c) < Math.abs(a - c) ? p.x : a), peaks[0].x);

/** the solid line: down the left lane, over the three summits, out down the right lane */
export const climb = () => {
	const pts: string[] = [];
	for (let c = 1.15; c <= 11.0001; c += 0.05) pts.push(`${u(c)} ${f(ridge_y(c))}`);
	return (
		`M${u(IN)} 0L${u(IN)} ${BASE - 40}C${u(IN)} ${BASE - 10} ${u(IN + 0.04)} ${BASE} ${u(1.15)} ${BASE}` +
		`L${pts.join('L')}` +
		`C${u(11.35)} ${BASE} ${u(OUT)} ${BASE + 4} ${u(OUT)} ${PH}`
	);
};

/** the pencil peak: a dashed hill standing on the valley floor */
export const pencil = () => {
	const pts: string[] = [];
	for (let c = NEXT.x - NEXT.w; c <= NEXT.x + NEXT.w + 0.0001; c += 0.05) pts.push(`${u(c)} ${f(ridge_y(c, [NEXT]))}`);
	return `M${pts.join('L')}`;
};

/** the phone's version: the line runs straight down the left edge, and the ridge branches off it */
export const climb_phone = () => {
	const all = [...PEAKS.map((p) => ({ ...p, x: (p.x - 1) * 1.2 })), { ...NEXT, x: (NEXT.x - 1) * 1.2 }];
	const solid = all.slice(0, 3);
	const pts: string[] = [];
	for (let c = 0; c <= 12.0001; c += 0.05) pts.push(`${u(c)} ${f(ridge_y(c, solid))}`);
	const ghost: string[] = [];
	const n = all[3];
	for (let c = n.x - n.w; c <= n.x + n.w + 0.0001; c += 0.05) ghost.push(`${u(c)} ${f(ridge_y(c, [n]))}`);
	return { solid: `M${pts.join('L')}`, pencil: `M${ghost.join('L')}`, peaks: all };
};

/** the summit marks: a short plumb line from each summit down to the valley floor */
export const plumb = (p: { x: number; top: number }) => `M${u(p.x)} ${p.top + 10}V${BASE - 4}`;
