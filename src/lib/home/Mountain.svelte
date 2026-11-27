<script lang="ts">
	import { terrain, body, sky, SILHOUETTE, CYCLE, STILL, VW, VH } from './mountain.ts';

	// painted once on the server. the paint never moves, so it is drawn (rasterised) once per load,
	// resize or theme switch, and never while the sun travels.
	const painting = terrain();
	const sun = body('sun');
	const moon = body('moon');
	const s0 = sky(STILL);

	/**
	 * the sky loop lives outside reactivity: it writes straight to the dom, never to $state.
	 * the sun and moon sit in their own svg, behind the paint, and the loop slides that whole svg with
	 * a css transform. that is compositor work only: the painted filters are never redrawn.
	 */
	function sky_loop(svg: SVGSVGElement) {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const block = svg.closest<HTMLElement>('.b');
		const sunG = svg.querySelector<SVGGElement>('.sun')!;
		const moonG = svg.querySelector<SVGGElement>('.moon')!;
		// px per viewBox unit: 'meet' scales by the tighter of the two sides
		let s = 1;
		const ro = new ResizeObserver(() => (s = Math.min(svg.clientWidth / VW, svg.clientHeight / VH)));
		ro.observe(svg);
		let day = s0.day;
		const t0 = performance.now() - STILL * CYCLE;
		let raf = requestAnimationFrame(function frame(now) {
			const k = sky(((now - t0) % CYCLE) / CYCLE);
			if (k.day !== day) {
				day = k.day;
				sunG.style.display = day ? '' : 'none';
				moonG.style.display = day ? 'none' : '';
			}
			svg.style.transform = `translate(${((k.x - s0.x) * s).toFixed(1)}px, ${((k.y - s0.y) * s).toFixed(1)}px)`;
			block?.style.setProperty('--n', k.night.toFixed(3));
			raf = requestAnimationFrame(frame);
		});
		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
		};
	}
</script>

<div class="mtn" aria-hidden="true">
	<!-- back to front: the sky (sun or moon), the painting, and a veil that dims it all at night -->
	<svg class="sky" viewBox="0 0 {VW} {VH}" preserveAspectRatio="xMaxYMax meet" {@attach sky_loop}>
		<g class="sun" transform="translate({s0.x.toFixed(2)} {s0.y.toFixed(2)})" style:display={s0.day ? null : 'none'}>
			{@html sun}
		</g>
		<g class="moon" transform="translate({s0.x.toFixed(2)} {s0.y.toFixed(2)})" style:display={s0.day ? 'none' : null}>
			{@html moon}
		</g>
	</svg>
	<svg class="paint" viewBox="0 0 {VW} {VH}" preserveAspectRatio="xMaxYMax meet">{@html painting}</svg>
	<svg class="veil" viewBox="0 0 {VW} {VH}" preserveAspectRatio="xMaxYMax meet"><path d={SILHOUETTE} /></svg>
</div>

<style>
	/* paint tones: greys on paper by day, charcoal greys in the dark. each is rgb(v, v-1, v-4). */
	.mtn {
		--oil-back: rgb(228 227 224);
		--oil-lit: rgb(217 216 213);
		--oil-shade: rgb(184 183 180);
		--oil-snow: rgb(250 249 246);
		--oil-sun: rgb(218 217 214);
		--oil-moon: rgb(174 173 170);
		--oil-sheen: #fff;
		--m-dusk: #8f8d86;
		--veil: 0.26;
		position: absolute;
		right: 0;
		bottom: 0;
		width: 100%;
		height: 92%;
		z-index: 0;
		pointer-events: none;
	}
	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-pref-theme='light'])) .mtn {
			--oil-back: rgb(29 28 25);
			--oil-lit: rgb(50 49 46);
			--oil-shade: rgb(33 32 29);
			--oil-snow: rgb(111 110 107);
			--oil-sun: rgb(59 58 55);
			--oil-moon: rgb(201 200 197);
			--oil-sheen: #555;
			--m-dusk: #000;
			--veil: 0.3;
		}
	}
	:global(:root[data-pref-theme='dark']) .mtn {
		--oil-back: rgb(29 28 25);
		--oil-lit: rgb(50 49 46);
		--oil-shade: rgb(33 32 29);
		--oil-snow: rgb(111 110 107);
		--oil-sun: rgb(59 58 55);
		--oil-moon: rgb(201 200 197);
		--oil-sheen: #555;
		--m-dusk: #000;
		--veil: 0.3;
	}
	svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
		/* the back range runs on past the left edge of the drawing; the block clips it */
		overflow: visible;
	}
	.sky {
		will-change: transform;
	}
	/* its own layer, so the sun sliding behind it never asks it to be painted again */
	.paint {
		will-change: transform;
	}
	.mtn :global(.tone-back) {
		flood-color: var(--oil-back);
	}
	.mtn :global(.tone-lit) {
		flood-color: var(--oil-lit);
	}
	.mtn :global(.tone-shade) {
		flood-color: var(--oil-shade);
	}
	.mtn :global(.tone-snow) {
		flood-color: var(--oil-snow);
	}
	.mtn :global(.tone-sun) {
		flood-color: var(--oil-sun);
	}
	.mtn :global(.tone-moon) {
		flood-color: var(--oil-moon);
	}
	.mtn :global(.sheen) {
		lighting-color: var(--oil-sheen);
	}
	/* night falls as a veil over the painting: a css opacity, so it costs no repaint of the paint */
	.veil {
		fill: var(--m-dusk);
		opacity: calc(var(--n, 0) * var(--veil));
		mix-blend-mode: multiply;
	}
	@media (max-width: 760px) {
		/* on a phone the mountain sits above the name, not behind it */
		.mtn {
			top: 48px;
			bottom: auto;
			width: 100%;
			height: 230px;
			/* no hard floor under the hills: their feet melt into the page */
			mask-image: linear-gradient(to bottom, #000 62%, transparent);
		}
	}
</style>
