// a wide himalayan range for /life, painted in the same thick oil as the home page's mountain:
// a long back range, then five peaks of their own heights and shapes, each with a sunlit face and
// a shadow face, the tall ones capped with snow. seeded, so every build paints the same strokes.
import { paint, painter, rng } from '../home/mountain.ts';

export const RW = 1200;
export const RH = 300;

type Pt = [number, number];
const f1 = (n: number) => +n.toFixed(1);
const poly = (pts: Pt[]) => 'M' + pts.map((p) => `${f1(p[0])} ${f1(p[1])}`).join('L') + 'Z';

/** a ragged ridge from a to b: straight in spirit, broken into steps and notches like rock */
function ridge(a: Pt, b: Pt, r: () => number, rough = 7, n = 7): Pt[] {
	const pts: Pt[] = [];
	for (let i = 1; i < n; i++) {
		const t = i / n + (r() - 0.5) * 0.06;
		const x = a[0] + (b[0] - a[0]) * t;
		const y = a[1] + (b[1] - a[1]) * t + (r() - 0.5) * rough;
		pts.push([x, y]);
	}
	return [a, ...pts, b];
}

type Peak = { x: number; top: number; left: number; right: number; snow: number; lean: number };
// across 1200 units: one great peak (kedarkantha-tall), its shoulders, and smaller ones beside
const PEAKS: Peak[] = [
	{ x: 150, top: 150, left: 150, right: 120, snow: 0, lean: 6 },
	{ x: 330, top: 92, left: 170, right: 150, snow: 26, lean: -8 },
	{ x: 610, top: 36, left: 230, right: 200, snow: 48, lean: 10 },
	{ x: 840, top: 104, left: 150, right: 170, snow: 22, lean: -6 },
	{ x: 1060, top: 70, left: 180, right: 190, snow: 34, lean: 8 },
];

export function range(): string {
	const r = rng(73);
	const { strokes, face } = painter(59);
	let defs = paint('rg-b', 6, 'back') + paint('rg-l', 13, 'lit') + paint('rg-s', 21, 'shade') + paint('rg-n', 27, 'snow');
	let body = '';

	// the far range: a long jagged line of low summits across the whole width
	const back: Pt[] = [[-20, RH]];
	for (let x = -20; x <= RW + 20; x += 38 + r() * 30) back.push([x, 190 + Math.sin(x / 95) * 22 + (r() - 0.5) * 34]);
	back.push([RW + 20, RH]);
	defs += `<clipPath id="rg-cb"><path d="${poly(back)}"/></clipPath>`;
	body += `<g clip-path="url(#rg-cb)">${face('rg-b', strokes(-3, 300, 240, 330, 380, 3, 7), strokes(4, 900, 240, 330, 380, 3, 7))}</g>`;

	PEAKS.forEach((p, i) => {
		const sum: Pt = [p.x, p.top];
		const L: Pt = [p.x - p.left * 1.6, RH];
		const R: Pt = [p.x + p.right * 1.6, RH];
		const crease: Pt = [p.x + p.lean, RH];
		const lside = ridge(L, sum, r, 9, 8);
		const rside = ridge(sum, R, r, 9, 8);
		// the crease: where the sunlit face turns into the shadow face, a little crooked
		const mid = ridge(sum, crease, r, 5, 5);
		const lit = [...lside, ...mid.slice(1)];
		const shade = [...rside.slice(0, -1), R, ...mid.slice().reverse().slice(0, -1)];
		defs += `<clipPath id="rg-l${i}"><path d="${poly(lit)}"/></clipPath><clipPath id="rg-s${i}"><path d="${poly(shade)}"/></clipPath>`;
		const span = Math.max(p.left, p.right) * 1.1;
		const n = Math.round(span * 2.2);
		body += `<g clip-path="url(#rg-l${i})">${face('rg-l', strokes(-55, p.x - p.left * 0.6, (p.top + RH) / 2 + 20, span, n, 3, 8))}</g>`;
		body += `<g clip-path="url(#rg-s${i})">${face('rg-s', strokes(50, p.x + p.right * 0.6, (p.top + RH) / 2 + 20, span, Math.round(n * 0.8), 3, 8))}</g>`;
		if (p.snow) {
			// a cap that follows both slopes down a little way, ragged at its foot
			const k = p.snow / (RH - p.top);
			const a: Pt = [p.x - p.left * 1.6 * k, p.top + p.snow];
			const b: Pt = [p.x + p.right * 1.6 * k, p.top + p.snow];
			const foot: Pt[] = [];
			for (let j = 1; j < 6; j++) foot.push([b[0] + (a[0] - b[0]) * (j / 6), p.top + p.snow + (j % 2 ? 10 : -4) + (r() - 0.5) * 6]);
			const cap = [sum, b, ...foot, a];
			defs += `<clipPath id="rg-n${i}"><path d="${poly(cap)}"/></clipPath>`;
			body += `<g clip-path="url(#rg-n${i})">${face('rg-n', strokes(-30, p.x, p.top + p.snow * 0.6, p.snow * 1.4, Math.round(p.snow * 1.6), 2.5, 5))}</g>`;
		}
	});

	return `<defs>${defs}</defs>${body}`;
}
