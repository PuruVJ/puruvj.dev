import { work, projects } from '#lib/content.server.ts';
import { read_stats } from '#lib/stats/source.server.ts';
import { project_numbers } from '#lib/project-stats.ts';

export const load = async () => {
	const [list, stats] = await Promise.all([projects(), read_stats()]);
	const items = await Promise.all(
		list.map(async (p) => {
			const entry = await work.get(p.slug);
			return {
				...p,
				...project_numbers(p, stats),
				body: entry ? await entry.body : null,
			};
		}),
	);
	return {
		items,
		total: stats?.npm?.total ?? null,
		stars: stats?.github?.stars ?? null,
		fetchedAt: stats?.fetchedAt ?? null,
	};
};
