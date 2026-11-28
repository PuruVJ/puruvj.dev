// a range for /life, in the home page's thick oil: one great mountain, drawn like the home page's
// (a long walk-in, a resting shoulder, a summit, a long right shoulder), with two lesser peaks
// standing apart from it on either side and a low range behind. drawn, not random: the only noise
// is a little roughness on the ridgelines. seeded, so every build paints the same strokes.
import { paint, painter, rng } from '../home/mountain.ts';

export const RW = 1200;
export const RH = 300;

type Pt = [number, number];
const f1 = (n: number) => +n.toFixed(1);
const poly = (pts: Pt[]) => 'M' + pts.map((p) => `${f1(p[0])} ${f1(p[1])}`).join('L') + 'Z';

/** roughen a drawn line a little: rock, not a ruler, but the shape stays the drawn one */
function rough(pts: Pt[], r: () => number, amp: number): Pt[] {
	const out: Pt[] = [pts[0]];
	for (let i = 1; i < pts.length; i++) {
		const [x0, y0] = pts[i - 1];
		const [x1, y1] = pts[i];
		const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 14));
		for (let k = 1; k < n; k++) {
			const t = k / n;
			out.push([x0 + (x1 - x0) * t + (r() - 0.5) * amp * 0.5, y0 + (y1 - y0) * t + (r() - 0.5) * amp]);
		}
		out.push(pts[i]);
	}
	return out;
}

/** a mountain: its drawn skyline (left foot to right foot), the summit's index in it, the crease
 *  (summit down to where the lit face turns into shadow), and its snow cap */
type Mtn = { sky: Pt[]; crease: Pt[]; snow: Pt[]; base: number };

// the hero, two thirds the height of the panel: the home page's mountain, drawn wider
const HERO: Mtn = {
	base: 300,
	sky: [
		[300, 300], [380, 262], [450, 240], [505, 232], [540, 210], [578, 150], [604, 96], [628, 44], [646, 18],
		[668, 46], [690, 62], [720, 104], [760, 136], [802, 164], [850, 196], [905, 226], [970, 262], [1030, 300],
	],
	crease: [[646, 18], [652, 70], [658, 130], [650, 190], [662, 250], [668, 300]],
	snow: [[646, 18], [628, 44], [618, 66], [630, 62], [640, 78], [652, 66], [664, 82], [676, 60], [690, 62], [668, 46]],
};
// lesser peaks, standing apart: a sharp one on the left, a broad, lower one on the right
const LEFT: Mtn = {
	base: 300,
	sky: [[0, 300], [40, 270], [90, 236], [128, 196], [160, 150], [182, 122], [204, 146], [226, 160], [262, 210], [300, 252], [340, 300]],
	crease: [[182, 122], [190, 190], [184, 250], [196, 300]],
	snow: [[182, 122], [170, 138], [178, 140], [184, 152], [192, 140], [204, 146]],
};
const RIGHT: Mtn = {
	base: 300,
	sky: [[900, 300], [950, 270], [1000, 232], [1040, 196], [1070, 168], [1096, 158], [1118, 174], [1150, 206], [1200, 250], [1230, 300]],
	crease: [[1096, 158], [1104, 220], [1098, 300]],
	snow: [[1096, 158], [1080, 170], [1090, 172], [1098, 182], [1108, 172], [1118, 174]],
};
// far behind, between them: a low range that keeps the valley from looking empty
const BACK: Pt[] = [
	[-20, 300], [-20, 236], [60, 222], [140, 232], [230, 206], [320, 214], [420, 190], [500, 204], [560, 182],
	[740, 176], [820, 196], [900, 184], [980, 208], [1060, 200], [1140, 214], [1220, 206], [1220, 300],
];

export function range(): string {
	const r = rng(311);
	const { strokes, face } = painter(59);
	let defs =
		paint('rg-b', 6, 'back') + paint('rg-l', 13, 'lit') + paint('rg-s', 21, 'shade') + paint('rg-n', 27, 'snow');
	let body = '';

	defs += `<clipPath id="rg-cb"><path d="${poly(rough(BACK, r, 8))}"/></clipPath>`;
	body += `<g clip-path="url(#rg-cb)">${face('rg-b', strokes(-4, 300, 250, 320, 260, 3, 7), strokes(3, 900, 240, 320, 260, 3, 7))}</g>`;

	const draw = (m: Mtn, i: number, k: number) => {
		const s = m.sky.findIndex((p) => p[0] === m.crease[0][0] && p[1] === m.crease[0][1]);
		const left = rough(m.sky.slice(0, s + 1), r, 5);
		const right = rough(m.sky.slice(s), r, 5);
		const crease = rough(m.crease, r, 3);
		const lit: Pt[] = [...left, ...crease.slice(1)];
		const shade: Pt[] = [...crease.slice().reverse(), ...right.slice(1)];
		defs += `<clipPath id="rg-l${i}"><path d="${poly(lit)}"/></clipPath><clipPath id="rg-s${i}"><path d="${poly(shade)}"/></clipPath><clipPath id="rg-n${i}"><path d="${poly(m.snow)}"/></clipPath>`;
		const top = m.crease[0];
		const h = m.base - top[1];
		const xs = m.sky.map((p) => p[0]);
		const wl = top[0] - Math.min(...xs);
		const wr = Math.max(...xs) - top[0];
		const span = Math.max(wl, wr, h) * 0.75;
		// strokes run down each face's fall line
		const al = -90 + (Math.atan2(h, wl) * 180) / Math.PI;
		const ar = 90 - (Math.atan2(h, wr) * 180) / Math.PI;
		body += `<g clip-path="url(#rg-l${i})">${face('rg-l', strokes(al, top[0] - wl * 0.3, top[1] + h * 0.55, span, Math.round(span * 2.4 * k), 3, 8))}</g>`;
		body += `<g clip-path="url(#rg-s${i})">${face('rg-s', strokes(ar, top[0] + wr * 0.3, top[1] + h * 0.55, span, Math.round(span * 2 * k), 3, 8))}</g>`;
		body += `<g clip-path="url(#rg-n${i})">${face('rg-n', strokes(-30, top[0], top[1] + 30, 50, 60, 2.5, 5))}</g>`;
	};
	draw(LEFT, 0, 1);
	draw(RIGHT, 1, 1);
	draw(HERO, 2, 1.15);

	return `<defs>${defs}</defs>${body}`;
}
