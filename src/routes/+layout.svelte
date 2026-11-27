<script lang="ts">
	import '$lib/styles/app.css';
	import { preference } from 'ogygia';
	import { theme } from '$lib/site.ts';

	let { children } = $props();
</script>

<svelte:head>
	{@html theme.head()}
	{@html preference.switch()}
</svelte:head>

{@render children()}
