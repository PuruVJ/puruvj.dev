import { vitePreprocess } from '@astrojs/svelte';

export default {
	preprocess: vitePreprocess(),
	compilerOptions: {
		cssHash: ({ css, hash }) => `s-${hash(css)}`,
	},
};
