<script lang="ts">
	// the home page's oil-painted mountain, still (no sun, no sky loop): the same strokes and light,
	// hung on /life where the mountains are. plain svg, painted once.
	import { terrain, VW, VH } from '$lib/home/mountain.ts';
	const painting = terrain();
</script>

<div class="oil" aria-hidden="true">
	<svg viewBox="0 0 {VW} {VH}" preserveAspectRatio="xMaxYMax meet">{@html painting}</svg>
</div>

<style>
	/* the same tones as the home page (Mountain.svelte) */
	.oil {
		--oil-back: rgb(228 227 224);
		--oil-lit: rgb(217 216 213);
		--oil-shade: rgb(184 183 180);
		--oil-snow: rgb(250 249 246);
		--oil-sheen: #fff;
		position: relative;
		width: 100%;
		aspect-ratio: 400 / 300;
		pointer-events: none;
	}
	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-pref-theme='light'])) .oil {
			--oil-back: rgb(29 28 25);
			--oil-lit: rgb(50 49 46);
			--oil-shade: rgb(33 32 29);
			--oil-snow: rgb(111 110 107);
			--oil-sheen: #555;
		}
	}
	:global(:root[data-pref-theme='dark']) .oil {
		--oil-back: rgb(29 28 25);
		--oil-lit: rgb(50 49 46);
		--oil-shade: rgb(33 32 29);
		--oil-snow: rgb(111 110 107);
		--oil-sheen: #555;
	}
	svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
		overflow: visible;
	}
	.oil :global(.tone-back) {
		flood-color: var(--oil-back);
	}
	.oil :global(.tone-lit) {
		flood-color: var(--oil-lit);
	}
	.oil :global(.tone-shade) {
		flood-color: var(--oil-shade);
	}
	.oil :global(.tone-snow) {
		flood-color: var(--oil-snow);
	}
	.oil :global(.sheen) {
		lighting-color: var(--oil-sheen);
	}
</style>
