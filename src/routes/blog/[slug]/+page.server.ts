import { error } from '@sveltejs/kit';
import { puru, posts } from '$lib/content.server.ts';
import { SERIES } from '$lib/series.ts';

export const load = async ({ params }) => {
	const view = await puru.page<{ title: string; description: string; series?: keyof typeof SERIES }>(
		`blog/${params.slug}`,
	);
	if (!view) error(404, 'no such post');
	const all = await posts();
	const me = all.find((p) => p.slug === params.slug)!;
	const series = me.series
		? all
				.filter((p) => p.series === me.series)
				.reverse()
				.map((p) => ({ slug: p.slug, title: p.title }))
		: [];
	const n = all.length - all.indexOf(me);
	const link = (r?: { href: string; title: string }) => (r ? { href: r.href, title: r.title } : null);
	return {
		slug: params.slug,
		n,
		title: view.entry.data.title,
		description: view.entry.data.description,
		date: me.date,
		minutes: me.minutes,
		series: me.series ? { name: SERIES[me.series], posts: series } : null,
		headings: view.headings.filter((h) => h.depth <= 3),
		prev: link(view.trail.prev),
		next: link(view.trail.next),
		body: await view.entry.body,
	};
};
