import { error } from '@sveltejs/kit';
import { render } from '$lib/og/card.ts';
import { posts } from '$lib/content.server.ts';

export const prerender = true;
export const entries = async () => (await posts()).map((p) => ({ slug: p.slug }));

const dotted = (d: string) => d.replaceAll('-', '.');

export const GET = async ({ params }) => {
	const p = (await posts()).find((x) => x.slug === params.slug);
	if (!p) error(404);
	const png = await render({
		kicker: `puruvj.dev / writing`,
		aside: dotted(p.date),
		title: p.title,
		sub: p.description,
		facts: [
			{ big: `${p.minutes} min`, small: 'to read' },
			{ big: dotted(p.date).slice(0, 7), small: 'published' },
		],
	});
	return new Response(new Uint8Array(png), { headers: { 'content-type': 'image/png' } });
};
