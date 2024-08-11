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

function get_reading_time(body: string) {
	const words = body.split(/\s+/).length;
	return Math.ceil(words / 220);
}

export function get_slug(slug: string) {
	return slug.replace(SLUG_REGEX, '$1');
}

export function get_series(series_name: string | undefined) {
	if (!series_name) return [];

	// Now find all the posts with the same series
	const posts_with_series = blog_collection.filter((post) => post.data.series === series_name);

	return posts_with_series;
}

export async function get_list() {
	return blog_collection
		.map((post) => ({
			slug: get_slug(post.slug),
			...post.data,
			series: get_series(post.data.series),
			series_name: post.data.series,
			date: get_date(post.slug),
			reading_time: get_reading_time(post.body),
		}))
		.toReversed();
}

export async function get_post(post: (typeof blog_collection)[number]) {
	const { title, cover_image, render_cover, series } = post.data;

	const date = get_date(post.slug);

	return {
		slug: get_slug(post.slug),
		title,
		cover_image,
		render_cover,
		series,
		date,
		reading_time: get_reading_time(post.body),
	};
}
