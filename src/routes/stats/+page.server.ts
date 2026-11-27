import { projects } from '$lib/content.server.ts';
import { read_stats } from '$lib/stats/source.server.ts';
import { project_numbers } from '$lib/project-stats.ts';
import { monthly, monthly_on, weekly } from '$lib/stats/graph.ts';

export const load = async () => {
	const [list, stats] = await Promise.all([projects(), read_stats()]);
	// every project's own history, from its first download to this month
	const last = Object.keys(stats?.npm?.months ?? {}).sort().at(-1);
	const own = (s: Record<string, number> | undefined) => {
		const first = Object.keys(s ?? {}).sort()[0];
		return last && first ? monthly_on(s, first, last) : null;
	};
	const rows = list
		.map((p) => ({
			title: p.title,
			url: p.url,
			...project_numbers(p, stats),
			graph: own(stats?.npm?.groupMonths?.[p.stats]),
		}))
		.filter((r) => r.downloads);
	rows.sort((a, b) => b.downloads! - a.downloads!);
	const packages = stats?.npm ? Object.keys(stats.npm.packages).length : 0;
	// each big number's history, drawn here so the page ships paths, not data
	const graphs = {
		npm: monthly(stats?.npm?.months),
		stars: monthly(stats?.github?.starMonths),
		lines: weekly(stats?.code?.weeks, 0),
		commits: weekly(stats?.code?.weeks, 2),
	};
	return { stats, rows, packages, graphs };
};
