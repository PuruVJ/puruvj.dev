<script lang="ts">
	import { hills, sky, CYCLE, STILL, VW, VH } from './mountain.ts';

	const drawn = hills();
	const s0 = sky(STILL);

	/** the sky loop lives outside reactivity: it writes straight to the svg, never to $state */
	function sky_loop(svg: SVGSVGElement) {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const block = svg.closest<HTMLElement>('.b');
		const sun = svg.querySelector<SVGGElement>('.sun')!;
		const moon = svg.querySelector<SVGGElement>('.moon')!;
		const t0 = performance.now() - STILL * CYCLE;
		let raf = requestAnimationFrame(function frame(now) {
			const k = sky(((now - t0) % CYCLE) / CYCLE);
			const on = k.day ? sun : moon;
			sun.style.display = k.day ? '' : 'none';
			moon.style.display = k.day ? 'none' : '';
			on.setAttribute('transform', `translate(${k.x.toFixed(2)} ${k.y.toFixed(2)})`);
			block?.style.setProperty('--n', k.night.toFixed(3));
			raf = requestAnimationFrame(frame);
		});
		return () => cancelAnimationFrame(raf);
	}
</script>

<div class="mtn" aria-hidden="true">
	<svg viewBox="0 0 {VW} {VH}" preserveAspectRatio="xMaxYMax meet" {@attach sky_loop}>
		<defs>
			<mask id="moon-cut" maskContentUnits="userSpaceOnUse" x="-20" y="-20" width="40" height="40">
				<circle r="12" fill="#fff" />
				<circle cx="5.5" cy="-3.5" r="10.5" fill="#000" />
			</mask>
		</defs>
		<!-- the sun and moon are drawn first, so they set behind the ridges -->
		<g class="sun" transform="translate({s0.x.toFixed(2)} {s0.y.toFixed(2)})" style:display={s0.day ? null : 'none'}>
			<circle r="15" />
		</g>
		<g class="moon" transform="translate({s0.x.toFixed(2)} {s0.y.toFixed(2)})" style:display={s0.day ? 'none' : null}>
			<circle r="12" mask="url(#moon-cut)" />
		</g>
		{@html drawn}
	</svg>
</div>

<style>
	/* flat greys. at night (--n, set on the block by the loop) every sheet sinks toward --m-dusk */
	.mtn {
		--m-back: #e8e6e0;
		--m-lit: #dcd9d2;
		--m-shade: #cbc8c0;
		--m-snow: #fbfaf7;
		--m-sun: #d6d3cb;
		--m-moon: #a9a79f;
		--m-dusk: #8f8d86;
		--m-k: 26%;
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
			--m-back: #1a1a19;
			--m-lit: #262624;
			--m-shade: #1f1f1e;
			--m-snow: #6f6e69;
			--m-sun: #3a3a37;
			--m-moon: #d6d4cc;
			--m-dusk: #000;
			--m-k: 18%;
		}
	}
	:global(:root[data-pref-theme='dark']) .mtn {
		--m-back: #1a1a19;
		--m-lit: #262624;
		--m-shade: #1f1f1e;
		--m-snow: #6f6e69;
		--m-sun: #3a3a37;
		--m-moon: #d6d4cc;
		--m-dusk: #000;
		--m-k: 18%;
	}
	svg {
		width: 100%;
		height: 100%;
		display: block;
		/* the back range runs on past the left edge of the drawing; the block clips it */
		overflow: visible;
		--dusk: calc(var(--n, 0) * var(--m-k));
	}
	.sun circle {
		fill: var(--m-sun);
	}
	.moon circle {
		fill: var(--m-moon);
	}
	.mtn :global(.m-back) {
		fill: color-mix(in oklab, var(--m-back), var(--m-dusk) var(--dusk));
	}
	.mtn :global(.m-lit) {
		fill: color-mix(in oklab, var(--m-lit), var(--m-dusk) var(--dusk));
	}
	.mtn :global(.m-shade) {
		fill: color-mix(in oklab, var(--m-shade), var(--m-dusk) var(--dusk));
	}
	.mtn :global(.m-snow) {
		fill: color-mix(in oklab, var(--m-snow), var(--m-dusk) var(--dusk));
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
