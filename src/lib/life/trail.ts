// the trail on /life: one 1px line that winds down the page, drawn in pieces that join up.
// every piece is an svg stretched over its stretch of page (preserveAspectRatio none), 1200 units
// wide, so x is in twelfths of the page: x = 3 is a quarter of the way across. the line keeps a
// 1px stroke however it is stretched (vector-effect), and every piece starts and ends going straight
// down, so where two pieces meet the line runs on without a kink. pure: it returns path data.

export const W = 1200;
const u = (c: number) => +(c * 100).toFixed(2);
const f = (n: number) => +n.toFixed(2);

/** a lane: the line walking down one place on the page, wandering a little on the way (a short
 *  stretch walks straight: squeezed into a few px, the wander would read as a kink) */
export const lane = (x: number, wander = 5) => {
	const X = u(x);
	return `M${X} 0L${X} 6C${f(X + wander)} 30 ${f(X - wander)} 62 ${X} 90L${X} 100`;
};

/** a bend: the line swinging across the page from one lane to another */
export const bend = (a: number, b: number) => `M${u(a)} 0C${u(a)} 58 ${u(b)} 42 ${u(b)} 100`;

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
