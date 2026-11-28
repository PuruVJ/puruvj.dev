// when someone holds the sun on the home page, the whole page follows it through the day: night,
// then sunrise as the sun comes up, the day, sunset as it goes down, and night again. every token
// slides between the four palettes. pure functions; Mountain.svelte writes the result onto <html>
// once a frame.

import { DAY_PART } from './mountain.ts';

type C = [number, number, number, number];

const hex = (s: string, a = 1): C => [
	parseInt(s.slice(1, 3), 16),
	parseInt(s.slice(3, 5), 16),
	parseInt(s.slice(5, 7), 16),
	a,
];

/** the four hours, each the same as one of the site's themes: day is light, night is dark, dawn is
 *  sunrise and dusk is sunset */
export type Hour = 'night' | 'dawn' | 'day' | 'dusk';
export const HOURS: Hour[] = ['night', 'dawn', 'day', 'dusk'];

type Palette = {
	/** a dark theme? (light words on dark paper) */
	dark: boolean;
	/** the page tokens, as in $lib/styles/app.css (and --night from the home page) */
	page: Record<string, C>;
	/** the painted sun and moon, and the night veil over the paint, as in Mountain.svelte */
	body: Record<string, C>;
	veil: number;
	/** the oil mountain's tones, as in Mountain.svelte and $lib/life/OilRange.svelte */
	oil: Record<string, string>;
};

// keep these in step with app.css, Mountain.svelte, OilRange.svelte and the home page's --night
const PALETTES: Record<Hour, Palette> = {
	day: {
		dark: false,
		page: {
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
			// no low light at noon; the hue is kept so the fade to dawn or dusk never goes grey
			'--glow': hex('#f0965a', 0),
		},
		body: { '--oil-sun': hex('#dad9d6'), '--oil-moon': hex('#aeadaa'), '--m-dusk': hex('#8f8d86') },
		veil: 0.26,
		oil: {
			'--oil-back': 'rgb(228 227 224)',
			'--oil-lit': 'rgb(217 216 213)',
			'--oil-shade': 'rgb(184 183 180)',
			'--oil-snow': 'rgb(250 249 246)',
			'--oil-sheen': '#fff',
		},
	},
	night: {
		dark: true,
		page: {
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
			'--glow': hex('#d64830', 0),
		},
		body: { '--oil-sun': hex('#3b3a37'), '--oil-moon': hex('#c9c8c5'), '--m-dusk': hex('#000000') },
		veil: 0.3,
		oil: {
			'--oil-back': 'rgb(29 28 25)',
			'--oil-lit': 'rgb(50 49 46)',
			'--oil-shade': 'rgb(33 32 29)',
			'--oil-snow': 'rgb(111 110 107)',
			'--oil-sheen': '#555',
		},
	},
	dawn: {
		dark: false,
		page: {
			'--paper': hex('#e7eaee'),
			'--paper-2': hex('#dce1e7'),
			'--ink': hex('#10131a'),
			'--ink-2': hex('#3b4250'),
			'--ink-3': hex('#545b69'),
			'--rule': hex('#10131a'),
			'--hair': hex('#10131a', 0.13),
			'--hill-2': hex('#c6ccd5'),
			'--hill-3': hex('#a8b0bc'),
			'--night': hex('#d3d9e2'),
			'--glow': hex('#f0965a', 0.16),
		},
		body: { '--oil-sun': hex('#f2b07a'), '--oil-moon': hex('#aab1bc'), '--m-dusk': hex('#5d6b82') },
		veil: 0.22,
		oil: {
			'--oil-back': 'rgb(212 218 227)',
			'--oil-lit': 'rgb(234 208 188)',
			'--oil-shade': 'rgb(162 172 188)',
			'--oil-snow': 'rgb(253 238 222)',
			'--oil-sheen': '#fff3e4',
		},
	},
	dusk: {
		dark: true,
		page: {
			'--paper': hex('#211416'),
			'--paper-2': hex('#2c1b1d'),
			'--ink': hex('#f2e5dc'),
			'--ink-2': hex('#d6c1b6'),
			'--ink-3': hex('#b19a90'),
			'--rule': hex('#4d3333'),
			'--hair': hex('#f2e5dc', 0.11),
			'--hill-2': hex('#3b2527'),
			'--hill-3': hex('#5a3836'),
			'--night': hex('#140a0c'),
			'--glow': hex('#d64830', 0.16),
		},
		body: { '--oil-sun': hex('#aa3e2a'), '--oil-moon': hex('#dcc6bc'), '--m-dusk': hex('#000000') },
		veil: 0.3,
		oil: {
			'--oil-back': 'rgb(46 26 29)',
			'--oil-lit': 'rgb(112 47 39)',
			'--oil-shade': 'rgb(39 22 27)',
			'--oil-snow': 'rgb(198 112 92)',
			'--oil-sheen': '#b0604f',
		},
	},
};

/** the oil tones of one hour, for the painted copies of the mountain */
export const oil_of = (h: Hour) => PALETTES[h].oil;

/** the words: in a change between a light and a dark hour they swap sides in a short band around
 *  the middle, so they stay readable while the paper under them slides through every shade */
const INK = new Set(['--ink', '--ink-2', '--ink-3', '--rule']);

export const THEME_KEYS = Object.keys(PALETTES.day.page);
export const BODY_KEYS = Object.keys(PALETTES.day.body);

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => ((x = clamp(x)), x * x * (3 - 2 * x));
/** a light/dark swap: it leaves the middle quickly, so the moment the words have least contrast is
 *  also the shortest, and it is still at both ends, so it joins the hours on either side smoothly */
const swap = (s: number) => {
	const x = 2 * clamp(s) - 1;
	return 0.5 + 0.5 * Math.sign(x) * (1 - Math.pow(1 - Math.abs(x), 3));
};
const band = (t: number) => smooth((t - 0.44) / 0.12);

/** where the page is between two hours: from `a` to `b`, the paper at `t`, the words at `ink` */
export type Between = { a: Hour; b: Hour; t: number; ink: number };

const hold = (h: Hour): Between => ({ a: h, b: h, t: 0, ink: 0 });
const fade = (a: Hour, b: Hour, s: number): Between => {
	const t = smooth(s);
	return { a, b, t, ink: t };
};
const flip = (a: Hour, b: Hour, s: number): Between => {
	const t = swap(s);
	return { a, b, t, ink: band(t) };
};
const span = (x: number, lo: number, hi: number) => (x - lo) / (hi - lo);

/**
 * the hour at loop phase `p`. the day runs from the sun rising on the left (p = 0) to it setting
 * on the right (p = DAY_PART); the night is the rest. sunrise holds round the moment the sun comes
 * up, sunset round the moment it goes down. the sky turns from night to sunrise in the last part of
 * the night, before the sun is up, and from day to sunset while the sun is low in the west.
 */
export function hour_at(p: number): Between {
	if (p < DAY_PART) {
		const u = p / DAY_PART;
		if (u < 0.06) return hold('dawn');
		if (u < 0.34) return fade('dawn', 'day', span(u, 0.06, 0.34));
		if (u < 0.76) return hold('day');
		if (u < 0.96) return flip('day', 'dusk', span(u, 0.76, 0.96));
		return hold('dusk');
	}
	const v = (p - DAY_PART) / (1 - DAY_PART);
	if (v < 0.06) return hold('dusk');
	if (v < 0.32) return fade('dusk', 'night', span(v, 0.06, 0.32));
	if (v < 0.74) return hold('night');
	if (v < 0.94) return flip('night', 'dawn', span(v, 0.74, 0.94));
	return hold('dawn');
}

/** the hour that is the reader's own theme */
export function hour_of(pref: string | null, system_dark: boolean): Hour {
	if (pref === 'light') return 'day';
	if (pref === 'dark') return 'night';
	if (pref === 'sunrise') return 'dawn';
	if (pref === 'sunset') return 'dusk';
	return system_dark ? 'night' : 'day';
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
const lum = (c: C) => {
	const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
	return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
};

/**
 * everything the page needs at hour `h`, followed by `k` (0 is the reader's own hour, 1 is the
 * sun's). the words take the paper's way: where the two ends are a light and a dark hour, they
 * swap in the short band too.
 */
export function look(own: Hour, h: Between, k: number) {
	const O = PALETTES[own];
	const A = PALETTES[h.a];
	const B = PALETTES[h.b];
	const ink_dark = (A.dark ? 1 : 0) + ((B.dark ? 1 : 0) - (A.dark ? 1 : 0)) * h.ink;
	const apart = Math.abs((O.dark ? 1 : 0) - ink_dark);
	const k_ink = k + (band(k) - k) * apart;
	const vars: [string, string][] = [];
	let paper: C = O.page['--paper'];
	for (const n of THEME_KEYS) {
		const inky = INK.has(n);
		const sun = mix(A.page[n], B.page[n], inky ? h.ink : h.t);
		const c = mix(O.page[n], sun, inky ? k_ink : k);
		if (n === '--paper') paper = c;
		vars.push([n, css(c)]);
	}
	const body: [string, string][] = BODY_KEYS.map((n) => [
		n,
		css(mix(O.body[n], mix(A.body[n], B.body[n], h.t), k)),
	]);
	const veil = O.veil + (A.veil + (B.veil - A.veil) * h.t - O.veil) * k;
	// how much of each painted copy of the mountain shows: the reader's own paint for what is left
	// of their hour, and the two hours the sun is between for the rest
	const weights: Partial<Record<Hour, number>> = {};
	weights[h.a] = (weights[h.a] ?? 0) + k * (1 - h.t);
	weights[h.b] = (weights[h.b] ?? 0) + k * h.t;
	return { vars, body, veil, own: 1 - k, weights, dark: lum(paper) < 0.2 };
}
