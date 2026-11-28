<script lang="ts">
	import { draw, rule_k, ym, type Station } from './map.ts';

	let { stations }: { stations: Station[] } = $props();

	// the server's first guess at the block's size; the island redraws at the real one
	let W = $state(600);
	let H = $state(720);
	/** the stop being pointed at or focused */
	let on = $state<number | null>(null);
	/** it got there from the keyboard, so it wears a stronger ring */
	let kb = $state(false);
	/** the one stop in the tab order; the arrow keys move it */
	let cur = $state(0);
	let touch = $state(false);
	let box: HTMLElement;

	const drawn = $derived(draw(stations, W, H));
	// the mic stands on the 2024 rule. css works out the height, so it never jumps when the island
	// measures the block or the fonts arrive
	const micK = $derived(rule_k(stations, 2024));
	const at = $derived(on === null ? null : stations[on]);
	const spot = $derived(on === null ? null : drawn.spots[on]);
	const left = $derived(!!spot && spot.b > W * 0.55);
	const KIND = { post: 'writing', work: 'project', talk: 'talk', podcast: 'podcast' } as const;

	/** redraw at the block's real size whenever it changes */
	function measure(el: HTMLElement) {
		box = el;
		const ro = new ResizeObserver(() => {
			W = el.clientWidth;
			H = el.clientHeight;
			// the first real-size drawing lands on the next frame; only then does the map show
			if (!el.classList.contains('ready')) requestAnimationFrame(() => el.classList.add('ready'));
		});
		ro.observe(el);
		return () => ro.disconnect();
	}

	/** the stop nearest a point, within r px of its mark: the marks are small, the targets aren't */
	function near(e: MouseEvent, r: number) {
		const lb = (e.target as Element).closest?.('.lb') as HTMLElement | null;
		if (lb) return Number(lb.dataset.i);
		const b = box.getBoundingClientRect();
		const x = e.clientX - b.left;
		const y = e.clientY - b.top;
		let best: number | null = null;
		let bd = r;
		drawn.spots.forEach((p, i) => {
			const dx = x < p.a ? p.a - x : x > p.b ? x - p.b : 0;
			const d = Math.hypot(dx, y - p.y);
			if (d <= bd) (bd = d), (best = i);
		});
		return best;
	}
	function over(e: PointerEvent) {
		if (e.pointerType === 'touch') return;
		const i = near(e, 16);
		box.style.cursor = i === null ? '' : 'pointer';
		if (kb && i === null) return;
		kb = false;
		on = i;
	}
	function go(e: MouseEvent) {
		const i = near(e, touch ? 22 : 16);
		if (i === null) return void (on = null);
		// on a touch screen the first tap shows what the stop is; the second one opens it
		if (touch && on !== i) return void ((on = i), (kb = false));
		open(i);
	}
	function open(i: number) {
		const href = stations[i]?.href;
		if (href) location.href = href;
	}

	const stop = (el: EventTarget | null) => (el as Element | null)?.closest?.('.st') as HTMLElement | null;
	function focus(e: FocusEvent) {
		const g = stop(e.target);
		// a click can focus a stop too; only the keyboard's focus counts here
		if (!g || !g.matches(':focus-visible')) return;
		cur = on = Number(g.dataset.i);
		kb = true;
	}
	function blur(e: FocusEvent) {
		if (stop(e.relatedTarget)) return;
		if (kb) (on = null), (kb = false);
	}
	function key(e: KeyboardEvent) {
		const g = stop(e.target);
		if (!g) return;
		const i = Number(g.dataset.i);
		const n = stations.length;
		const to = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: n - 1 }[e.key];
		if (to !== undefined) {
			e.preventDefault();
			cur = Math.max(0, Math.min(n - 1, to));
			box.querySelector<SVGElement>(`.st[data-i="${cur}"]`)?.focus();
		} else if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			open(i);
		} else if (e.key === 'Escape') {
			on = null;
		}
	}

	// keep exactly one stop in the tab order, across redraws. a redraw replaces the drawing, so a
	// focused stop is focused again in the new one
	let had = false;
	$effect.pre(() => {
		void drawn;
		had = !!stop(document.activeElement) && !!box?.contains(document.activeElement);
	});
	$effect(() => {
		void drawn;
		box?.querySelector('.st[tabindex="0"]')?.setAttribute('tabindex', '-1');
		const g = box?.querySelector<SVGElement>(`.st[data-i="${cur}"]`);
		g?.setAttribute('tabindex', '0');
		if (had && !box.contains(document.activeElement)) g?.focus({ preventScroll: true });
	});
	// the stop in hand and its lines stay inked; everything else steps back
	$effect(() => {
		void drawn;
		const svg = box?.querySelector('svg');
		if (!svg) return;
		svg.classList.toggle('lit', on !== null);
		const ln = on === null ? [] : stations[on].lines;
		for (const el of svg.querySelectorAll<SVGElement>('.ln, .st, .lb')) {
			const hot =
				on !== null &&
				(el.classList.contains('ln')
					? ln.includes(el.dataset.ln!)
					: Number(el.dataset.i) === on || (el.classList.contains('st') && el.dataset.ln!.split(' ').some((l) => ln.includes(l))));
			el.classList.toggle('hot', hot);
			el.classList.toggle('me', el.classList.contains('st') && Number(el.dataset.i) === on);
		}
	});
</script>

<div
	class="map"
	{@attach measure}
	onpointermove={over}
	onpointerdown={(e) => (touch = e.pointerType === 'touch')}
	onpointerleave={(e) => e.pointerType !== 'touch' && !kb && (on = null)}
	onclick={go}
	onfocusin={focus}
	onfocusout={blur}
	onkeydown={key}
	role="presentation"
>
	{@html drawn.svg}
	{#if spot}
		<svg class="ring" class:kb width={W} height={H} aria-hidden="true">
			<rect x={spot.a - 8} y={spot.y - 8} width={spot.b - spot.a + 16} height="16" rx="8" />
		</svg>
	{/if}
	<i class="clay mic" aria-hidden="true" style="top: calc(6px + {micK.toFixed(5)} * (100% - 70px) - 94px)"></i>
	{#if spot && at}
		<div class="tip" class:left style="left: {left ? spot.a - 6 : spot.b + 6}px; top: {spot.y}px" role="status">
			<span class="k">{KIND[at.kind]} · {ym(at.date)}</span>
			<b>{at.title.toLowerCase()}</b>
			{#if at.href}<span class="go">{touch ? 'tap again to open' : kb ? 'enter to open' : 'click to open'} →</span>{/if}
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
	.map :global(.st:focus) {
		outline: none;
	}
	/* a stop in hand: its lines and stops keep their ink, the rest of the map steps back */
	.map :global(svg.lit .ln:not(.hot)),
	.map :global(svg.lit .st:not(.hot)),
	.map :global(svg.lit .lb:not(.hot)) {
		opacity: 0.18;
	}
	@media (prefers-reduced-motion: no-preference) {
		.map :global(.ln),
		.map :global(.st),
		.map :global(.lb) {
			transition: opacity 0.15s ease;
		}
	}
	.map :global(.st.me .mark) {
		stroke-width: 2.5;
	}
	/* the ring round the stop in hand; a stronger one when the keyboard brought it there */
	.ring {
		position: absolute;
		inset: 0;
		overflow: visible;
		pointer-events: none;
		fill: none;
		stroke: var(--ink);
		stroke-width: 1.25;
	}
	.ring.kb {
		stroke-width: 2;
	}
	/* labels sit on a little paper, so no line ever runs through a word */
	.map :global(text) {
		paint-order: stroke;
		stroke: var(--paper);
		stroke-width: 3px;
		stroke-linejoin: round;
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
	/* svg text keeps its ink fill when selected, so the site's solid ink highlight would hide it:
	   the map's labels get a light highlight instead */
	.map :global(text::selection),
	.map :global(tspan::selection) {
		background: color-mix(in srgb, var(--ink) 18%, transparent);
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
