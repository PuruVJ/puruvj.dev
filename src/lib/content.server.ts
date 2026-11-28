import { content, dated, dateOf } from '@ogygia/content';
import * as v from 'valibot';
import { isImage, type ImageDescriptor } from '@ogygia/image';
import { SERIES, type SeriesKey } from './series.ts';

/** yaml turns `2024-07-09` into a Date; keep it a plain `yyyy-mm-dd` string. */
const day = v.pipe(
	v.unknown(),
	v.transform((x) => (x instanceof Date ? x.toISOString().slice(0, 10) : String(x))),
);
const lines = v.optional(v.array(v.string()), ['js']);
/** a `./cover.png` beside the entry: @ogygia/image reads it at build into a descriptor */
const cover = v.optional(v.custom<ImageDescriptor>(isImage));

/** posts: `content/blog/2021-08-18-golang-as-javascripter/+doc.svx` -> `golang-as-javascripter` */
export const blog = content({
	loader: import.meta.og.loader.folder('../content/blog', { convention: dated() }),
	schema: v.object({
		title: v.string(),
		description: v.string(),
		cover_image: cover,
		render_cover: v.optional(v.boolean(), true),
		series: v.optional(v.picklist(Object.keys(SERIES) as SeriesKey[])),
		lines,
	}),
});

/** projects, ordered by their `NN-` folder prefix */
export const work = content({
	loader: import.meta.og.loader.folder('../content/work'),
	schema: v.object({
		title: v.string(),
		tagline: v.string(),
		url: v.string(),
		npm: v.optional(v.string()),
		stack: v.string(),
		repo: v.object({ url: v.string() }),
		cover_image: cover,
		/** the day the project began (first commit / repo created). every page reads it from here. */
		started: day,
		lines,
		stats: v.string(),
	}),
});

/** talks and podcasts: `content/speaking/talk/00-react-india-2024-october/+doc.svx` */
export const speaking = content({
	loader: import.meta.og.loader.folder('../content/speaking'),
	schema: v.object({
		title: v.string(),
		event: v.string(),
		url: v.string(),
		date: day,
		cover_image: cover,
		label: v.optional(v.string()),
		lines,
	}),
});

export type PostMeta = {
	slug: string;
	title: string;
	description: string;
	date: string;
	series?: SeriesKey;
	lines: string[];
	minutes: number;
};

const raw = import.meta.glob('../content/blog/*/+doc.svx', {
	eager: true,
	query: '?raw',
	import: 'default',
}) as Record<string, string>;
const words = new Map(
	Object.entries(raw).map(([k, src]) => [k.split('/').at(-2)!.slice(11), src.split(/\s+/).length]),
);

/** Every post, newest first. */
export async function posts(): Promise<PostMeta[]> {
	const refs = await blog.refs();
	return refs
		.map((r) => ({
			slug: r.id,
			title: r.data.title,
			description: r.data.description,
			date: dateOf(r.filePath?.split('/').at(-2) ?? '') ?? '',
			series: r.data.series,
			lines: r.data.lines,
			minutes: Math.max(1, Math.ceil((words.get(r.id) ?? 0) / 220)),
		}))
		.sort((a, b) => b.date.localeCompare(a.date));
}

export async function projects() {
	const refs = await work.refs();
	return refs.map((r) => ({ slug: r.id, ...r.data }));
}

export async function talks() {
	const refs = await speaking.refs();
	return refs
		.map((r) => ({ id: r.id, kind: r.id.split('/')[0] as 'talk' | 'podcast', ...r.data }))
		.sort((a, b) => b.date.localeCompare(a.date));
}

import type { Station } from './home/map.ts';

/** the home page's transit map, from the real content */
export async function stations(): Promise<Station[]> {
	const [p, w, t] = await Promise.all([posts(), projects(), talks()]);
	const oldest = p.at(-1)?.slug;
	const all: Station[] = [
		...p.map((x) => ({
			kind: 'post' as const,
			date: x.date,
			title: x.title,
			lines: x.lines,
			label: x.slug === oldest ? 'first post' : undefined,
			href: `/blog/${x.slug}`,
		})),
		...w.map((x) => ({ kind: 'work' as const, date: x.started, title: `${x.title}: ${x.tagline}`, lines: x.lines, label: x.title, href: x.url })),
		...t.map((x) => ({ kind: x.kind, date: x.date, title: `${x.title} (${x.event})`, lines: x.lines, label: x.label, href: x.url })),
	];
	return all.sort((a, b) => a.date.localeCompare(b.date));
}

import { site } from '@ogygia/content';

/**
 * The site layer: the writing collection mounted at /blog, plus the plain pages as links.
 * It gives prev/next for posts, the rss feed, llms.txt, sitemap.xml and every post as raw markdown.
 */
export const puru = site({
	outline: [
		{ label: 'pages', items: [
			{ label: 'home: who puru is, in one screen', href: '/index.md' },
			{ label: 'work: every project, with download and star counts', href: '/work.md' },
			{ label: 'career: every job, newest first', href: '/career.md' },
			{ label: 'talks and podcasts', href: '/speaking.md' },
			{ label: 'stats: npm downloads, github stars, lines of code', href: '/stats.md' },
		] },
		{ label: 'writing', base: 'blog', items: blog },
	],
	trail: 'group',
	data: {
		title: 'puru vijayvargia',
		description:
			'puru vijayvargia makes small, fast things for the web and is on the svelte team. every page here also exists as markdown: add .md to any url.',
		origin: 'https://puruvj.dev',
	},
});
