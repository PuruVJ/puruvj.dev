import { sveltekit } from '@sveltejs/kit/vite';
import { content } from '@ogygia/content/vite';
import { ogygia } from 'ogygia/vite';
import { defineConfig } from 'vite';
import { ink } from './src/lib/ink-theme.ts';
import { rehypeQuiet } from './src/lib/rehype-quiet.ts';

export default defineConfig({
	plugins: [
		// plain page loads: every page is prerendered html, and hover prefetch (speculation rules in
		// +layout.svelte) makes them instant. the in-place router swapped pages before their own css
		// arrived, which flashed unstyled content mid-fade.
		ogygia({ router: false }),
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
