// the mountain on the home page: flat sheets of grey, like a print. a back range, one peak with a
// lit face and a shadow face, and a cap of snow. pure functions: the server draws the still,
// the island only moves the sun and moon behind it.

export const VW = 400;
export const VH = 300;

type Pt = [number, number];

// one broad mountain: a long walk-in from the left, a resting shoulder, the summit two thirds of the
// way across, then a long right shoulder that runs off the edge of the block. drawn, not random.
const PEAK = {
	left: [[36, 300], [92, 264], [138, 242], [178, 234], [204, 214], [234, 160], [258, 106], [282, 52]] as Pt[],
	right: [[282, 52], [300, 78], [320, 94], [346, 140], [374, 168], [404, 194], [440, 222], [440, 300]] as Pt[],
	// where the lit face turns into the shadow face
	crease: [[290, 150], [298, 300]] as Pt[],
	snow: [[282, 52], [267.2, 84], [275, 79], [282, 90], [290, 80], [300, 78]] as Pt[],
	// a lower range behind, peeking out on both sides
	back: [
		[[-220, 300], [-220, 268], [-150, 236], [-84, 258], [-14, 222], [52, 214], [100, 246], [160, 196], [206, 226], [226, 300]],
		[[310, 300], [350, 172], [392, 156], [440, 182], [440, 300]],
	] as Pt[][],
};

const poly = (pts: Pt[]) => 'M' + pts.map((p) => `${p[0]} ${p[1]}`).join('L') + 'Z';

/** the hills, as svg markup. the colours come from css (see Mountain.svelte). */
export function hills(): string {
	const top = PEAK.left.at(-1)!;
	const shade = [top, ...PEAK.right.slice(1), PEAK.crease[1], PEAK.crease[0]];
	return (
		PEAK.back.map((b) => `<path class="m-back" d="${poly(b)}"/>`).join('') +
		`<path class="m-lit" d="${poly([...PEAK.left, ...PEAK.right.slice(1)])}"/>` +
		`<path class="m-shade" d="${poly(shade)}"/>` +
		`<path class="m-snow" d="${poly(PEAK.snow)}"/>`
	);
}

/** one day and one night every 120s. 56% of the loop is day. */
export const CYCLE = 120_000;
const DAY = 0.56;

export type Sky = { day: boolean; x: number; y: number; night: number };

/** where the sun (or moon) is at loop phase `p` (0..1), and how dark the sky is.
 * a wide arc: up from behind the back range on the left, over the summit (its highest point is
 * right above the peak), and down behind the far right shoulder. */
export function sky(p: number): Sky {
	const day = p < DAY;
	const u = day ? p / DAY : (p - DAY) / (1 - DAY);
	const x = X0 + u * (X1 - X0);
	// bend time so the top of the arc lands over the peak, not mid-block
	const w = u < TOP ? (0.5 * u) / TOP : 0.5 + (0.5 * (u - TOP)) / (1 - TOP);
	const y = 300 - Math.pow(Math.sin(w * Math.PI), 0.55) * 272;
	let night = 0;
	if (!day) night = Math.min(1, u / 0.12, (1 - u) / 0.12);
	else night = Math.max(0, 1 - Math.min(u, 1 - u) / 0.05) * 0.35;
	return { day, x, y, night };
}
const X0 = 200;
const X1 = 430;
const TOP = (282 - X0) / (X1 - X0);

/** the phase the server paints: mid-morning */
export const STILL = 0.22;
