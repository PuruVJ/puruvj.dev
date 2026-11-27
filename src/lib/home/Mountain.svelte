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
		--m-back: #e4e2dc;
		--m-lit: #d1cec6;
		--m-shade: #b3b0a8;
		--m-snow: #fbfaf7;
		--m-sun: #d3d0c8;
		--m-moon: #a3a199;
		--m-dusk: #8f8d86;
		--m-k: 26%;
		position: absolute;
		right: 0;
		bottom: 0;
		width: 60%;
		height: 90%;
		z-index: 0;
		pointer-events: none;
	}
	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-pref-theme='light'])) .mtn {
			--m-back: #1d1d1c;
			--m-lit: #2e2e2b;
			--m-shade: #232321;
			--m-snow: #8b8a84;
			--m-sun: #3a3a37;
			--m-moon: #d6d4cc;
			--m-dusk: #000;
			--m-k: 18%;
		}
	}
	:global(:root[data-pref-theme='dark']) .mtn {
		--m-back: #1d1d1c;
		--m-lit: #2e2e2b;
		--m-shade: #232321;
		--m-snow: #8b8a84;
		--m-sun: #3a3a37;
		--m-moon: #d6d4cc;
		--m-dusk: #000;
		--m-k: 18%;
	}
	svg {
		width: 100%;
		height: 100%;
		display: block;
		overflow: hidden;
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
			height: 210px;
		}
	}
</style>
