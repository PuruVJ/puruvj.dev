<script lang="ts">
	import { hawa_mahal, MOON, STARS, VW, VH } from './hawa-mahal.ts';

	// drawn once, on the server: plain svg, no script
	const d = hawa_mahal();
	const m = MOON;
</script>

<svg class="hawa" viewBox="0 0 {VW} {VH}" fill="none" role="img" aria-labelledby="hawa-t">
	<title id="hawa-t">a line drawing of hawa mahal in jaipur at twilight: a thin five storey screen of small domed bay windows rising to a round crown of domes, shops arched below, the hills behind, a crescent moon</title>
	<defs>
		<mask id="hawa-hide" maskUnits="userSpaceOnUse" x="0" y="0" width={VW} height={VH}>
			<rect width={VW} height={VH} fill="#fff" />
			<path d={d.mask} fill="#000" />
		</mask>
	</defs>
	<!-- the sky: a crescent, and the first stars as small crosses, like the register marks -->
	<path
		class="sky"
		d="M{m.x} {m.y - m.r}A{m.r} {m.r} 0 1 0 {m.x} {m.y + m.r}A{m.r * 1.25} {m.r * 1.25} 0 0 1 {m.x} {m.y - m.r}Z"
	/>
	{#each STARS as [x, y, s] (`${x},${y}`)}
		<path class="star" d="M{x - s} {y}H{x + s}M{x} {y - s}V{y + s}" />
	{/each}
	<path class="hills" d={d.hills} mask="url(#hawa-hide)" />
	<path class="fine" d={d.fine} />
	<path class="main" d={d.main} />
</svg>

<style>
	.hawa {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
		color: var(--ink);
	}
	path {
		vector-effect: non-scaling-stroke;
		stroke-width: 1px;
		stroke-linejoin: round;
		stroke-linecap: round;
	}
	.main {
		stroke: currentColor;
	}
	.fine {
		stroke: var(--ink-2);
		opacity: 0.8;
	}
	.hills {
		stroke: var(--ink-3);
		opacity: 0.7;
	}
	.sky {
		stroke: var(--ink-2);
	}
	.star {
		stroke: var(--ink-3);
	}
</style>
