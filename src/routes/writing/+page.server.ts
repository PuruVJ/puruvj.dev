import { posts } from '#lib/content.server.ts';
import { SERIES } from '#lib/series.ts';

export const load = async () => {
	const all = await posts();
	const years = new Map<string, typeof all>();
	for (const p of all) {
		const y = p.date.slice(0, 4);
		years.set(y, [...(years.get(y) ?? []), p]);
	}
	const series = Object.entries(SERIES)
		.map(([key, name]) => {
			const parts = all.filter((p) => p.series === key);
			return { key, name, count: parts.length, first: parts.at(-1)?.slug ?? '' };
		})
		.filter((s) => s.count > 1);
	return { count: all.length, years: [...years], series, first: all.at(-1)!.date };
};
