<script lang="ts">
	import { theme } from '$lib/site.ts';
</script>

<!-- no island: ogygia's preference.switch() handles every [data-pref-set] click on the page -->
<span class="theme" role="group" aria-label="theme">
	{#each theme.values as v (v)}
		<button type="button" data-pref="theme" data-pref-set={v}>{v}</button>
	{/each}
</span>

<style>
	.theme {
		display: inline-flex;
		gap: 10px;
		font-family: var(--mono);
		font-size: 11px;
	}
	button {
		all: unset;
		cursor: pointer;
		color: var(--ink-3);
		letter-spacing: 0.02em;
	}
	button:hover {
		color: var(--ink);
	}
	button:focus-visible {
		outline: 1.5px solid var(--ink);
		outline-offset: 2px;
	}
	:global(:root:not([data-pref-theme])) button[data-pref-set='auto'],
	:global(:root[data-pref-theme='auto']) button[data-pref-set='auto'],
	:global(:root[data-pref-theme='light']) button[data-pref-set='light'],
	:global(:root[data-pref-theme='dark']) button[data-pref-set='dark'] {
		color: var(--ink);
		text-decoration: underline;
		text-underline-offset: 4px;
		text-decoration-thickness: 1px;
	}
</style>
