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
		prerender: {
			origin: 'https://puruvj.dev',
			entries: ['*', '/404'],
		},
	},
};

export default config;
