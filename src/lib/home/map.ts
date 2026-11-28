// six years as a transit map. time runs top to bottom; lines are told apart by stroke alone
// (weight, dash, a doubled rail, a cased line), and branches leave their parent at 45°.
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
/** trim a label to the room the gutter has (mono 11px is ~6.6px a character) */
const fit = (s: string, room: number) => {
	const n = Math.floor(room / 6.7);
	return s.length <= n ? s : s.slice(0, Math.max(1, n - 1)) + '…';
};
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
/** snap to the middle of a pixel, where a 1px line is sharp */
const px = (v: number) => Math.round(v - 0.5) + 0.5;
const KIND = { post: 'writing', work: 'project', talk: 'talk', podcast: 'podcast' } as const;

/** lines with no stop after this date are drawn as finished, with an end cap */
const ACTIVE = '2025-01-01';

/** where a stop's mark is drawn: it spans a..b across at height y */
export type Spot = { a: number; b: number; y: number };

export function draw(stations: Station[], W: number, H: number): { svg: string; spots: Spot[] } {
	const times = stations.map((s) => T(s.date));
	const t0 = times[0];
	const t1 = times.at(-1)!;
	const active = T(ACTIVE);

	// y: part calendar, mostly rank, so busy months breathe and quiet years stay visible
	const u = (t: number) => {
		const lin = (t - t0) / (t1 - t0);
		let i = times.findIndex((x) => x >= t);
		if (i < 0) i = times.length - 1;
		let rank = i;
		if (i > 0 && times[i] > t) rank = i - 1 + (t - times[i - 1]) / (times[i] - times[i - 1]);
		return 0.3 * lin + (0.7 * rank) / (times.length - 1);
	};
	const top = 6;
	const bot = H - 64;
	const Y = (t: number) => px(top + u(t) * (bot - top));
	const axis = 44;
	let gap = Math.max(26, Math.min(50, ((W - axis) * 0.46) / (ORDER.length - 1)));
	const first = (id: string) => Y(T(stations.find((x) => x.lines.includes(id))!.date));
	for (const [id, p] of Object.entries(PARENT)) {
		const lanes = Math.abs(ORDER.indexOf(id as never) - ORDER.indexOf(p as never));
		gap = Math.min(gap, (first(id) - first(p) - 8) / lanes);
	}
	gap = Math.floor(gap);
	const X = (id: string) => px(axis + 14 + ORDER.indexOf(id as never) * gap);
	const gutter = X(ORDER.at(-1)!) + 40;

	let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" fill="none" stroke="currentColor">`;
	const y0 = new Date(t0).getUTCFullYear();
	const y1 = new Date(t1).getUTCFullYear();
	for (let y = y0 + 1; y <= y1; y++) {
		const yy = Y(T(`${y}-01-01`));
		s += `<line x1="0" x2="${W}" y1="${yy}" y2="${yy}" stroke="var(--hair)" stroke-width="1"/>`;
		s += `<text class="yr" x="0" y="${yy - 6}" stroke="none">${y}</text>`;
	}
	s += `<text class="yr" x="0" y="${top + 4}" stroke="none">${y0}</text>`;

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
		l += stroke(id, d);
		if (lastT < active) l += `<line x1="${x - 6}" x2="${x + 6}" y1="${ye - 0.5}" y2="${ye - 0.5}" stroke-width="2"/>`;
		// read at a slant, like a station name on a metro map, not turned on its side
		l += `<text class="ln-name" transform="translate(${x - 2} ${ye + 12}) rotate(45)" stroke="none">${NAMES[id]}</text>`;
		lines.unshift(`<g class="ln" data-ln="${id}">${l}</g>`);
	}
	s += lines.join('');

	// labels in a gutter, overlaps pushed down
	const lab = stations.map((x, i) => ({ x, i, y: Y(T(x.date)), ly: 0 })).filter((l) => l.x.label);
	let last = -99;
	for (const l of lab) {
		l.ly = Math.max(l.y, last + 17);
		last = l.ly;
	}
	for (const l of lab) {
		const xm = Math.max(...l.x.lines.map(X)) + 7;
		s += `<g class="lb" data-i="${l.i}"><path d="M${xm} ${l.y} H${gutter - 12} L${gutter - 4} ${l.ly}" stroke="var(--ink-3)" stroke-width="1" stroke-dasharray="1 3"/>`;
		s += `<text class="lbl" x="${gutter}" y="${l.ly + 3.5}" stroke="none">${esc(fit(l.x.label!, W - gutter))}${W - gutter > 190 ? `<tspan class="lbl-d" dx="10">${ym(l.x.date)}</tspan>` : ''}</text></g>`;
	}

	// stops. each is a focusable link; only one is in the tab order at a time (the island moves it)
	const spots: Spot[] = [];
	stations.forEach((x, i) => {
		const y = Y(T(x.date));
		const xs = x.lines.map(X);
		const a = Math.min(...xs);
		let b = Math.max(...xs);
		const big = x.kind === 'work';
		let m = '';
		if (xs.length > 1) {
			// a change between lines: a paper gap where it crosses the lines in between
			m += `<line x1="${a}" x2="${b}" y1="${y}" y2="${y}" stroke-width="4" stroke="var(--paper)"/>`;
			m += `<line x1="${a}" x2="${b}" y1="${y}" y2="${y}" stroke-width="1" stroke="var(--ink-2)"/>`;
			m += xs
				.map(
					(cx) =>
						`<circle class="mark" cx="${cx}" cy="${y}" r="${big ? 4 : 3.5}" fill="${big ? 'currentColor' : 'var(--paper)'}" stroke-width="1.25"/>`,
				)
				.join('');
		} else if (big) {
			m = `<circle class="mark" cx="${a}" cy="${y}" r="4.5" fill="currentColor" stroke-width="1.25"/>`;
		} else {
			// one-sided ticks, all pointing the same way
			const st = STYLE[x.lines[0]];
			const o = Math.ceil(st.w / 2);
			m = `<line class="mark" x1="${a + o}" x2="${a + o + 6}" y1="${y - 0.5}" y2="${y - 0.5}" stroke-width="2"/>`;
			b = a + o + 6;
		}
		spots.push({ a, b, y });
		const name = `${KIND[x.kind]}, ${ym(x.date)}: ${x.title}`;
		s += `<g class="st" data-i="${i}" data-ln="${x.lines.join(' ')}" tabindex="-1" role="${x.href ? 'link' : 'img'}" aria-label="${esc(name)}">${m}</g>`;
	});

	s += `<text class="yr" x="0" y="${Y(t1) + 4}" stroke="none" style="fill:var(--ink)">now</text>`;
	s += '</svg>';
	return { svg: s, spots };
}

/** y of a year's rule, for things that want to sit on one (the clay mic) */
export function rule_y(stations: Station[], H: number, year: number) {
	return 6 + rule_k(stations, year) * (H - 64 - 6);
}

/** how far down the drawable height a year's rule sits (0..1); rule_y = 6 + k * (H - 70) */
export function rule_k(stations: Station[], year: number) {
	const times = stations.map((s) => T(s.date));
	const t0 = times[0];
	const t1 = times.at(-1)!;
	const t = T(`${year}-01-01`);
	const lin = (t - t0) / (t1 - t0);
	let i = times.findIndex((x) => x >= t);
	if (i < 0) i = times.length - 1;
	let rank = i;
	if (i > 0 && times[i] > t) rank = i - 1 + (t - times[i - 1]) / (times[i] - times[i - 1]);
	return 0.3 * lin + (0.7 * rank) / (times.length - 1);
}
