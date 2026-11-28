import { puru, posts } from '$lib/content.server.ts';

export const prerender = true;

export const GET = puru.emit.rss({
	title: "puru's blog",
	description: 'everything web development, engineering, procrastination, and life.',
	base: '/writing',
	items: async () =>
		(await posts()).map((p) => ({ href: `/writing/${p.slug}`, title: p.title, description: p.description, date: p.date })),
});
