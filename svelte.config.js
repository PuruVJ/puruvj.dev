import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { preprocess, extensions } from '@ogygia/content/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: extensions(),
	// style: false: vitePreprocess would otherwise compile `<style lang="scss">` found inside a code fence of a post
	preprocess: [vitePreprocess({ style: false }), ...preprocess()],
	compilerOptions: { experimental: { async: true } },
	kit: {
		adapter: adapter(),
		// absolute asset urls: 404.html is served at every missing address, however deep, and
		// relative ones (./_app/...) would point under that address and load nothing
		paths: { relative: false },
		prerender: {
			origin: 'https://puruvj.dev',
			entries: ['*', '/404'],
		},
	},
};

export default config;
