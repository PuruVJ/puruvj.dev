// six years as a transit map. time runs top to bottom; lines are told apart by stroke alone
// (weight, dash, a doubled rail, a cased line), and branches leave their parent at 45°.
// the map is the machine; a plain line of story per year sits beside it and does the talking.
// pure: the server draws a first guess, the island redraws at the real size and adds hover.

export type Station = {
	kind: 'post' | 'work' | 'talk' | 'podcast';
	date: string;
	title: string;
	lines: string[];
	label?: string;
	href?: string;
};

export const ORDER = ['life', 'js', 'macos', 'svelte', 'ogygia', 'talks', 'neo'] as const;
const NAMES: Record<string, string> = {
	life: 'life',
	js: 'js & ts',
	neo: 'libraries',
	talks: 'talks',
	svelte: 'svelte',
	macos: 'macos web',
	ogygia: 'ogygia',
};
const PARENT: Record<string, string> = { macos: 'js', svelte: 'js', neo: 'svelte', talks: 'svelte', ogygia: 'svelte' };
// weights are whole pixels and lanes sit on half pixels, so every straight line lands crisp.
// the paired lines are cased (a wide stroke with a paper core) so their rails stay parallel
// round the 45° bends instead of pinching like two offset copies.
type Style = { w: number; dash?: string; cap?: string; core?: number };
const STYLE: Record<string, Style> = {
	js: { w: 3 },
	life: { w: 1 },
	neo: { w: 5, core: 3 },
	talks: { w: 1, dash: '6 3' },
	svelte: { w: 2.5, dash: '0.01 4.5', cap: 'round' },
	macos: { w: 1, dash: '10 3 2 3' },
	ogygia: { w: 5, core: 1 },
};

const T = (s: string) => new Date(s + 'T00:00:00Z').getTime();
export const ym = (d: string) => d.slice(0, 7).replace('-', '.');

const attrs = (st: Style) =>
	`stroke-width="${st.w}"${st.dash ? ` stroke-dasharray="${st.dash}"` : ''} stroke-linecap="${st.cap || 'butt'}" stroke-linejoin="round"`;
function stroke(id: string, d: string) {
	const st = STYLE[id];
	let s = `<path d="${d}" ${attrs(st)}/>`;
	if (st.core) s += `<path d="${d}" stroke="var(--paper)" stroke-width="${st.core}" stroke-linejoin="round"/>`;
	return s;
}
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
/** snap to the middle of a pixel, where a 1px line is sharp */
const px = (v: number) => Math.round(v - 0.5) + 0.5;
const KIND = { post: 'writing', work: 'project', talk: 'talk', podcast: 'podcast' } as const;

/** lines with no stop after this date are drawn as finished, with an end cap */
const ACTIVE = '2025-01-01';

/** where a stop's mark is drawn: it spans a..b across at height y */
export type Spot = { a: number; b: number; y: number };

/** one plain line per year. [words] name a stop (by its label, or [words|start of its title]) */
export const STORY: Record<number, string> = {
	2020: 'starts [writing|my first blog post]. builds [macos web], a mac desktop in the browser.',
	2021: 'macos web moves from react to svelte. [neodrag], the first library.',
	2022: 'first talk, at [svelte summit|macos web: react to svelte]. neoconfetti.',
	2023: 'joins the svelte team. rebuilds [svelte.dev].',
	2024: '[neotraverse]. svelte in react, at react india.',
	2025: 'rewrites neodrag from scratch.',
	2026: 'neosanitize, aibind. [ogygia], then [heisenbench].',
};

export type Part = { t: string; i?: number };
/** a year's line, cut into plain words and words that name a stop */
export function story(stations: Station[], year: number): Part[] {
	const src = STORY[year];
	if (!src) return [];
	const out: Part[] = [];
	let at = 0;
	for (const m of src.matchAll(/\[([^\]|]+)(?:\|([^\]]+))?\]/g)) {
		if (m.index! > at) out.push({ t: src.slice(at, m.index) });
		const key = (m[2] ?? m[1]).toLowerCase();
		const i = stations.findIndex((x) => x.label?.toLowerCase() === key || x.title.toLowerCase().startsWith(key));
		out.push(i < 0 ? { t: m[1] } : { t: m[1], i });
		at = m.index! + m[0].length;
	}
	if (at < src.length) out.push({ t: src.slice(at) });
	return out;
}
/** the stops the story names: they are drawn strong, the rest stay quiet */
export const milestones = (stations: Station[]) =>
	new Set(
		Object.keys(STORY).flatMap((y) =>
			story(stations, +y)
				.map((p) => p.i)
				.filter((i) => i !== undefined),
		),
	);

// the drawing's frame, in px: room above the first stop and below the last
export const TOP = 66;
export const BOT = 26;

/**
 * where time sits down the drawable height, 0..1. mostly by rank, so busy months breathe, but
 * every year gets at least MIN of the height, so its line of story always has room. css uses
 * the same numbers to place the story, so it is right from the first paint.
 */
export function scale(stations: Station[], MIN = 0.1) {
	const times = stations.map((s) => T(s.date));
	const t0 = times[0];
	const t1 = times.at(-1)!;
	const u = (t: number) => {
		const lin = (t - t0) / (t1 - t0);
		let i = times.findIndex((x) => x >= t);
		if (i < 0) i = times.length - 1;
		let rank = i;
		if (i > 0 && times[i] > t) rank = i - 1 + (t - times[i - 1]) / (times[i] - times[i - 1]);
		return 0.3 * lin + (0.7 * rank) / (times.length - 1);
	};
	const y0 = new Date(t0).getUTCFullYear();
	const y1 = new Date(t1).getUTCFullYear();
	const years: number[] = [];
	for (let y = y0; y <= y1; y++) years.push(y);
	// band edges before and after: each year's top, then the end
	const from = [0, ...years.slice(1).map((y) => u(T(`${y}-01-01`))), 1];
	const h = years.map((_, i) => from[i + 1] - from[i]);
	const k = h.slice();
	// lift the thin years to MIN, taking the room from the rest in proportion
	for (let n = 0; n < years.length; n++) {
		const low = k.map((v) => v < MIN - 1e-9);
		const lifted = low.filter(Boolean).length * MIN;
		const rest = h.reduce((a, v, i) => a + (low[i] ? 0 : v), 0);
		let changed = false;
		k.forEach((_, i) => {
			const v = low[i] ? MIN : (h[i] * (1 - lifted)) / rest;
			if (Math.abs(v - k[i]) > 1e-12) changed = true;
			k[i] = v;
		});
		if (!changed) break;
	}
	const to = [0];
	k.forEach((v) => to.push(to.at(-1)! + v));
	const at = (t: number) => {
		const v = u(t);
		let i = from.findIndex((f, j) => j < years.length && v >= f && v <= from[j + 1]);
		if (i < 0) i = v <= 0 ? 0 : years.length - 1;
		return to[i] + ((v - from[i]) / (h[i] || 1)) * k[i];
	};
	// rows: a year, and how far down its band starts and ends
	return { at, years: years.map((y, i) => ({ y, a: to[i], b: to[i + 1] })) };
}

/** x0: where the map starts; col: where the story starts, the map keeps left of it; wires: the story's named words */
export type Opts = { x0?: number; col?: number; wires?: { i: number; y: number }[] };

export function draw(stations: Station[], W: number, H: number, o: Opts = {}): { svg: string; spots: Spot[] } {
	const times = stations.map((s) => T(s.date));
	const t1 = times.at(-1)!;
	const active = T(ACTIVE);
	const sc = scale(stations);
	const strong = milestones(stations);

	const Y = (t: number) => px(TOP + sc.at(t) * (H - TOP - BOT));
	const axis = o.x0 ?? 44;
	// as wide as the room left of the story allows, within reason
	const room = (o.col ?? W) - axis - 14 - 30;
	let gap = Math.max(14, Math.min(40, room / (ORDER.length - 1)));
	const first = (id: string) => Y(T(stations.find((x) => x.lines.includes(id))!.date));
	for (const [id, p] of Object.entries(PARENT)) {
		const lanes = Math.abs(ORDER.indexOf(id as never) - ORDER.indexOf(p as never));
		gap = Math.min(gap, (first(id) - first(p) - 8) / lanes);
	}
	gap = Math.floor(gap);
	const X = (id: string) => px(axis + 14 + ORDER.indexOf(id as never) * gap);
	// lane names stand steeper when the lanes are close, so they never touch
	const tilt = gap < 24 ? -60 : -45;

	let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" fill="none" stroke="currentColor">`;

	// the lines: worked out parent first, drawn child first, so a parent runs unbroken over the
	// spot where a branch leaves it
	const arrive: Record<string, number> = {};
	const lines: string[] = [];
	for (const id of ORDER) {
		const own = stations.filter((x) => x.lines.includes(id));
		if (!own.length) continue;
		const ys = Y(T(own[0].date));
		const lastT = T(own.at(-1)!.date);
		const ye = lastT >= active ? Y(t1) + 18 : Y(lastT);
		const x = X(id);
		let d: string;
		let l = '';
		if (PARENT[id]) {
			const px_ = X(PARENT[id]);
			const dx = Math.abs(x - px_);
			// leave the parent only once it is running straight on its own lane
			const yb = Math.min(Math.max(ys - dx, arrive[PARENT[id]] + 14), ys);
			d = `M${px_} ${yb} L${x} ${yb + dx} L${x} ${ye}`;
			arrive[id] = yb + dx;
		} else {
			d = `M${x} ${ys} L${x} ${ye}`;
			arrive[id] = ys;
			l += `<line x1="${x - 6}" x2="${x + 6}" y1="${ys - 0.5}" y2="${ys - 0.5}" stroke-width="2"/>`;
		}
		// every lane is named at the head of its column, and a faint rail runs down to where the
		// line starts, so a name is never far from its line
		const head = TOP - 14;
		if (arrive[id] - head > 10) l += `<line class="rail" x1="${x}" x2="${x}" y1="${head}" y2="${arrive[id] - 4}" stroke-width="1" stroke-dasharray="1 3"/>`;
		l += stroke(id, d);
		if (lastT < active) l += `<line x1="${x - 6}" x2="${x + 6}" y1="${ye - 0.5}" y2="${ye - 0.5}" stroke-width="2"/>`;
		l += `<text class="ln-name" transform="translate(${x - 2} ${head - 4}) rotate(${tilt})" stroke="none">${NAMES[id]}</text>`;
		lines.unshift(`<g class="ln" data-ln="${id}">${l}</g>`);
	}
	s += lines.join('');

	// wires from the stops the story names to the words that name them (the island measures those)
	// they run out level, turn at 45° onto the word's line, and stop at the column's edge
	const end = o.col ?? W;
	for (const w of o.wires ?? []) {
		const x = stations[w.i];
		const y = Y(T(x.date));
		const xm = Math.max(...x.lines.map(X)) + 8;
		const wy = px(w.y);
		const elbow = Math.max(xm + 2, end - 10 - Math.abs(wy - y));
		s += `<path class="wire" data-i="${w.i}" d="M${xm} ${y} H${elbow} L${end - 10} ${wy} H${end - 5}" stroke-width="1" stroke-dasharray="1 2"/>`;
		s += `<circle class="wire" data-i="${w.i}" cx="${end - 5}" cy="${wy}" r="1.5" fill="currentColor" stroke="none"/>`;
	}

	// stops. each is a focusable link; only one is in the tab order at a time (the island moves it)
	const spots: Spot[] = [];
	stations.forEach((x, i) => {
		const y = Y(T(x.date));
		const xs = x.lines.map(X);
		const a = Math.min(...xs);
		let b = Math.max(...xs);
		const big = strong.has(i);
		let m = '';
		if (xs.length > 1) {
			// a change between lines: a paper gap where it crosses the lines in between
			m += `<line x1="${a}" x2="${b}" y1="${y}" y2="${y}" stroke-width="4" stroke="var(--paper)"/>`;
			m += `<line x1="${a}" x2="${b}" y1="${y}" y2="${y}" stroke-width="1"/>`;
			m += xs
				.map(
					(cx) =>
						`<circle class="mark" cx="${cx}" cy="${y}" r="${big ? 4.5 : 3}" fill="${big ? 'currentColor' : 'var(--paper)'}" stroke-width="${big ? 1.25 : 1}"/>`,
				)
				.join('');
		} else if (big) {
			m = `<circle class="mark" cx="${a}" cy="${y}" r="5" fill="currentColor" stroke-width="1.25"/>`;
		} else if (x.kind === 'work') {
			m = `<circle class="mark" cx="${a}" cy="${y}" r="3.5" fill="currentColor" stroke-width="1"/>`;
		} else {
			// one-sided ticks, all pointing the same way
			const st = STYLE[x.lines[0]];
			const o = Math.ceil(st.w / 2);
			m = `<line class="mark" x1="${a + o}" x2="${a + o + 5}" y1="${y - 0.5}" y2="${y - 0.5}" stroke-width="2"/>`;
			b = a + o + 5;
		}
		spots.push({ a, b, y });
		const name = `${KIND[x.kind]}, ${ym(x.date)}: ${x.title}`;
		s += `<g class="st${big ? ' big' : ''}" data-i="${i}" data-ln="${x.lines.join(' ')}" tabindex="-1" role="${x.href ? 'link' : 'img'}" aria-label="${esc(name)}">${m}</g>`;
	});

	s += '</svg>';
	return { svg: s, spots };
}

/** how far down the drawable height a year's rule sits (0..1); its y is TOP + k * (H - TOP - BOT) */
export function rule_k(stations: Station[], year: number) {
	return scale(stations).years.find((r) => r.y === year)?.a ?? 0;
}
