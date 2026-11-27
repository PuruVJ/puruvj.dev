import { posts, projects, stations } from '$lib/content.server.ts';
import { read_stats } from '$lib/stats/source.server.ts';

export const load = async () => {
	const all = await posts();
	const work = (await projects()).slice(0, 3);
	const stats = await read_stats();
	return {
		latest: all.slice(0, 2),
		count: all.length,
		work: work.map((w) => ({ title: w.title, tagline: w.tagline, url: w.url })),
		stations: await stations(),
		downloads: stats?.npm?.total ?? null,
	};
};
