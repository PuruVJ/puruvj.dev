import { projects } from '$lib/content.server.ts';
import { read_stats } from '$lib/stats/source.server.ts';
import { project_numbers } from '$lib/project-stats.ts';

export const load = async () => {
	const [list, stats] = await Promise.all([projects(), read_stats()]);
	const rows = list
		.map((p) => ({ title: p.title, url: p.url, ...project_numbers(p, stats) }))
		.filter((r) => r.downloads);
	rows.sort((a, b) => b.downloads! - a.downloads!);
	const packages = stats?.npm ? Object.keys(stats.npm.packages).length : 0;
	return { stats, rows, packages };
};
