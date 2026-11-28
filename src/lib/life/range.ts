// a himalayan range for /life, in the home page's thick oil. not a row of cones: ridgelines are
// broken by fractal noise into shoulders, cols, false summits and spurs; the faces split along a
// crooked crease, not a ruler line; snow lies above a ragged snowline and runs down the gullies.
// three layers, like looking up a valley in the garhwal: tall snow giants far back, a jagged
// main range, and dark, low forested ridges in front. seeded, so every build paints the same.
import { paint, painter, rng } from '../home/mountain.ts';

export const RW = 1200;
export const RH = 300;

type Pt = [number, number];
const f1 = (n: number) => +n.toFixed(1);
const poly = (pts: Pt[]) => 'M' + pts.map((p) => `${f1(p[0])} ${f1(p[1])}`).join('L') + 'Z';

/** midpoint displacement between two points: the jagged, self-similar edge of real rock.
 *  `rough` is how far the first split may move, in px; each level halves it (times `keep`). */
function crag(a: Pt, b: Pt, r: () => number, rough: number, depth = 5, keep = 0.55): Pt[] {
	let pts: Pt[] = [a, b];
	let amp = rough;
	for (let d = 0; d < depth; d++) {
		const next: Pt[] = [pts[0]];
		for (let i = 1; i < pts.length; i++) {
			const [x0, y0] = pts[i - 1];
			const [x1, y1] = pts[i];
			// rock breaks unevenly: the split point is not always the middle
			const t = 0.35 + r() * 0.3;
			next.push([x0 + (x1 - x0) * t + (r() - 0.5) * amp * 0.4, y0 + (y1 - y0) * t + (r() - 0.5) * amp], pts[i]);
		}
		pts = next;
		amp *= keep;
	}
	return pts;
}

/** a peak's skyline from its left foot over the summit to its right foot, with a shoulder or a
 *  false summit on one side, so no two slopes match */
function skyline(sx: number, top: number, wl: number, wr: number, base: number, r: () => number, rough: number): Pt[] {
	const sum: Pt = [sx, top];
	const L: Pt = [sx - wl, base];
	const R: Pt = [sx + wr, base];
	// a shoulder: a step part way down one side, sometimes a second, lower summit
	const side = r() < 0.5 ? -1 : 1;
	const k = 0.3 + r() * 0.3;
	const sh: Pt = side < 0 ? [sx - wl * k, top + (base - top) * (0.2 + r() * 0.25)] : [sx + wr * k, top + (base - top) * (0.2 + r() * 0.25)];
	const left = side < 0 ? [...crag(L, sh, r, rough), ...crag(sh, sum, r, rough * 0.8).slice(1)] : crag(L, sum, r, rough);
	const right = side > 0 ? [...crag(sum, sh, r, rough * 0.8), ...crag(sh, R, r, rough).slice(1)] : crag(sum, R, r, rough);
	return [...left, ...right.slice(1)];
}

type Peak = { x: number; top: number; wl: number; wr: number; snow: number; lean: number };

export function range(): string {
	const r = rng(311);
	const { strokes, face } = painter(59);
	let defs =
		paint('rg-b', 6, 'back') + paint('rg-l', 13, 'lit') + paint('rg-s', 21, 'shade') + paint('rg-n', 27, 'snow');
	let body = '';
	let id = 0;

	/** paint one mountain: a lit face and a shadow face split by a crooked crease, snow on top */
	const mountain = (p: Peak, base: number, rough: number, layer: 'far' | 'main' | 'near') => {
		const i = id++;
		const sky = skyline(p.x, p.top, p.wl, p.wr, base, r, rough);
		const s = sky.reduce((m, q, j) => (q[1] < sky[m][1] ? j : m), 0);
		const sum = sky[s];
		// the crease drops from the summit and wanders, bending the way the mountain leans
		const crease = crag(sum, [sum[0] + p.lean, base], r, 26, 4, 0.6).map(([x, y]) => [x, y] as Pt);
		const lit: Pt[] = [...sky.slice(0, s + 1), ...crease.slice(1)];
		const shade: Pt[] = [...crease.slice().reverse(), ...sky.slice(s + 1)];
		defs += `<clipPath id="rg-m${i}"><path d="${poly([...sky, [p.x + p.wr, base + 40], [p.x - p.wl, base + 40]])}"/></clipPath>`;
		defs += `<clipPath id="rg-l${i}"><path d="${poly([...lit, [lit[0][0], base + 40]])}"/></clipPath>`;
		defs += `<clipPath id="rg-s${i}"><path d="${poly([...shade, [sky[sky.length - 1][0], base + 40], [crease[crease.length - 1][0], base + 40]])}"/></clipPath>`;
		const h = base - p.top;
		const cy = p.top + h * 0.55;
		const span = Math.max(p.wl, p.wr, h) * 0.9;
		const n = Math.round(Math.min(520, span * (layer === 'near' ? 1.4 : 2)));
		if (layer === 'far') {
			body += `<g clip-path="url(#rg-m${i})">${face('rg-b', strokes(-28, p.x, cy, span, Math.round(n * 0.7), 3, 7))}</g>`;
		} else {
			// strokes follow the fall line of each face, steeper on the steep side
			const al = -90 + (Math.atan2(h, p.wl) * 180) / Math.PI;
			const ar = 90 - (Math.atan2(h, p.wr) * 180) / Math.PI;
			body += `<g clip-path="url(#rg-l${i})">${face('rg-l', strokes(al, p.x - p.wl * 0.35, cy, span, n, 3, 8))}</g>`;
			body += `<g clip-path="url(#rg-s${i})">${face(layer === 'near' ? 'rg-s' : 'rg-s', strokes(ar, p.x + p.wr * 0.35, cy, span, Math.round(n * 0.85), 3, 8))}</g>`;
		}
		if (p.snow > 0) {
			// a ragged snowline, lower in the gullies, with tongues of snow running down
			const x0 = p.x - p.wl;
			const x1 = p.x + p.wr;
			const line: Pt[] = [];
			const steps = 26;
			for (let k = 0; k <= steps; k++) {
				const x = x0 + ((x1 - x0) * k) / steps;
				const tongue = r() < 0.22 ? r() * p.snow * 0.9 : 0;
				line.push([x, p.top + p.snow + (r() - 0.5) * p.snow * 0.5 + tongue]);
			}
			const cap: Pt[] = [...line, [x1, 0], [x0, 0]];
			defs += `<clipPath id="rg-n${i}"><path d="${poly(cap)}"/></clipPath>`;
			body += `<g clip-path="url(#rg-m${i})"><g clip-path="url(#rg-n${i})">${face('rg-n', strokes(-35, p.x, p.top + p.snow * 0.6, Math.max(p.snow * 1.5, (x1 - x0) * 0.35), Math.round(p.snow * 2.2), 2.5, 5))}</g></g>`;
		}
	};

	// far back: the snow giants, standing above everything, pale
	for (const p of [
		{ x: 250, top: 34, wl: 260, wr: 200, snow: 70, lean: 14 },
		{ x: 700, top: 8, wl: 240, wr: 330, snow: 90, lean: -10 },
		{ x: 1080, top: 40, wl: 230, wr: 220, snow: 64, lean: 12 },
	])
		mountain(p, 230, 34, 'far');
	// the main range: jagged, unequal, one clear monarch slightly off centre
	for (const p of [
		{ x: 90, top: 138, wl: 170, wr: 140, snow: 18, lean: 18 },
		{ x: 395, top: 92, wl: 160, wr: 220, snow: 34, lean: -24 },
		{ x: 610, top: 66, wl: 150, wr: 120, snow: 44, lean: 30 },
		{ x: 905, top: 112, wl: 210, wr: 150, snow: 26, lean: -16 },
		{ x: 1150, top: 128, wl: 130, wr: 160, snow: 20, lean: 10 },
	])
		mountain(p, 300, 26, 'main');
	// the near ridges: low, dark, no snow, the forested foothills you walk in from
	for (const p of [
		{ x: 230, top: 232, wl: 330, wr: 240, snow: 0, lean: 30 },
		{ x: 780, top: 246, wl: 280, wr: 320, snow: 0, lean: -20 },
		{ x: 1180, top: 238, wl: 220, wr: 200, snow: 0, lean: 12 },
	])
		mountain(p, 312, 12, 'near');

	return `<defs>${defs}</defs>${body}`;
}
