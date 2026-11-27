// the line-art mountain on the home page. pure functions: the server draws the still,
// the island only moves the sun and moon across it.

export const VW = 420;
export const VH = 300;
const GROUND = 300;

type Pt = [number, number];

const PEAK = {
	left: [[104, 300], [172, 248], [202, 238], [228, 238], [252, 190], [272, 128], [290, 68]] as Pt[],
	right: [[290, 68], [312, 106], [323, 110], [350, 174], [382, 246], [402, 300]] as Pt[],
	back: [
		[[18, 300], [108, 206], [150, 238], [196, 196], [258, 260], [290, 300]],
		[[318, 300], [372, 222], [420, 262], [420, 300]],
	] as Pt[][],
};

function rng(a: number) {
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
const f2 = (v: number) => v.toFixed(2);
const poly = (pts: Pt[]) => 'M' + pts.map((p) => f2(p[0]) + ' ' + f2(p[1])).join('L');

/** a hand-cut wobble, the same every build */
function jag(pts: Pt[], seed: number, amt: number): Pt[] {
	const r = rng(seed);
	return pts.map(([x, y]) => [x + (r() - 0.5) * amt, y >= GROUND ? GROUND : y + (r() - 0.5) * amt]);
}

/** a topo ring: the ridge pulled down and in */
function contour(pts: Pt[], k: number, cx: number): Pt[] {
	return pts.map(([x, y]) => [cx + (x - cx) * (1 - 0.085 * k), GROUND - (GROUND - y) * (1 - 0.17 * k)]);
}

/** the hills, as svg markup. `fill` is the block's sky colour so the ridges hide the sun. */
export function hills(): string {
	const outline = [...jag(PEAK.left, 31, 0.5), ...jag(PEAK.right, 31, 0.5).slice(1)];
	let s = PEAK.back
		.map(
			(b, i) =>
				`<path d="${poly(jag(b, 7 + i, 0.4))}" fill="var(--sky)" stroke="var(--ink-3)" stroke-width=".7" stroke-linejoin="round"/>`,
		)
		.join('');
	s += `<path d="${poly([...outline, [VW + 60, GROUND]])}Z" fill="var(--sky)"/>`;
	const cx = PEAK.left.at(-1)![0];
	for (let k = 1; k <= 5; k++) {
		s += `<path d="${poly(contour(outline, k, cx))}" fill="none" stroke="var(--ink-3)" stroke-width=".7"${k % 2 ? '' : ' stroke-dasharray="2 3"'}/>`;
	}
	s += `<path d="${poly(outline)}" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>`;
	return s;
}

/** one day and one night every 120s. 56% of the loop is day. */
export const CYCLE = 120_000;
const DAY = 0.56;

export type Sky = { day: boolean; x: number; y: number; night: number };

/** where the sun (or moon) is at loop phase `p` (0..1), and how dark the sky is */
export function sky(p: number): Sky {
	const day = p < DAY;
	const u = day ? p / DAY : (p - DAY) / (1 - DAY);
	const x = 18 + u * 384;
	const y = 292 - Math.sin(u * Math.PI) * 236;
	let night = 0;
	if (!day) night = Math.min(1, u / 0.18, (1 - u) / 0.18);
	else night = Math.max(0, 1 - Math.min(u, 1 - u) / 0.06) * 0.35;
	return { day, x, y, night };
}

/** the phase the server paints: mid-morning */
export const STILL = 0.16;
