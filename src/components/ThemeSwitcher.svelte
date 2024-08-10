<script lang="ts">
	import { mdiMoonFull, mdiWhiteBalanceSunny } from '@mdi/js';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import Icon from './Icon.svelte';
	import Moon from './Moon.svelte';
	import RadioactiveSvg from './RadioactiveSVG.svelte';

	type Theme = 'light' | 'midday' | 'dark' | 'radioactive';

	export let initialTheme: Theme | undefined;

	const theme = writable<Theme>('light');

	let init = false;
	$: {
		// @ts-ignore
		if (import.meta.env.SSR) break $;

		if (!init) {
			init = true;
			break $;
		}

		themes.forEach((theme) => {
			document.body.classList.remove(theme);
		});
		document.body.classList.add($theme);

		localStorage.setItem('theme', $theme);
	}

	// List of themes
	const themes: Theme[] = ['light', 'midday', 'dark', 'radioactive'];
	let currentThemeIndex = initialTheme ? themes.indexOf(initialTheme) : 0;

	function nextTheme(currentThemeIndex: number) {
		const { length } = themes;

		return (currentThemeIndex + 1) % length;
	}

	onMount(() => {
		// Initialize with localstorage
		const browserPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

		currentThemeIndex = initialTheme ? themes.indexOf(initialTheme) : browserPrefersDark ? 2 : 0;
	});

	$: $theme = themes[currentThemeIndex];
</script>

<svelte:head>
	<meta
		name="theme-color"
		content={['white', '#f9dec9', '#222428', '#13132a'][currentThemeIndex]}
	/>
</svelte:head>

<button
	on:click={() => (currentThemeIndex = nextTheme(currentThemeIndex))}
	aria-label={themes[currentThemeIndex]}
>
	{#if currentThemeIndex === 0}
		<Icon path={mdiWhiteBalanceSunny} />
	{:else if currentThemeIndex === 1}
		<Icon path={mdiMoonFull} />
	{:else if currentThemeIndex === 2}
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
