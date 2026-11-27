<script lang="ts">
	import type { Graph } from './graph.ts';

	let { g }: { g: Graph } = $props();

	/** draw once, the first time the block scrolls into view. css does the drawing. */
	function reveal(svg: SVGSVGElement) {
		const io = new IntersectionObserver(
			(es) => {
				if (!es.some((e) => e.isIntersecting)) return;
				svg.classList.add('in');
				io.disconnect();
			},
			{ threshold: 0.35 },
		);
		io.observe(svg);
		return () => io.disconnect();
	}
</script>

<svg class="graph" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true" {@attach reveal}>
	<path class="area" d={g.area} />
	<path class="line" d={g.line} vector-effect="non-scaling-stroke" />
</svg>

<style>
	/* the history behind a number: muted ink, fading in from the left, never louder than the number */
	.graph {
		position: absolute;
		right: 0;
		bottom: 0;
		width: 64%;
		height: 72%;
		z-index: 0;
		pointer-events: none;
		overflow: visible;
		color: var(--ink-3);
		mask-image: linear-gradient(to right, rgb(0 0 0 / 0.5), #000);
	}
	.area {
		fill: currentColor;
		opacity: 0.1;
	}
	.line {
		fill: none;
		stroke: currentColor;
		stroke-width: 1px;
		stroke-linejoin: round;
	}
	/* with js and motion allowed, hold the drawing back until it scrolls in, then draw it left to
	   right and lay the fill in after. without either, it is simply there. */
	@media (prefers-reduced-motion: no-preference) {
		:global(:root.js) .graph:not(:global(.in)) path {
			clip-path: inset(0 100% 0 0);
		}
		:global(.graph.in) .line {
			animation: draw 1.4s cubic-bezier(0.65, 0, 0.35, 1) both;
		}
		:global(.graph.in) .area {
			animation: draw 1.2s 0.45s cubic-bezier(0.65, 0, 0.35, 1) both;
		}
	}
	@keyframes draw {
		from {
			clip-path: inset(0 100% 0 0);
		}
		to {
			clip-path: inset(0 0 0 0);
		}
	}
</style>
