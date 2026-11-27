<script lang="ts">
	import '$lib/styles/app.css';
	import { theme, theme_toggle } from '$lib/site.ts';

	let { children } = $props();
</script>

<svelte:head>
	{@html theme.head()}
	{@html theme_toggle()}
</svelte:head>

{@render children()}
