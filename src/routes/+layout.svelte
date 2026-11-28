<script lang="ts">
	import '$lib/styles/app.css';
	import '$lib/styles/flourish.css';
	import '$lib/styles/paint.css';
	import { theme, theme_toggle, js_flag, paint_lab } from '$lib/site.ts';
	// the two faces every page paints first. the same files app.css pulls in, so vite gives them
	// the same hashed url and the preload is the request the css later reuses.
	import sans from '@fontsource-variable/instrument-sans/files/instrument-sans-latin-standard-normal.woff2?url';
	import mono from '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2?url';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="preload" href={sans} as="font" type="font/woff2" crossorigin="anonymous" />
	<link rel="preload" href={mono} as="font" type="font/woff2" crossorigin="anonymous" />
	{@html theme.head()}
	{@html theme_toggle()}
	{@html js_flag()}
	{@html paint_lab()}
	<!-- fetch a page as soon as someone rests on its link (chrome, edge), so the click lands instantly.
	     prefetch, not prerender: the toys and islands of the next page don't start in the background -->
	{@html `<script type="speculationrules">${JSON.stringify({ prefetch: [{ where: { and: [{ href_matches: '/*' }, { not: { href_matches: '/*.:ext(png|xml|txt|md|pdf)' } }] }, eagerness: 'moderate' }] })}</script>`}
</svelte:head>

{@render children()}
