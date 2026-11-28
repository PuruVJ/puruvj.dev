import { sveltekit } from '@sveltejs/kit/vite';
import { content } from '@ogygia/content/vite';
import { image } from '@ogygia/image/vite';
import { ogygia } from 'ogygia/vite';
import { defineConfig, type Plugin } from 'vite';
import { ink } from './src/lib/ink-theme.ts';
import { rehypeQuiet } from './src/lib/rehype-quiet.ts';

/** rapier ships its physics as a .wasm file that its glue code imports as an ES module, which the
 *  browser can't do yet. this swaps that one import for a streamed fetch of the hashed .wasm asset,
 *  so it compiles while it downloads and never lands in a JS chunk. */
function rapier_wasm(): Plugin {
	return {
		name: 'rapier-wasm',
		enforce: 'pre',
		load(id) {
			if (!/@dimforge[\\/]rapier3d[\\/]rapier_wasm3d\.js$/.test(id.split('?')[0])) return;
			return `import url from './rapier_wasm3d_bg.wasm?url';
import * as bg from './rapier_wasm3d_bg.js';
export * from './rapier_wasm3d_bg.js';
const imports = { './rapier_wasm3d_bg.js': bg };
const load = async () => {
	try {
		return await WebAssembly.instantiateStreaming(fetch(url), imports);
	} catch {
		return WebAssembly.instantiate(await (await fetch(url)).arrayBuffer(), imports);
	}
};
bg.__wbg_set_wasm((await load()).instance.exports);`;
		},
	};
}

export default defineConfig({
	optimizeDeps: { exclude: ['@dimforge/rapier3d'] },
	plugins: [
		rapier_wasm(),
		// ogygia's router swaps pages in place, with a view transition
		ogygia(),
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
