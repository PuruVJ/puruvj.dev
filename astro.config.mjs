import mdx from '@astrojs/mdx';
import svelte from '@astrojs/svelte';
import { defineConfig } from 'astro/config';
import { h } from 'hastscript';
import rehype_autolink_headings from 'rehype-autolink-headings';
import rehype_slug from 'rehype-slug';

// https://astro.build/config
export default defineConfig({
	integrations: [mdx(), svelte()],
	image: {
		service: {
			entrypoint: 'astro/assets/services/sharp',
			config: {
				limitInputPixels: false,
			},
		},
	},
	vite: {
		css: {
			transformer: 'lightningcss',
		},
		build: {
			cssMinify: 'lightningcss',
		},
	},
	experimental: {
		contentCollectionCache: true,
	},
	markdown: {
		rehypePlugins: [
			rehype_slug,
			[
				rehype_autolink_headings,
				{
					behavior: 'prepend',
					content(node) {
						return [
							h('span.visually-hidden', '#'),
							h('span.icon.icon-link', { ariaHidden: 'true' }),
						];
					},
				},
			],
		],
	},
});
