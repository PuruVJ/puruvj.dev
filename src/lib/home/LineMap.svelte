<script lang="ts">
	import { draw, rule_k, ym, type Station } from './map.ts';

	let { stations }: { stations: Station[] } = $props();

	// the server's first guess at the block's size; the island redraws at the real one
	let W = $state(600);
	let H = $state(720);
	/** the stop being pointed at, and where its tooltip sits (px inside the map) */
	let tip = $state<{ i: number; x: number; y: number; left: boolean } | null>(null);
	let touch = $state(false);

	const svg = $derived(draw(stations, W, H));
	// the mic stands on the 2024 rule. css works out the height, so it never jumps when the island
	// measures the block or the fonts arrive
	const micK = $derived(rule_k(stations, 2024));
	const at = $derived(tip ? stations[tip.i] : null);
	const KIND = { post: 'writing', work: 'project', talk: 'talk', podcast: 'podcast' } as const;

	/** redraw at the block's real size whenever it changes */
	function measure(box: HTMLElement) {
		const ro = new ResizeObserver(() => {
			W = box.clientWidth;
			H = box.clientHeight;
			// the first real-size drawing lands on the next frame; only then does the map show
			if (!box.classList.contains('ready')) requestAnimationFrame(() => box.classList.add('ready'));
		});
		ro.observe(box);
		return () => ro.disconnect();
	}

	function place(g: HTMLElement) {
		const box = g.closest('.map')!.getBoundingClientRect();
		const r = g.getBoundingClientRect();
		const right = r.right - box.left;
		const left = right > box.width * 0.55;
		tip = { i: Number(g.dataset.i), x: left ? r.left - box.left : right, y: r.top - box.top + r.height / 2, left };
	}
	function over(e: PointerEvent) {
		if (e.pointerType === 'touch') return;
		const g = (e.target as Element).closest?.('.st') as HTMLElement | null;
		if (g) place(g);
		else tip = null;
	}
	function go(e: MouseEvent) {
		const g = (e.target as Element).closest?.('.st') as HTMLElement | null;
		if (!g) return void (tip = null);
		const i = Number(g.dataset.i);
		// on a touch screen the first tap shows what the stop is; the second one opens it
		if (touch && tip?.i !== i) return place(g);
		const href = stations[i]?.href;
		if (href) location.href = href;
	}
</script>

<div
	class="map"
	{@attach measure}
	onpointerover={over}
	onpointerdown={(e) => (touch = e.pointerType === 'touch')}
	onpointerleave={(e) => e.pointerType !== 'touch' && (tip = null)}
	onclick={go}
	role="presentation"
>
	{@html svg}
	<i class="clay mic" aria-hidden="true" style="top: calc(6px + {micK.toFixed(5)} * (100% - 70px) - 94px)"></i>
	{#if tip && at}
		<div class="tip" class:left={tip.left} style="left: {tip.x}px; top: {tip.y}px" role="status">
			<span class="k">{KIND[at.kind]} · {ym(at.date)}</span>
			<b>{at.title.toLowerCase()}</b>
			{#if at.href}<span class="go">{touch ? 'tap again to open' : 'click to open'} →</span>{/if}
		</div>
	{/if}
</div>


<style>
	.map {
		flex: 1;
		min-height: 0;
		position: relative;
		margin-top: 28px;
		color: var(--ink);
	}
	/* the server can only guess the block's size, so with js the map stays hidden until the island
	   has drawn it at the real size, then fades in. without js the guess is shown as is. */
	:global(:root.js) .map:not(:global(.ready)) :global(svg) {
		opacity: 0;
	}
	@media (prefers-reduced-motion: no-preference) {
		.map :global(svg) {
			transition: opacity 0.35s ease;
		}
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
	.map :global(.st) {
		cursor: pointer;
	}
	/* the tooltip: a small paper card beside the stop, pointing at it */
	.tip {
		position: absolute;
		z-index: 4;
		transform: translate(12px, -50%);
		display: flex;
		flex-direction: column;
		gap: 3px;
		max-width: 230px;
		padding: 8px 11px 9px;
		background: var(--paper);
		border: 1px solid var(--ink);
		box-shadow: 3px 3px 0 var(--ink);
		pointer-events: none;
		font-size: 13px;
		line-height: 1.25;
	}
	.tip.left {
		transform: translate(calc(-100% - 12px), -50%);
	}
	.tip .k,
	.tip .go {
		font-family: var(--mono);
		font-size: 10.5px;
		color: var(--ink-3);
	}
	.tip b {
		font-weight: 500;
		letter-spacing: -0.01em;
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
