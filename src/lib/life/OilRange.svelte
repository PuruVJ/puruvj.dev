<script lang="ts">
	// a wide himalayan range in the home page's thick oil (range.ts): the same strokes and light,
	// its own peaks. plain svg, painted once on the server.
	import { range, GROUND, RW, RH } from './range.ts';
	const painting = range();
</script>

<div class="oil" aria-hidden="true">
	<svg viewBox="0 0 {RW} {RH}" preserveAspectRatio="xMidYMax slice"><path class="ground" d={GROUND} />{@html painting}</svg>
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
		aspect-ratio: 1200 / 300;
		pointer-events: none;
	}
	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-pref-theme='light'], [data-pref-theme='sunrise'])) .oil {
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
	/* the two hours, as on the home page: orange light on a blue range, red light on a wine one */
	:global(:root[data-pref-theme='sunrise']) .oil {
		--oil-back: rgb(212 218 227);
		--oil-lit: rgb(234 208 188);
		--oil-shade: rgb(162 172 188);
		--oil-snow: rgb(253 238 222);
		--oil-sheen: #fff3e4;
	}
	:global(:root[data-pref-theme='sunset']) .oil {
		--oil-back: rgb(46 26 29);
		--oil-lit: rgb(112 47 39);
		--oil-shade: rgb(39 22 27);
		--oil-snow: rgb(198 112 92);
		--oil-sheen: #b0604f;
	}
	.ground {
		fill: var(--paper);
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
