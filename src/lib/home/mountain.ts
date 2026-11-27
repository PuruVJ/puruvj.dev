// the mountain on the home page: flat sheets of grey, like a print. a back range, one peak with a
// lit face and a shadow face, and a cap of snow. pure functions: the server draws the still,
// the island only moves the sun and moon behind it.

export const VW = 420;
export const VH = 300;

type Pt = [number, number];

const PEAK = {
	left: [[104, 300], [172, 248], [202, 238], [228, 238], [252, 190], [272, 128], [290, 68]] as Pt[],
	right: [[290, 68], [312, 106], [323, 110], [350, 174], [382, 246], [402, 300]] as Pt[],
	// where the lit face turns into the shadow face
	crease: [[296, 176], [316, 300]] as Pt[],
	snow: [[290, 68], [275, 106], [284, 100], [291, 116], [300, 102], [309, 113], [312, 106]] as Pt[],
	back: [
		[[18, 300], [108, 206], [150, 238], [196, 196], [258, 260], [290, 300]],
		[[318, 300], [372, 222], [420, 262], [420, 300]],
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
