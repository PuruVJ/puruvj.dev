import { sveltekit } from '@sveltejs/kit/vite';
import { content } from '@ogygia/content/vite';
import { ogygia } from 'ogygia/vite';
import { defineConfig } from 'vite';
import { ink } from './src/lib/ink-theme.ts';
import { rehypeQuiet } from './src/lib/rehype-quiet.ts';

export default defineConfig({
	plugins: [
		ogygia(),
		content({
			markdown: {
				themes: ink,
				langs: ['svelte', 'ts', 'tsx', 'js', 'jsx', 'html', 'css', 'scss', 'bash', 'shell', 'json', 'yaml', 'text', 'go', 'diff', 'md'],
				rehype: [rehypeQuiet],
			},
		}),
		sveltekit(),
	],
});
