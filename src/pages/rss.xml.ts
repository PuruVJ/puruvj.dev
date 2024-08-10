import rss from '@astrojs/rss';
import { get_list } from '@utils/blog';
import type { APIRoute } from 'astro';

export const GET = (async () => {
	return rss({
		title: "Puru's Blog",
		// `<description>` field in output xml
		description: 'Everything web development, engineerring, procrastination, and life.',

		site: 'https://puruvj.dev',

		items: (await get_list()).map((post) => ({
			title: post.title,
			description: post.description,
			pubDate: new Date(post.date!) ?? new Date(),
			link: `/blog/${post.slug}`,
		})),
	});
}) satisfies APIRoute;
