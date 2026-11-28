import { sveltekit } from '@sveltejs/kit/vite';
import { content } from '@ogygia/content/vite';
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
