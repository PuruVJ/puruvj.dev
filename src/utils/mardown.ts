export const SLUG_REGEX = /^(?:\d{2}-?)?\d{4}-\d{2}-\d{2}-(.+)\/post/;
export const DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})-/;

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
