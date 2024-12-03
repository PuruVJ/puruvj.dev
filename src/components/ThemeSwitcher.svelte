<script lang="ts">
	import { mdiMoonFull, mdiWhiteBalanceSunny } from '@mdi/js';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import Icon from './Icon.svelte';
	import Moon from './Moon.svelte';
	import RadioactiveSvg from './RadioactiveSVG.svelte';

	type Theme = 'light' | 'midday' | 'dark' | 'radioactive';

	const theme = writable<Theme>('light');

	let init = $state(false);

	// List of themes
	const themes: Theme[] = ['light', 'midday', 'dark', 'radioactive'];
	let current_theme_index = $state(0);

	function nextTheme(currentThemeIndex: number) {
		const { length } = themes;

		return (currentThemeIndex + 1) % length;
	}

	onMount(() => {
		// Initialize with localstorage
		const local_theme = localStorage.getItem('theme');
		const browser_prefers_dark = window.matchMedia('(prefers-color-scheme: dark)').matches;

		current_theme_index = !local_theme
			? browser_prefers_dark
				? 2
				: 0
			: themes.indexOf(local_theme as any);
	});

	// @ts-ignore
	const dev = import.meta.env.DEV;

	$effect(() => {
		$theme = themes[current_theme_index];
	});

	$effect(() => {
		// @ts-ignore
		if (import.meta.env.SSR) return;

		if (!init) {
			init = true;
			return;
		}

		themes.forEach((theme) => {
			document.body.classList.remove(theme);
		});
		document.body.classList.add($theme);

		localStorage.setItem('theme', $theme);
	});
</script>

<svelte:head>
	<meta
		name="theme-color"
		content={['white', '#f9dec9', '#222428', '#13132a'][current_theme_index]}
	/>

	<link rel="icon" href="/icons/favicon-{dev ? 'dev' : $theme}.{dev ? 'svg' : 'png'}" />
</svelte:head>

<button
	onclick={() => (current_theme_index = nextTheme(current_theme_index))}
	aria-label={themes[current_theme_index]}
>
	{#if current_theme_index === 0}
		<Icon path={mdiWhiteBalanceSunny} />
	{:else if current_theme_index === 1}
		<Icon path={mdiMoonFull} />
	{:else if current_theme_index === 2}
		<Moon />
	{:else}
		<RadioactiveSvg />
	{/if}
</button>

<style>
	button {
		width: 2.3rem;
		height: 2.3rem;

		fill: var(--app-color-dark);

		border-radius: 50%;
	}

	button:hover,
	button:focus {
		background-color: rgba(var(--app-color-dark-rgb), 0.2);
	}
</style>
