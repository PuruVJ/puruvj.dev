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
		<g class="sun" transform="translate({s0.x.toFixed(2)} {s0.y.toFixed(2)})" style:display={s0.day ? null : 'none'}>
			<circle r="15" fill="var(--hill-2)" />
		</g>
		<g class="moon" transform="translate({s0.x.toFixed(2)} {s0.y.toFixed(2)})" style:display={s0.day ? 'none' : null}>
			<circle r="12" fill="var(--hill-3)" />
			<circle cx="5.5" cy="-3.5" r="10.5" fill="var(--sky)" />
		</g>
		{@html drawn}
	</svg>
</div>

<style>
	.mtn {
		position: absolute;
		right: 0;
		bottom: 0;
		width: 60%;
		height: 90%;
		z-index: 0;
		pointer-events: none;
	}
	svg {
		width: 100%;
		height: 100%;
		display: block;
		overflow: hidden;
		color: var(--ink);
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
