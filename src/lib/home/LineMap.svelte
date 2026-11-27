<script lang="ts">
	import { draw, rule_k, ym, type Station } from './map.ts';

	let { stations }: { stations: Station[] } = $props();

	// the server's first guess at the block's size; the island redraws at the real one
	let W = $state(600);
	let H = $state(720);
	let hover = $state<number | null>(null);

	const svg = $derived(draw(stations, W, H));
	// the mic stands on the 2024 rule. css works out the height, so it never jumps when the island
	// measures the block or the fonts arrive
	const micK = $derived(rule_k(stations, 2024));
	const cap = $derived(hover === null ? null : stations[hover]);

	/** redraw at the block's real size whenever it changes */
	function measure(box: HTMLElement) {
		const ro = new ResizeObserver(() => {
			W = box.clientWidth;
			H = box.clientHeight;
		});
		ro.observe(box);
		return () => ro.disconnect();
	}

	function over(e: Event) {
		const g = (e.target as Element).closest?.('.st') as HTMLElement | null;
		hover = g ? Number(g.dataset.i) : null;
	}
	function go(e: Event) {
		const g = (e.target as Element).closest?.('.st') as HTMLElement | null;
		const href = g && stations[Number(g.dataset.i)]?.href;
		if (href) location.href = href;
	}
</script>

<div
	class="map"
	{@attach measure}
	onpointerover={over}
	onpointerleave={() => (hover = null)}
	onclick={go}
	role="presentation"
>
	{@html svg}
	<i class="clay mic" aria-hidden="true" style="top: calc(6px + {micK.toFixed(5)} * (100% - 70px) - 94px)"></i>
</div>
<div class="cap" aria-live="polite">
	{#if cap}
		<b>{ym(cap.date)}</b>&nbsp;&nbsp;{cap.title.toLowerCase()}
	{:else}
		<b>{stations.length} stops</b>&nbsp;&nbsp;<span class="hint-fine">hover</span><span class="hint-touch">tap</span> one to read it
	{/if}
</div>

<style>
	.hint-touch {
		display: none;
	}
	@media (hover: none) {
		.hint-fine {
			display: none;
		}
		.hint-touch {
			display: inline;
		}
	}
	.map {
		flex: 1;
		min-height: 0;
		position: relative;
		margin-top: 28px;
		color: var(--ink);
	}
	.map :global(svg) {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
	}
	.mic {
		right: 6%;
	}
	@media (max-width: 760px) {
		.mic {
			display: none;
		}
	}
	.cap {
		margin-top: 18px;
		font-family: var(--mono);
		font-size: 11px;
		color: var(--ink-3);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		min-height: 1.4em;
	}
	.cap b {
		font-weight: 500;
		color: var(--ink);
	}
	.map :global(.st) {
		cursor: pointer;
	}
	.map :global(.st:hover .mark) {
		stroke-width: 2.4;
	}
	.map :global(.lbl) {
		font-family: var(--mono);
		font-size: 11px;
		fill: var(--ink);
	}
	.map :global(.lbl-d),
	.map :global(.yr),
	.map :global(.ln-name) {
		font-family: var(--mono);
		font-size: 10.5px;
		fill: var(--ink-3);
	}
</style>
