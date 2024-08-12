import { defineCollection, z } from 'astro:content';
import { SERIES } from './series.ts';

const [first_key, ...rest] = Object.keys(SERIES) as (keyof typeof SERIES)[];

const blog = defineCollection({
	type: 'content',
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			cover_image: image().optional(),
			render_cover: z.boolean().optional().default(true),
			series: z.enum([first_key!, ...rest]).optional(),
		}),
});

const work = defineCollection({
	type: 'content',
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			url: z.string(),
			stack: z.string(),
			repo: z.object({
				url: z.string(),
			}),
			cover_image: image(),
		}),
});

const speaking = defineCollection({
	type: 'data',
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			event: z.string(),
			url: z.string(),
			cover_image: image(),
		}),
});

export const collections = { blog, work, speaking };
