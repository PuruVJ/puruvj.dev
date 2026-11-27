// a stat's history as an svg path, drawn at build time. real points only: no series, no graph.

export type Graph = { line: string; area: string };

const W = 100;
const H = 40;

/** every month from the first to the last key, so quiet months count as zero */
function month_range(keys: string[]) {
	const out: string[] = [];
	let [y, m] = keys[0].split('-').map(Number);
	const [y1, m1] = keys.at(-1)!.split('-').map(Number);
	while (y < y1 || (y === y1 && m <= m1)) {
		out.push(`${y}-${String(m).padStart(2, '0')}`);
		if (++m > 12) (m = 1), y++;
	}
	return out;
}

/** a running total over time, thinned to at most `max` points */
function path(values: number[], max = 100, min = 3): Graph | null {
	let run = 0;
	let pts = values.map((v) => (run += v));
	// short series start from zero, so even a single month draws a rise
	if (min < 3) pts.unshift(0);
	if (pts.length < min) return null;
	const top = pts.at(-1)!;
	if (!top) return null;
	if (pts.length > max) {
		const step = (pts.length - 1) / (max - 1);
		pts = Array.from({ length: max }, (_, i) => pts[Math.round(i * step)]);
	}
	const n = pts.length - 1;
	const xy = pts.map((v, i) => `${((i / n) * W).toFixed(2)} ${(H - (v / top) * (H - 2)).toFixed(2)}`);
	const line = 'M' + xy.join('L');
	return { line, area: `${line}L${W} ${H}L0 ${H}Z` };
}

/** per-month counts (yyyy-mm -> n) as a cumulative curve */
export function monthly(series: Record<string, number> | null | undefined): Graph | null {
	if (!series) return null;
	const keys = Object.keys(series).sort();
	if (keys.length < 3) return null;
	return path(month_range(keys).map((k) => series[k] ?? 0));
}

/** one project's per-month downloads from `from` to `to` (yyyy-mm), quiet months as zero.
 *  a curve needs only two points here, so a one-month-old package still gets its line. */
export function monthly_on(series: Record<string, number> | null | undefined, from: string, to: string): Graph | null {
	if (!series || !Object.keys(series).length) return null;
	return path(month_range([from, to]).map((k) => series[k] ?? 0), 100, 2);
}

/** per-week rows (yyyy-mm-dd -> [a, d, c]) as a cumulative curve of one column */
export function weekly(series: Record<string, [number, number, number]> | null | undefined, col: 0 | 1 | 2): Graph | null {
	if (!series) return null;
	const keys = Object.keys(series).sort();
	return path(keys.map((k) => series[k][col]));
}
