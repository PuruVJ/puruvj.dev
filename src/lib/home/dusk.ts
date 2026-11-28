// when someone holds the sun on the home page, the whole page follows it through the day: the
// tokens slide between the light and the dark palette, with a little warmth near sunrise and
// sunset. pure functions; Mountain.svelte writes the result onto <html> once a frame.

import { DAY_PART } from './mountain.ts';

type C = [number, number, number, number];

const hex = (s: string, a = 1): C => [
	parseInt(s.slice(1, 3), 16),
	parseInt(s.slice(3, 5), 16),
	parseInt(s.slice(5, 7), 16),
	a,
];

// the two palettes, as in $lib/styles/app.css (and --night from the home page). keep them in step.
const LIGHT: Record<string, C> = {
	'--paper': hex('#f4f3ef'),
	'--paper-2': hex('#ebeae4'),
	'--ink': hex('#0d0d0c'),
	'--ink-2': hex('#4a4a47'),
	'--ink-3': hex('#686760'),
	'--rule': hex('#0d0d0c'),
	'--hair': hex('#0d0d0c', 0.12),
	'--hill-2': hex('#cfccc4'),
	'--hill-3': hex('#b0ada5'),
	'--night': hex('#e2e0d9'),
};
const DARK: Record<string, C> = {
	'--paper': hex('#0f0f0e'),
	'--paper-2': hex('#181817'),
	'--ink': hex('#ecebe6'),
	'--ink-2': hex('#c0bfb9'),
	'--ink-3': hex('#94938c'),
	'--rule': hex('#3a3a37'),
	'--hair': hex('#ecebe6', 0.1),
	'--hill-2': hex('#2e2e2b'),
	'--hill-3': hex('#4a4a46'),
	'--night': hex('#060606'),
};
// the painted sun and moon, as in Mountain.svelte
const BODY_LIGHT: Record<string, C> = { '--oil-sun': hex('#dad9d6'), '--oil-moon': hex('#aeadaa') };
const BODY_DARK: Record<string, C> = { '--oil-sun': hex('#3b3a37'), '--oil-moon': hex('#c9c8c5') };

/** the words: they swap sides in a short band around the middle, so they stay readable while the
 *  paper under them slides through every grey */
const INK = new Set(['--ink', '--ink-2', '--ink-3', '--rule']);
/** a faint low-sun amber laid over the paper near the horizon */
const WARM: C = [214, 146, 92, 1];

export const THEME_KEYS = Object.keys(LIGHT);
export const BODY_KEYS = Object.keys(BODY_LIGHT);

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => ((x = clamp(x)), x * x * (3 - 2 * x));

/**
 * how dark the page is (0 day, 1 night) and how warm (0..1) at loop phase `p`. the page is half
 * dark exactly when the sun is on the horizon, where the mountain hides it. it leaves that middle
 * quickly (an ease-out), so the moment the words have least contrast is also the shortest.
 */
export function dusk(p: number) {
	const day = p < DAY_PART;
	const u = day ? p / DAY_PART : (p - DAY_PART) / (1 - DAY_PART);
	const e = Math.min(u, 1 - u);
	const r = 1 - Math.pow(1 - clamp(e / 0.3), 3);
	const d = day ? 0.5 * (1 - r) : 0.5 + 0.5 * r;
	const w = Math.pow(clamp(1 - e / 0.22), 2) * (day ? 1 : 0.55);
	return { d, w };
}

const mix = (a: C, b: C, t: number): C => [
	a[0] + (b[0] - a[0]) * t,
	a[1] + (b[1] - a[1]) * t,
	a[2] + (b[2] - a[2]) * t,
	a[3] + (b[3] - a[3]) * t,
];
const css = (c: C) =>
	c[3] >= 1
		? `rgb(${c[0] | 0} ${c[1] | 0} ${c[2] | 0})`
		: `rgb(${c[0] | 0} ${c[1] | 0} ${c[2] | 0} / ${c[3].toFixed(3)})`;

/** the page tokens at darkness `d` and warmth `w` */
export function theme_vars(d: number, w: number): [string, string][] {
	const ink = smooth((d - 0.44) / 0.12);
	return THEME_KEYS.map((k) => {
		if (INK.has(k)) return [k, css(mix(LIGHT[k], DARK[k], ink))];
		const c = mix(LIGHT[k], DARK[k], d);
		// warmth shows most on mid greys; keep the alpha of --hair as it is
		const t = w * 0.1;
		return [k, css([c[0] + (WARM[0] - c[0]) * t, c[1] + (WARM[1] - c[1]) * t, c[2] + (WARM[2] - c[2]) * t, c[3]])];
	});
}

/** the painted sun and moon at darkness `d` */
export function body_vars(d: number): [string, string][] {
	return BODY_KEYS.map((k) => [k, css(mix(BODY_LIGHT[k], BODY_DARK[k], d))]);
}
