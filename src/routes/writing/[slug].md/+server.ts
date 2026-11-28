import { error } from '@sveltejs/kit';
import { puru, posts } from '$lib/content.server.ts';

const raw = puru.emit.raw();

export const prerender = true;
export const entries = async () =>
	(await raw.entries()).filter((e) => e.slug.startsWith('writing/')).map((e) => ({ slug: e.slug.slice(8) }));

/** the post as markdown, with its title, date and summary on top */
export const GET = async ({ params }: { params: { slug: string } }) => {
	const post = (await posts()).find((p) => p.slug === params.slug);
	const res = await raw.GET({ params: { slug: `writing/${params.slug}` } });
	if (!post || !res.ok) error(404, 'no such post');
	const head = `# ${post.title}\n\n> ${post.description}\n\npublished ${post.date} · ${post.minutes} min read · https://puruvj.dev/writing/${post.slug}\n\n`;
	return new Response(head + (await res.text()).trimStart(), {
		headers: { 'content-type': 'text/markdown; charset=utf-8' },
	});
};
