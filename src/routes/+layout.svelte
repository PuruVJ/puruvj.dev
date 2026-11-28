<script lang="ts">
	import '#lib/styles/app.css';
	import '#lib/styles/flourish.css';
	import '#lib/styles/paint.css';
	import { theme, theme_toggle, js_flag, paint_lab } from '#lib/site.ts';
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
</svelte:head>

{@render children()}
