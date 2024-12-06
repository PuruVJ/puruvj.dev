import { defineCollection, z } from 'astro:content';
import { SERIES } from './content/series.ts';
import { glob } from 'astro/loaders';

const [first_key, ...rest] = Object.keys(SERIES) as (keyof typeof SERIES)[];

const blog = defineCollection({
	loader: glob({ pattern: '*/*.mdx', base: './src/content/blog' }),
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
	loader: glob({ pattern: '**/*.md', base: './src/content/work' }),
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
	loader: glob({ pattern: '**/*.json', base: './src/content/speaking' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			event: z.string(),
			url: z.string(),
			cover_image: image(),
		}),
});

export const collections = { blog, work, speaking };
