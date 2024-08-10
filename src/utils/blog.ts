import { getCollection } from 'astro:content';

export const SLUG_REGEX = /^(?:\d{2}-?)?\d{4}-\d{2}-\d{2}-(.+)\/post/;
export const DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})-/;

const blog_collection = await getCollection('blog');

export function get_date(slug: string) {
	const match = DATE_REGEX.exec(slug);
	if (!match) return null;
	const [yyyy, mm, dd] = match.slice(1);
	return Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	}).format(new Date(+yyyy, +mm - 1, +dd));
}

export function get_slug(slug: string) {
	return slug.replace(SLUG_REGEX, '$1');
}

export async function get_list() {
	return blog_collection
		.map((post) => ({
			slug: get_slug(post.slug),
			...post.data,
			date: get_date(post.slug),
		}))
		.toReversed();
}

export async function get_post(post: (typeof blog_collection)[number]) {
	const { Content, headings } = await post.render();
	const { title, cover_image, render_cover, series } = post.data;

	const date = get_date(post.slug);

	return {
		title,
		cover_image,
		render_cover,
		series,
		body: Content,
		toc: headings,
		date,
	};
}
