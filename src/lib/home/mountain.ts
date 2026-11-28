// the mountain on the home page, painted in thick oil: a back range, one peak with a lit face and a
// shadow face, a cap of snow. pure, seeded functions: the server paints it once, the island only
// slides the sun and moon behind it.

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

const f1 = (n: number) => +n.toFixed(1);
const poly = (pts: Pt[]) => 'M' + pts.map((p) => `${f1(p[0])} ${f1(p[1])}`).join('L') + 'Z';
const LIT: Pt[] = [...PEAK.left, PEAK.crease[0], PEAK.crease[1]];
const SHADE: Pt[] = [PEAK.left.at(-1)!, ...PEAK.right.slice(1), PEAK.crease[1], PEAK.crease[0]];

/** the whole silhouette, for the dusk veil that darkens the painting at night */
export const SILHOUETTE = PEAK.back.map(poly).join('') + poly([...PEAK.left, ...PEAK.right.slice(1)]);

/** seeded, so the server and every build paint the same strokes */
export function rng(seed: number) {
	return () => {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * thick oil paint: where brush strokes pile up the paint is higher, and the lighting turns that
 * height into ridges lit from the upper left, with a little wet shine. the paint's colour and the
 * shine come from css (`.tone-*` flood colours, `--oil-sheen`), so one drawing serves both themes.
 */
export function paint(id: string, seed: number, tone: string) {
	return `<filter id="${id}" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency=".03 .9" numOctaves="3" seed="${seed}" result="br"/>
<feColorMatrix in="br" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .07 0 0 0 0" result="bra"/>
<feGaussianBlur in="SourceAlpha" stdDeviation=".55" result="h0"/>
<feComposite in="h0" in2="bra" operator="arithmetic" k2="1" k3="1" result="h"/>
<feDiffuseLighting in="h" surfaceScale="7" lighting-color="#fff" result="L"><feDistantLight azimuth="225" elevation="46"/></feDiffuseLighting>
<feSpecularLighting class="sheen" in="h" surfaceScale="7" specularConstant=".5" specularExponent="34" result="S"><feDistantLight azimuth="225" elevation="58"/></feSpecularLighting>
<feFlood class="tone-${tone}" result="tn"/>
<feComposite in="tn" in2="L" operator="arithmetic" k1=".62" k2=".52" result="c"/>
<feComposite in="S" in2="c" operator="arithmetic" k2=".3" k3="1"/>
</filter>`;
}

export function painter(seed: number) {
	const r = rng(seed);
	type Strokes = { angle: number; cx: number; cy: number; span: number; s: string };
	// strokes laid level in a face's own frame; the group is then turned to the slope
	const strokes = (angle: number, cx: number, cy: number, span: number, n: number, wmin: number, wmax: number): Strokes => {
		let s = '';
		for (let i = 0; i < n; i++) {
			const x = cx - span + r() * span * 2;
			const y = cy - span + r() * span * 2;
			const len = 10 + r() * 34;
			const w = wmin + r() * (wmax - wmin);
			const bow = (r() - 0.5) * 5;
			s += `<path d="M${f1(x)} ${f1(y)}q${f1(len / 2)} ${f1(bow)} ${f1(len)} ${f1((r() - 0.5) * 2)}" stroke-width="${f1(w)}" stroke-opacity="${f1(0.18 + r() * 0.3)}"/>`;
		}
		return { angle, cx, cy, span, s };
	};
	// the half-opaque square under the strokes is the canvas ground the paint sits on
	const face = (fid: string, ...st: Strokes[]) =>
		st
			.map(
				(k) =>
					`<g filter="url(#${fid})" transform="rotate(${k.angle} ${k.cx} ${k.cy})"><rect x="${f1(k.cx - k.span * 1.5)}" y="${f1(k.cy - k.span * 1.5)}" width="${f1(k.span * 3)}" height="${f1(k.span * 3)}" fill-opacity=".5"/><g stroke="#000" stroke-linecap="round" fill="none">${k.s}</g></g>`,
			)
			.join('');
	return { strokes, face };
}

/** the still painting: back ranges, lit face, shadow face, snow. it thins toward the left, where it
 *  sits behind the tagline and the menu, so the words always read first. */
export function terrain(): string {
	const { strokes, face } = painter(41);
	return `<defs>${paint('oil-bf', 5, 'back')}${paint('oil-lf', 12, 'lit')}${paint('oil-sf', 19, 'shade')}${paint('oil-nf', 23, 'snow')}
<clipPath id="oil-b"><path d="${PEAK.back.map(poly).join('')}"/></clipPath>
<clipPath id="oil-l"><path d="${poly(LIT)}"/></clipPath>
<clipPath id="oil-s"><path d="${poly(SHADE)}"/></clipPath>
<clipPath id="oil-n"><path d="${poly(PEAK.snow)}"/></clipPath>
<linearGradient id="oil-fg" gradientUnits="userSpaceOnUse" x1="-80" y1="0" x2="190" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".4"/><stop offset="1" stop-color="#fff"/></linearGradient>
<mask id="oil-fm" maskUnits="userSpaceOnUse" x="-240" y="-20" width="700" height="340"><rect x="-240" y="-20" width="700" height="340" fill="url(#oil-fg)"/></mask></defs>
<g mask="url(#oil-fm)">
<g clip-path="url(#oil-b)">${face('oil-bf', strokes(-4, 60, 250, 170, 300, 3, 7), strokes(-3, 380, 220, 70, 80, 3, 7))}</g>
<g clip-path="url(#oil-l)">${face('oil-lf', strokes(-52, 230, 180, 135, 480, 3, 8))}</g>
<g clip-path="url(#oil-s)">${face('oil-sf', strokes(48, 350, 170, 130, 340, 3, 8))}</g>
<g clip-path="url(#oil-n)">${face('oil-nf', strokes(-30, 283, 70, 22, 50, 2.5, 5))}</g>
</g>`;
}

/** the sun (r 15) or the crescent moon (r 12), painted the same way, centred on 0,0 */
export function body(kind: 'sun' | 'moon'): string {
	const { strokes, face } = painter(kind === 'sun' ? 77 : 91);
	const R = kind === 'sun' ? 15 : 12;
	const id = (k: string) => `oil-${kind}-${k}`;
	const clip = `<clipPath id="${id('c')}"><circle r="${R}"/></clipPath>`;
	const cut =
		kind === 'moon'
			? `<mask id="${id('m')}" maskContentUnits="userSpaceOnUse" x="-20" y="-20" width="40" height="40"><circle r="12" fill="#fff"/><circle cx="5.5" cy="-3.5" r="10.5" fill="#000"/></mask>`
			: '';
	return `<defs>${paint(id('f'), kind === 'sun' ? 29 : 31, kind)}${clip}${cut}</defs>
<g${kind === 'moon' ? ` mask="url(#${id('m')})"` : ''}><g clip-path="url(#${id('c')})">${face(id('f'), strokes(-20, 0, 0, R + 1, kind === 'sun' ? 26 : 20, 2.5, 5))}</g></g>`;
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

/** the part of the loop that is day */
export const DAY_PART = DAY;

/** the path both the sun and the moon ride, drawn as a dotted guide while one is held. it is drawn
 *  under the paint, so wherever it runs behind the mountain the paint hides it. */
export const ORBIT = (() => {
	let d = '';
	for (let i = 0; i <= 96; i++) {
		const k = sky(Math.min(i / 96, 1 - 1e-9) * DAY);
		d += `${i ? 'L' : 'M'}${f1(k.x)} ${f1(k.y)}`;
	}
	return d;
})();

/**
 * holding the sun turns a wheel. the wheel's hub sits inside the arc, low over the mountain; the
 * pointer's angle around the hub is the time. above the arc's two feet the held body rides the arc
 * under the pointer. below them (the pointer down over the mountain) the held body has gone behind
 * it, and the other one crosses the sky: the night if the sun is held, the day if the moon is.
 */
const HX = 315;
const HY = 200;
const N = 240;
const ANG: number[] = [];
for (let i = 0; i <= N; i++) {
	const k = sky(Math.min(i / N, 1 - 1e-9) * DAY);
	let a = angle_of(k.x, k.y);
	// one unbroken sweep: from the left foot (down-left of the hub) over the top to the right foot
	if (i && a > ANG[i - 1] + 180) a -= 360;
	if (i && a < ANG[i - 1] - 180) a += 360;
	ANG.push(a);
}
const A0 = ANG[0];
const A1 = ANG[N];
const WEDGE = A1 + 360 - A0;

/** the angle (degrees, counterclockwise from the right, y up) of a viewBox point around the hub */
export function angle_of(x: number, y: number) {
	return (Math.atan2(HY - y, x - HX) * 180) / Math.PI;
}

export type Hand = 'sun' | 'moon';

/** the loop phase for a pointer at angle `a`, holding `hand` */
export function phase_at(a: number, hand: Hand): number {
	a = A1 + ((((a - A1) % 360) + 360) % 360);
	let up: boolean;
	let u: number;
	if (a <= A0) {
		up = true;
		// the sweep runs downhill: binary search for the arc point under the pointer
		let lo = 0;
		let hi = N;
		while (hi - lo > 1) {
			const m = (lo + hi) >> 1;
			if (ANG[m] >= a) lo = m;
			else hi = m;
		}
		const t = (ANG[lo] - a) / (ANG[lo] - ANG[hi] || 1);
		u = (lo + t) / N;
	} else {
		up = false;
		u = (A1 + 360 - a) / WEDGE;
	}
	u = Math.min(1, Math.max(0, u));
	const day = hand === 'sun' ? up : !up;
	return day ? u * DAY : DAY + u * (1 - DAY);
}

/** where `hand` is on the wheel at phase `p`: the inverse of phase_at */
export function angle_at(p: number, hand: Hand): number {
	const day = p < DAY;
	const u = day ? p / DAY : (p - DAY) / (1 - DAY);
	const up = hand === 'sun' ? day : !day;
	if (!up) return A1 + 360 - u * WEDGE;
	const i = Math.min(N - 1, Math.floor(u * N));
	const t = u * N - i;
	return ANG[i] + (ANG[i + 1] - ANG[i]) * t;
}

/** the loop as a clock: the sun comes up at six */
export function clock(p: number) {
	const m = Math.round(((6 + p * 24) % 24) * 4) * 15;
	const h = Math.floor(m / 60) % 24;
	const mm = String(m % 60).padStart(2, '0');
	return `${h % 12 || 12}:${mm} ${h < 12 ? 'am' : 'pm'}`;
}
