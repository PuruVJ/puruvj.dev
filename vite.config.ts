import { sveltekit } from '@sveltejs/kit/vite';
import { content } from '@ogygia/content/vite';
import { image } from '@ogygia/image/vite';
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
		// every page is prerendered, so the build makes each image file once, as a static file.
		// a post's images are as wide as the reading column (40em of 18px), never wider. a gif becomes
		// an animated webp; at quality 65 it is ~40% lighter than at 80, and the memes are grainy anyway.
		image({
			presets: { motion: { width: 720, quality: 65 } },
			markdown: { width: 720, animated: 'motion' },
		}),
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
