import { puru, posts } from '$lib/content.server.ts';

export const prerender = true;

export const GET = puru.emit.rss({
	title: "puru's blog",
	description: 'everything web development, engineering, procrastination, and life.',
	base: '/blog',
	items: async () =>
		(await posts()).map((p) => ({ href: `/blog/${p.slug}`, title: p.title, description: p.description, date: p.date })),
});
