<script lang="ts">
	// the books i grew up on, standing on a shelf in the same 1px line as the rest of the page:
	// harry potter in order, the two epics with their names in hindi, a run of agatha christies,
	// one of them lying across the top. point at a spine and it slides out a little.
	type Book = { t: string; h: number; w: number; band?: number; hi?: boolean; lean?: number };
	const HP: Book[] = [
		["philosopher's stone", 214, 30],
		['chamber of secrets', 218, 34],
		['prisoner of azkaban', 220, 38],
		['goblet of fire', 226, 56],
		['order of the phoenix', 230, 62],
		['half-blood prince', 224, 48],
		['deathly hallows', 228, 52],
	].map(([t, h, w]) => ({ t: t as string, h: h as number, w: w as number, band: 2 }));
	const EPICS: Book[] = [
		{ t: 'महाभारत', h: 236, w: 66, band: 3, hi: true },
		{ t: 'रामायण', h: 208, w: 54, band: 3, hi: true },
	];
	const CHRISTIE: Book[] = [
		{ t: 'agatha christie', h: 178, w: 26, band: 1 },
		{ t: 'agatha christie', h: 182, w: 24, band: 1 },
		{ t: 'agatha christie', h: 176, w: 28, band: 1 },
		{ t: 'agatha christie', h: 180, w: 25, band: 1, lean: -9 },
	];
	const GROUPS = [
		{ name: 'harry potter', books: HP },
		{ name: 'the epics', books: EPICS },
		{ name: 'agatha christie', books: CHRISTIE },
	];
</script>

<figure class="shelf">
	<div class="row">
		{#each GROUPS as g, gi (g.name)}
			<ul class="group" aria-label={g.name}>
				{#each g.books as b, i (i)}
					<li
						class="book"
						class:lean={b.lean}
						style="--h: {b.h}px; --w: {b.w}px; --lean: {b.lean ?? 0}deg"
					>
						<span class="spine">
							{#each Array(b.band ?? 0) as _, k (k)}<span class="band top" style="--k: {k}"></span><span class="band foot" style="--k: {k}"></span>{/each}
							<span class="title" class:hi={b.hi} lang={b.hi ? 'hi' : undefined}>{b.t}</span>
						</span>
					</li>
				{/each}
			</ul>
			{#if gi === 1}
				<!-- one christie lying flat on top of the epics' neighbour, the way shelves really are -->
				<span class="gap" aria-hidden="true"></span>
			{/if}
		{/each}
		<span class="bookend" aria-hidden="true"></span>
	</div>
	<div class="plank" aria-hidden="true"></div>
</figure>

<style>
	.shelf {
		margin: 0;
		position: relative;
	}
	.row {
		display: flex;
		align-items: flex-end;
		gap: 0;
		padding: 0 6px;
		min-height: 250px;
	}
	.group {
		display: flex;
		align-items: flex-end;
		list-style: none;
		margin: 0 14px 0 0;
		padding: 0;
	}
	.gap {
		width: 22px;
	}
	.book {
		height: var(--h);
		width: var(--w);
		margin-right: -1px;
		transform-origin: 0 100%;
		transition: translate 0.25s cubic-bezier(0.3, 0.7, 0.2, 1);
	}
	.book.lean {
		rotate: var(--lean);
		margin-left: 18px;
	}
	.book:hover {
		translate: 0 -10px;
	}
	.spine {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		border: 1px solid var(--ink);
		border-radius: 2px 2px 0 0;
		background: var(--paper);
		overflow: hidden;
	}
	/* the bands printed across the top and bottom of a spine */
	.band {
		position: absolute;
		left: 0;
		right: 0;
		height: 1px;
		background: var(--ink-3);
	}
	.band.top {
		top: calc(14px + var(--k) * 5px);
	}
	.band.foot {
		bottom: calc(14px + var(--k) * 5px);
	}
	.title {
		writing-mode: vertical-rl;
		rotate: 180deg;
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.04em;
		color: var(--ink-2);
		white-space: nowrap;
		overflow: hidden;
		max-height: calc(100% - 50px);
	}
	/* hindi titles run sideways down the spine too, the way they are printed on real books */
	.title.hi {
		font-family: 'Hindi Words', 'Kohinoor Devanagari', 'Noto Serif Devanagari', serif;
		font-size: 21px;
		font-weight: 700;
		letter-spacing: 0;
		color: var(--ink);
	}
	.bookend {
		width: 10px;
		height: 120px;
		margin-left: auto;
		border: 1px solid var(--ink);
		border-bottom: 0;
		border-radius: 3px 3px 0 0;
	}
	.plank {
		height: 9px;
		border-top: 1px solid var(--ink);
		border-bottom: 1px solid var(--ink-2);
		background: linear-gradient(var(--hair), var(--hair)) 0 3px / 100% 1px no-repeat;
	}
	@media (prefers-reduced-motion: reduce) {
		.book {
			transition: none;
		}
	}
	/* a phone: the same shelf, smaller, on one line */
	@media (max-width: 1000px) {
		.shelf {
			zoom: 0.46;
		}
	}
</style>
