<script lang="ts">
	import type { ImageDescriptor } from '@ogygia/image';
	import Shell from '$lib/components/Shell.svelte';
	import Soon from '$lib/components/Soon.svelte';
	import Photo from '$lib/life/Photo.svelte';
	import Bookshelf from '$lib/life/Bookshelf.svelte';
	import OilRange from '$lib/life/OilRange.svelte';
	import Pizzas from '$lib/life/Pizzas.svelte' with { wake: 'visible' };
	import HawaMahal from '$lib/life/HawaMahal.svelte';
	import Bridge from '$lib/life/Bridge.svelte';
	import { W, PH, PEAKS, NEXT, TUNNEL, into_mountain, lane, bend, stop, at, climb, pencil, climb_phone, plumb } from '$lib/life/trail.ts';
	import * as L from '$lib/life.ts';

	// the photos. each is a pencilled stand-in until its file is in: to put one in, drop the jpg in
	// src/lib/life/ and swap its null for import.meta.og.image('../../lib/life/<name>.jpg')
	const PHOTOS: Record<string, ImageDescriptor | null> = {
		annecy: import.meta.og.image('../../lib/life/annecy.jpg'),
		kedarkantha: import.meta.og.image('../../lib/life/kedarkantha.jpg'),
		brahmatal: import.meta.og.image('../../lib/life/brahmatal.jpg'),
		'dayara bugyal': import.meta.og.image('../../lib/life/dayara-bugyal.jpg'),
		interlaken: import.meta.og.image('../../lib/life/interlaken.jpg'),
		lucerne: import.meta.og.image('../../lib/life/lucerne.jpg'),
		salzburg: import.meta.og.image('../../lib/life/salzburg.jpg'),
		grindelwald: import.meta.og.image('../../lib/life/grindelwald.jpg'),
		dune: import.meta.og.image('../../lib/life/dune.jpg'),
		me: import.meta.og.image('../../lib/home/puru-film.jpg'),
	};

	// this page is not a grid of blocks: it is one line, a trail, walked from annecy down to the
	// closing question. each stretch of the page has its lane (where the line runs, in twelfths
	// across) and the line bends from one lane to the next in the open space between them.
	const ROUTE = [
		{ id: 'annecy', name: 'annecy' },
		{ id: 'mountains', name: 'the mountains' },
		{ id: 'solo', name: 'europe' },
		{ id: 'cinema', name: 'cinema' },
		{ id: 'zimmer', name: 'hans zimmer' },
		{ id: 'books', name: 'books' },
		{ id: 'building', name: 'building' },
		{ id: 'pizza', name: 'pizza' },
		{ id: 'jaipur', name: 'jaipur' },
	];

	// the treks hang under their summits, so each card is centred on its peak
	const TREK_SHAPE = [
		{ aspect: '4/5', r: -1.6, drop: 10, span: '1 / 5' },
		{ aspect: '1/1', r: 1.2, drop: 120, span: '5 / 8' },
		{ aspect: '3/4', r: -0.8, drop: 54, span: '8 / 11' },
	];
	const SUMMIT = ['12k ft', 'over new year', '+ an oxygen cylinder'];

	// the hostels: three prints dropped on the table, overlapping a little
	const PRINTS = [
		{ name: 'interlaken', r: -2.2, style: 'left: 0%; top: 40px; width: 52%' },
		{ name: 'salzburg', r: -1, style: 'left: 60%; top: 290px; width: 38%' },
		// on top: the chapel sits low in its frame, and must not be hidden under salzburg
		{ name: 'lucerne', r: 1.6, style: 'left: 44%; top: 0; width: 40%' },
	];

	const phone = climb_phone();
	// the annecy ride on a 0 to 50 km rule
	const KM = [0, 10, 20, 30, 40, 50];
</script>

{#snippet hi(k: keyof typeof L.HI)}<span class="hi" lang="hi" title={L.HI[k][1]}>{L.HI[k][0]}</span>{/snippet}

{#snippet path(d: string, cls = 'line')}
	<svg class="trail {cls}" viewBox="0 0 {W} 100" preserveAspectRatio="none" aria-hidden="true"><path {d} /></svg>
{/snippet}

<svelte:head>
	<!-- the hindi words' font, fetched with the page, so they never flash in a fallback face -->
	<link rel="preload" href="/fonts/hindi-words.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
</svelte:head>

<Shell here="/life" title="life · puru vijayvargia" description={`away from the keyboard: ${L.LIFE_LEDE}`} md="/life.md">
	<div class="life">
		<header class="intro">
			<p class="tag">away from the keyboard</p>
			<h1 class="display">life {@render hi('life')}</h1>
			<p class="lede">{L.LIFE_LEDE}</p>
			<figure class="me">
				<div class="print" style="--r: 2.2deg">
					<Photo of={PHOTOS.me} name="me" alt="me, in a dark jacket, smiling, with mountains behind" aspect="1/1" width={320} />
				</div>
			</figure>
			<nav class="route" aria-label="on this page">
				<ol>
					{#each ROUTE as x (x.id)}<li><a class="ln" href="#{x.id}">{x.name}</a></li>{/each}
				</ol>
			</nav>
		</header>

		<div class="walk">
			<!-- the trailhead: the walk starts beside the title -->
			<div class="trailhead" aria-hidden="true">
				{@render path(lane(9))}
				<span class="head" style="left: {at(9)}"></span>
			</div>
			<div class="bend start">{@render path(bend(9, 1))}</div>

			<!-- annecy: the comeback ride -->
			<section class="leg annecy" id="annecy" aria-labelledby="annecy-h">
				{@render path(lane(1))}
				<span class="stop" style={stop(1, 2)} aria-hidden="true"></span>
				<p class="tag at" style="grid-column: 3 / 9">{@render hi('annecy')} annecy, france · oct 2025</p>
				<h2 id="annecy-h" class="km">
					<span class="giant num"><span class="swash" aria-hidden="true"></span>50 km</span>
					<span class="around">around the lake</span>
				</h2>
				<div class="story">
					{#each L.ANNECY as p (p)}<p>{p}</p>{/each}
				</div>
				<div class="ride" role="img" aria-label="the plan was 5 km out and 5 back. the ride was 50 km.">
					<div class="row">
						<span class="k mono">the plan</span>
						<div class="track"><b class="out" style="width: 10%"></b><span class="mono" style="left: 10%">5 out, 5 back</span></div>
					</div>
					<div class="row">
						<span class="k mono">the ride</span>
						<div class="track"><b style="width: 100%"></b></div>
					</div>
					<div class="row axis" aria-hidden="true">
						<span></span>
						<div class="track">
							{#each KM as k (k)}<span class="mono" style="left: {k * 2}%">{k}{k === 50 ? ' km' : ''}</span>{/each}
						</div>
					</div>
				</div>
				<figure class="print lake" style="--r: 1.4deg">
					<Photo of={PHOTOS.annecy} name="annecy" alt="lake annecy" aspect="4/5" width={640} />
					<figcaption class="mono">the lake, all the way round</figcaption>
				</figure>
			</section>

			<div class="bend short">{@render path(lane(1, 0))}</div>

			<!-- the mountains: here the line climbs -->
			<section class="leg mountains" id="mountains" aria-labelledby="mountains-h">
				{@render path(into_mountain())}
				<span class="stop" style={stop(1, 2)} aria-hidden="true"></span>
				<p class="tag at" style="grid-column: 3 / 9">{@render hi('mountains')} dec 2025 – now</p>
				<h2 id="mountains-h" class="big">the mountains</h2>
				<p class="lede note">{L.TREKS_NOTE}</p>
				<div class="range"><OilRange /></div>
				<!-- the trail goes into the mountain and comes out through a tunnel at its foot -->
				<span class="tunnel" style="--tunnel: {TUNNEL}" aria-hidden="true"></span>
			</section>
			<div class="climb" aria-hidden="true">
				<svg class="desk" viewBox="0 0 {W} {PH}" preserveAspectRatio="none">
					<path class="line" d={climb()} />
					<path class="pencil" d={pencil()} />
					{#each PEAKS as p (p.x)}<path class="plumb" d={plumb(p)} />{/each}
				</svg>
				{#each PEAKS as p, i (p.x)}
					<span class="summit mono" style="left: {at(p.x)}; top: {p.top - 24}px">{SUMMIT[i]}</span>
				{/each}
				<span class="summit next mono" style="left: {at(NEXT.x)}; top: {NEXT.top - 24}px">next</span>
				<svg class="phone" viewBox="0 0 {W} {PH}" preserveAspectRatio="none">
					<path class="line" d={phone.solid} />
					<path class="pencil" d={phone.pencil} />
				</svg>
			</div>
			<div class="leg treks">
				{@render path(lane(11.5))}
				{#each L.TREKS as t, i (t.name)}
					{@const s = TREK_SHAPE[i]}
					<article class="trek" style="grid-column: {s.span}; --drop: {s.drop}px">
						<div class="print" style="--r: {s.r}deg">
							<Photo of={PHOTOS[t.name]} name={t.name} alt="{t.name}, {t.when}" aspect={s.aspect} width={560} />
						</div>
						<p class="tag">{t.when} · trek {i + 1}</p>
						<h3>{t.name}</h3>
						<ul class="facts mono">{#each t.facts as x (x)}<li>{x}</li>{/each}</ul>
						<p class="say">{t.text}</p>
					</article>
				{/each}
				<!-- the next one, before it has a name -->
				<article class="trek next" style="grid-column: 10 / 12">
					<p class="tag">trek 4</p>
					<h3><Soon><span class="redact" title="not yet">██████</span></Soon></h3>
					<p class="say">one more, coming.</p>
				</article>
			</div>

			<!-- an hour or two alone, and the garbage bags -->
			<section class="leg alone" aria-label="on every trek">
				{@render path(lane(11.5))}
				<p class="giant hrs num"><span class="swash" aria-hidden="true"></span>1–2 hrs</p>
				<div class="beside">
					<p class="tag">on every trek</p>
					<p class="lede">{L.ALONE}</p>
				</div>
				<div class="bags">
					<p class="tag">back in jaipur</p>
					<p class="mid">garbage bags</p>
					<p class="say">{L.BAGS}</p>
				</div>
			</section>

			<div class="bend wide">{@render path(bend(11.5, 1))}</div>

			<!-- alone, abroad -->
			<section class="leg solo" id="solo" aria-labelledby="solo-h">
				{@render path(lane(1))}
				<span class="stop" style={stop(1, 2)} aria-hidden="true"></span>
				<div class="solo-words">
					<h2 id="solo-h" class="tag at">{@render hi('solo')} solo travel · europe</h2>
					<p class="pull">{L.SOLO}</p>
					<p class="say hostels">
						hostels in {L.CITIES.map((c) => c.name).join(', ').replace(/, ([^,]*)$/, ' and $1')}.
					</p>
					<p class="say pilatus">{L.PILATUS}</p>
				</div>
				<ul class="table">
					{#each PRINTS as p, i (p.name)}
						{@const c = L.CITIES.find((x) => x.name === p.name)!}
						<li class="print" style="{p.style}; --r: {p.r}deg; z-index: {i + 1}">
							<Photo of={PHOTOS[c.name]} name={c.name} alt={c.name} aspect={i === 0 ? '4/5' : '3/4'} width={480} />
							<span class="city"><b>{c.name}</b><span class="mono">{c.country}</span></span>
						</li>
					{/each}
				</ul>
				<figure class="grindel">
					<div class="print" style="--r: 0.8deg">
						<Photo of={PHOTOS.grindelwald} name="grindelwald" alt="a glacier between two dark ridges above grindelwald" aspect="3/4" width={560} />
					</div>
					<figcaption>
						<span class="tag">{L.GRINDELWALD[0]}</span>
						<p class="say">{L.GRINDELWALD[1]}</p>
					</figcaption>
				</figure>
			</section>

			<div class="bend">{@render path(bend(1, 7))}</div>

			<!-- films -->
			<section class="leg cinema" id="cinema" aria-labelledby="cinema-h">
				{@render path(lane(7))}
				<span class="stop" style={stop(7, 5.7)} aria-hidden="true"></span>
				<div class="dune">
					<p class="tag">{@render hi('cinema')} cinema</p>
					<h2 id="cinema-h" class="giant">dune:<br />part two</h2>
					<p class="lede">{L.DUNE}</p>
					<figure class="arrakis">
						<div class="print" style="--r: -1deg">
							<Photo of={PHOTOS.dune} name="dune" alt="paul, seen from behind on a rock, watching an explosion over the desert" aspect="1400/736" width={640} />
						</div>
						<figcaption class="mono">dune: part two (2024) · legendary / warner bros.</figcaption>
					</figure>
				</div>
				<div class="watch">
					<p class="tag">how i watch</p>
					<p class="pull">{L.WATCH_QUOTE}</p>
					<dl>
						{#each L.WATCH as w (w.k)}<div><dt class="mono">{w.k}</dt><dd>{w.v}</dd></div>{/each}
					</dl>
					<ul class="notice">{#each L.NOTICE as x (x)}<li>{x}</li>{/each}</ul>
				</div>
			</section>

			<div class="bend short">{@render path(lane(7, 0))}</div>

			<!-- music -->
			<section class="leg zimmer" id="zimmer" aria-labelledby="zimmer-h">
				{@render path(lane(7))}
				<span class="stop" style={stop(7, 8)} aria-hidden="true"></span>
				<div class="left">
					<span class="ghost num" aria-hidden="true">2018</span>
					<p class="tag">{@render hi('zimmer')} since 2018</p>
					<h2 id="zimmer-h" class="big">hans zimmer</h2>
					<p class="say first">{L.ZIMMER}</p>
					<ol class="tracks">
						{#each L.TRACKS as x (x.t)}
							<li><b>{x.t}</b><span class="mono">{x.f}</span></li>
						{/each}
					</ol>
				</div>
				<p class="pull drive">{L.DRIVE}</p>
			</section>

			<div class="bend">{@render path(bend(7, 11))}</div>

			<!-- books -->
			<section class="leg books" id="books" aria-labelledby="books-h">
				{@render path(lane(11))}
				<span class="stop" style={stop(11, 10)} aria-hidden="true"></span>
				<div class="beside">
					<h2 id="books-h" class="tag">{@render hi('books')} books</h2>
					<p class="say">{L.BOOKS}</p>
				</div>
				<div class="case"><Bookshelf /></div>
			</section>

			<div class="bend short">{@render path(lane(11, 0))}</div>

			<!-- building things -->
			<section class="leg building" id="building" aria-labelledby="building-h">
				{@render path(lane(11))}
				<span class="stop" style={stop(11, 10)} aria-hidden="true"></span>
				<h2 id="building-h" class="tag at r" style="grid-column: 4 / 11">{@render hi('building')} always building · an engineer at heart</h2>
				{#each L.BUILDING as p, i (p)}<p class="say p{i}">{p}</p>{/each}
				<div class="draw"><Bridge /></div>
			</section>

			<div class="bend">{@render path(bend(11, 1))}</div>

			<!-- neapolitan pizza, on a line -->
			<section class="leg pizza" id="pizza" aria-labelledby="pizza-h">
				{@render path(lane(1))}
				<span class="stop" style={stop(1, 2)} aria-hidden="true"></span>
				<div class="pizza-words">
					<h2 id="pizza-h" class="tag at">{@render hi('pizza')} the favourite</h2>
					<p class="pull">{L.PIZZA[0]}</p>
					<p class="say">{L.PIZZA[1]}</p>
				</div>
				<div class="line-up"><Pizzas /></div>
			</section>

			<div class="bend tall dusk-in">{@render path(bend(1, 4.5))}</div>

			<!-- home, at twilight -->
			<section class="leg jaipur" id="jaipur" aria-labelledby="jaipur-h">
				{@render path(lane(4.5))}
				<span class="stop home" style={stop(4.5, 3.6)} aria-hidden="true"></span>
				<div class="words">
					<p class="tag">{@render hi('jaipur')} home · twilight</p>
					<h2 id="jaipur-h" class="giant">jaipur</h2>
					{#each L.HOME as p (p)}<p class="say">{p}</p>{/each}
				</div>
				<figure class="draw">
					<span class="swash" aria-hidden="true"></span>
					<HawaMahal />
					<figcaption class="mono">hawa mahal, jaipur · 26.92° n, 75.83° e</figcaption>
				</figure>
			</section>

			<div class="bend">{@render path(bend(4.5, 1.5))}</div>

			<!-- the last stretch: the line runs on, past the end of the page -->
			<section class="leg scared" id="scared" aria-labelledby="scared-h">
				{@render path(lane(1.5), 'line fade')}
				<span class="stop" style={stop(1.5, 2)} aria-hidden="true"></span>
				<h2 id="scared-h" class="tag at" style="grid-column: 3 / 9">{@render hi('human')} what scares me</h2>
				{#each L.SCARED as p, i (p)}<p class="pull q{i}">{p}</p>{/each}
			</section>
		</div>
	</div>
</Shell>

<style>
	/* ---------- the page: paper that drifts into dusk at the bottom ---------- */
	.life {
		--gut: 56px;
		--trail: var(--ink-2);
		--print: #fbfaf7;
		--shadow: 0 1px 1px rgba(30, 28, 20, 0.06), 0 10px 26px -10px rgba(30, 28, 20, 0.28);
		--swash: #d9d6cd;
		--dusk-hi: #e4e3e1;
		--dusk-lo: #ebe3d8;
		grid-column: 1 / -1;
		position: relative;
		min-width: 0;
		padding: 0 var(--gut);
		/* the tilted prints and the paint may lean past the edge; never a sideways scroll */
		overflow-x: clip;
		/* the dusk is measured from the bottom up, so it always lands on jaipur and the last words */
		background: linear-gradient(
			to top,
			var(--dusk-lo) 0,
			var(--dusk-lo) 320px,
			var(--dusk-hi) 1300px,
			var(--paper) 2300px
		);
	}
	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-pref-theme='light'])) .life {
			--print: #232321;
			--shadow: 0 1px 1px rgba(0, 0, 0, 0.4), 0 12px 28px -10px rgba(0, 0, 0, 0.8);
			--swash: #26251f;
			--dusk-hi: #0a0b0d;
			--dusk-lo: #211c16;
		}
	}
	:global(:root[data-pref-theme='dark']) .life {
		--print: #232321;
		--shadow: 0 1px 1px rgba(0, 0, 0, 0.4), 0 12px 28px -10px rgba(0, 0, 0, 0.8);
		--swash: #26251f;
		--dusk-hi: #0a0b0d;
		--dusk-lo: #211c16;
	}
	[id] {
		scroll-margin-top: calc(var(--top-h) + 24px);
	}

	/* hindi, beside the english: gotu, a clean devanagari with a touch of the pen, cut down to just the words on this page */
	@font-face {
		font-family: 'Hindi Words';
		src: url('/fonts/hindi-words.woff2') format('woff2');
		font-weight: 400;
		/* a short invisible wait, not a flash of the wrong face: the file is preloaded and small */
		font-display: block;
		unicode-range: U+0900-097F, U+200C-200D, U+25CC;
	}
	.hi {
		font-family: 'Hindi Words', 'Kohinoor Devanagari', 'Noto Serif Devanagari', serif;
		font-size: 2em;
		line-height: 1;
		letter-spacing: 0;
		font-weight: 400;
		color: var(--ink-2);
		margin-right: 0.35em;
		vertical-align: -0.12em;
		text-transform: none;
	}
	.display .hi {
		font-size: 0.32em;
		margin: 0 0 0 0.15em;
		vertical-align: 0.15em;
		font-variation-settings: normal;
	}

	/* the dusk doesn't stop at the page's edge: the margins round the sheet, the toy shelf and the
	   footer are in it too. the bottom of the page is all the same evening colour, and the margins
	   carry the same fade as the page, measured from the very bottom of the document (the shelf
	   and footer, about --foot tall, sit below the page's own fade). */
	:global(html:has(.life)) {
		--dusk-hi: #e4e3e1;
		--dusk-lo: #ebe3d8;
		--foot: 340px;
	}
	@media (prefers-color-scheme: dark) {
		:global(html:not([data-pref-theme='light']):has(.life)) {
			--dusk-hi: #0a0b0d;
			--dusk-lo: #211c16;
		}
	}
	:global(html[data-pref-theme='dark']:has(.life)) {
		--dusk-hi: #0a0b0d;
		--dusk-lo: #211c16;
	}
	:global(body:has(.life)) {
		background: linear-gradient(
			to top,
			var(--dusk-lo) 0,
			var(--dusk-lo) calc(320px + var(--foot)),
			var(--dusk-hi) calc(1300px + var(--foot)),
			var(--paper) calc(2300px + var(--foot))
		);
	}
	:global(.sheet:has(.life) > .shelf),
	:global(.sheet:has(.life) > footer),
	:global(.sheet:has(.life) > .foot-links),
	:global(.sheet:has(.life) > .foot-note) {
		background: var(--dusk-lo);
	}

	/* ---------- type ---------- */
	h1,
	h2:not(.tag),
	h3,
	.giant,
	.mid,
	.pull {
		font-weight: 600;
		letter-spacing: -0.04em;
		font-variation-settings: 'wdth' 80;
	}
	.tag {
		font-family: var(--mono);
		font-size: 11px;
		font-weight: 400;
		letter-spacing: 0.02em;
		line-height: 15px;
		color: var(--ink-3);
	}
	.giant {
		position: relative;
		isolation: isolate;
		font-size: clamp(96px, 13vw, 210px);
		line-height: 0.8;
		letter-spacing: -0.06em;
	}
	.big {
		font-size: clamp(44px, 4.6vw, 68px);
		line-height: 0.9;
	}
	.mid {
		font-size: 44px;
		line-height: 0.95;
	}
	h3 {
		font-size: 30px;
		line-height: 1;
		letter-spacing: -0.035em;
	}
	.say {
		font-size: 16px;
		line-height: 1.5;
		color: var(--ink-2);
		max-width: 60ch;
	}
	.lede {
		max-width: 46ch;
	}
	.pull {
		font-size: clamp(26px, 2.6vw, 38px);
		line-height: 1.08;
		letter-spacing: -0.03em;
		font-weight: 500;
		font-variation-settings: normal;
	}

	/* ---------- the trail ---------- */
	.walk {
		position: relative;
	}
	/* the first stretch of line reaches up beside the title */
	.trailhead {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 100%;
		height: 360px;
	}
	.leg,
	.bend {
		position: relative;
	}
	.leg {
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		align-items: start;
	}
	.leg > :not(.trail, .stop) {
		position: relative;
		z-index: 1;
	}
	/* a crossing needs height to read as a path that turns, not a line ruled across the page */
	.bend {
		height: 300px;
	}
	.bend.short {
		height: 120px;
	}
	.bend.wide {
		height: 420px;
	}
	.bend.tall {
		height: 400px;
	}
	.trail {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
		pointer-events: none;
	}
	.trail path,
	.climb path {
		fill: none;
		stroke: var(--trail);
		stroke-width: 1px;
		vector-effect: non-scaling-stroke;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	/* the line runs on past the last words and fades into the dusk */
	.trail.fade {
		mask-image: linear-gradient(to bottom, #000 55%, transparent);
	}
	/* where the walk starts: an open ring */
	.head {
		position: absolute;
		top: -5px;
		width: 11px;
		height: 11px;
		margin-left: -5px;
		border: 1px solid var(--trail);
		border-radius: 50%;
		background: var(--paper);
	}
	/* a stop on the trail: a dot on the line, and a hairline out to its caption */
	.stop {
		position: absolute;
		top: 7px;
		left: var(--l);
		width: var(--w);
		height: 1px;
		background: var(--trail);
		z-index: 1;
	}
	.stop::before {
		content: '';
		position: absolute;
		top: -3px;
		left: calc(var(--end, 0) * 100% - 3px);
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--ink);
	}
	/* home: a ring around the dot */
	.stop.home::after {
		content: '';
		position: absolute;
		top: -7px;
		left: calc(var(--end, 0) * 100% - 7px);
		width: 13px;
		height: 13px;
		border: 1px solid var(--trail);
		border-radius: 50%;
	}
	.at.r {
		text-align: right;
		padding-right: 8px;
	}

	/* ---------- prints: photos laid on the table ---------- */
	.print {
		background: var(--print);
		padding: 8px 8px 9px;
		box-shadow: var(--shadow);
		rotate: var(--r, 0deg);
	}
	.print :global(.photo) {
		outline-color: transparent;
	}

	/* ---------- paint: a swash of oil behind a big number, salt not a wash ---------- */
	.swash {
		position: absolute;
		z-index: -1;
		left: -6%;
		right: -10%;
		top: 4%;
		bottom: -8%;
		pointer-events: none;
		background: var(--swash);
		rotate: -3deg;
		-webkit-mask:
			radial-gradient(closest-side, #000 30%, transparent) 50% 60% / 100% 62% no-repeat;
		mask:
			radial-gradient(closest-side, #000 30%, transparent) 50% 60% / 100% 62% no-repeat;
	}
	.swash::after {
		content: '';
		position: absolute;
		inset: 0;
		background: url(/paint/dry.jpg) 0 0 / 512px 512px;
		mix-blend-mode: hard-light;
		opacity: var(--tex, 0.5);
	}

	/* ---------- intro ---------- */
	.intro {
		position: relative;
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		padding-top: 72px;
		padding-bottom: 56px;
	}
	.intro > * {
		grid-column: 1 / 9;
	}
	/* me, a print tucked beside the title, between it and the start of the trail */
	.intro > .me {
		position: absolute;
		top: 96px;
		left: 60%;
		width: 210px;
		margin: 0;
	}
	.intro h1 {
		margin-top: 18px;
		font-size: clamp(120px, 17vw, 260px);
		line-height: 0.78;
		letter-spacing: -0.065em;
		margin-left: -0.04em;
	}
	.intro .lede {
		margin-top: 36px;
		grid-column: 1 / 7;
	}
	.route {
		margin-top: 28px;
		grid-column: 1 / 10;
	}
	.route ol {
		display: flex;
		flex-wrap: wrap;
		gap: 6px 0;
		font-family: var(--mono);
		font-size: 11px;
		color: var(--ink-3);
	}
	.route li:not(:last-child)::after {
		content: '—';
		margin: 0 0.7em;
		color: var(--ink-3);
		opacity: 0.6;
	}

	/* ---------- annecy ---------- */
	.annecy {
		grid-template-rows: auto auto auto auto 1fr;
	}
	.annecy .km {
		grid-column: 3 / 9;
		grid-row: 2;
		margin-top: 40px;
		display: flex;
		flex-direction: column;
	}
	.annecy .giant {
		align-self: flex-start;
	}
	.around {
		margin-top: 14px;
		margin-left: 0.3em;
		font-size: clamp(28px, 2.8vw, 40px);
		line-height: 1;
		letter-spacing: -0.035em;
	}
	.story {
		grid-column: 3 / 8;
		grid-row: 3;
		margin-top: 40px;
		display: flex;
		flex-direction: column;
		gap: 0.75em;
		font-size: 17px;
		line-height: 1.5;
		letter-spacing: -0.008em;
		color: var(--ink-2);
		max-width: 60ch;
	}
	.story p:last-child {
		color: var(--ink);
	}
	.lake {
		grid-column: 9 / 13;
		grid-row: 2 / 6;
		margin-top: 70px;
		margin-right: -16px;
		position: relative;
	}
	.lake figcaption {
		position: absolute;
		left: -40px;
		top: 34px;
		padding: 4px 8px;
		background: var(--paper);
		font-size: 11px;
		color: var(--ink-2);
		rotate: calc(-1 * var(--r));
		box-shadow: 0 0 0 1px var(--hair);
	}
	.ride {
		grid-column: 3 / 9;
		grid-row: 4;
		margin-top: 48px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		max-width: 560px;
	}
	.ride .row {
		display: grid;
		grid-template-columns: 76px minmax(0, 1fr);
		gap: 14px;
		align-items: center;
	}
	.ride .k {
		font-size: 11px;
		color: var(--ink-3);
	}
	.ride .track {
		position: relative;
		height: 18px;
	}
	.ride .track b {
		position: absolute;
		left: 0;
		top: 8px;
		height: 1px;
		background: var(--ink);
	}
	.ride .track b::after {
		content: '';
		position: absolute;
		right: -3px;
		top: -3px;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--ink);
	}
	/* the plan: out and back, a hairpin */
	.ride .track b.out::after {
		background: var(--paper);
		border: 1px solid var(--ink);
	}
	.ride .track > span {
		position: absolute;
		top: 1px;
		margin-left: 12px;
		font-size: 11px;
		color: var(--ink-3);
		white-space: nowrap;
	}
	.ride .axis .track {
		height: 14px;
	}
	.ride .axis .track span {
		margin: 0;
		transform: translateX(-50%);
	}
	.ride .axis .track span:first-child {
		transform: none;
	}
	.ride .axis .track span:last-child {
		transform: translateX(-100%);
	}

	/* ---------- the mountains ---------- */
	.mountains .big {
		grid-column: 3 / 10;
		margin-top: 28px;
	}
	.mountains .note {
		grid-column: 3 / 9;
		margin-top: 16px;
		font-size: 18px;
	}
	.climb {
		position: relative;
		height: 250px;
	}
	.mountains {
		padding-bottom: 8px;
	}
	.climb svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
	}
	.climb .pencil {
		stroke: var(--ink-3);
		stroke-dasharray: 3 4;
	}
	.climb .plumb {
		stroke: var(--ink-3);
		stroke-dasharray: 1 4;
	}
	.climb .phone {
		display: none;
	}
	.summit {
		position: absolute;
		transform: translateX(-50%);
		font-size: 11px;
		color: var(--ink-2);
		white-space: nowrap;
	}
	.summit.next {
		color: var(--ink-3);
	}
	.treks {
		padding-bottom: 40px;
	}
	.trek {
		padding: 0 22px;
		margin-top: var(--drop);
	}
	.trek .tag {
		margin-top: 22px;
	}
	.trek h3 {
		margin-top: 6px;
	}
	.facts {
		margin-top: 10px;
		display: flex;
		flex-wrap: wrap;
		gap: 4px 14px;
		font-size: 11px;
		color: var(--ink-3);
	}
	.trek .say {
		margin-top: 12px;
		font-size: 15px;
	}
	.trek.next {
		margin-top: 0;
		padding-top: 4px;
		padding-inline: 0 8px;
	}
	.next h3 {
		color: var(--ink-3);
	}
	.redact {
		letter-spacing: -0.02em;
	}
	.next .say {
		color: var(--ink-3);
		margin-top: 8px;
	}

	.alone {
		padding-top: 72px;
	}
	.hrs {
		grid-column: 1 / 7;
		margin-top: 10px;
		white-space: nowrap;
	}
	.hrs .swash {
		right: -2%;
	}
	.alone .beside {
		grid-column: 7 / 11;
		align-self: end;
		padding-left: 8px;
	}
	.alone .beside .lede {
		margin-top: 10px;
		font-size: 19px;
		line-height: 1.4;
		color: var(--ink);
	}
	.bags {
		grid-column: 3 / 8;
		margin-top: 110px;
	}
	.bags .mid {
		margin-top: 10px;
	}
	.bags .say {
		margin-top: 14px;
		max-width: 52ch;
	}

	/* ---------- solo ---------- */
	/* the words stack in one column, so the tall table of prints beside them doesn't pull them apart */
	.solo-words {
		grid-column: 3 / 8;
		grid-row: 1;
	}
	.solo .pull {
		margin-top: 32px;
		font-size: clamp(36px, 3.8vw, 56px);
		line-height: 1;
		letter-spacing: -0.04em;
		font-weight: 600;
		font-variation-settings: 'wdth' 80;
	}
	.hostels {
		margin-top: 24px;
	}
	.pilatus {
		margin-top: 18px;
		max-width: 44ch;
	}
	.table {
		grid-column: 8 / 13;
		grid-row: 1 / 3;
		position: relative;
		height: 600px;
		margin-top: 20px;
	}
	.table .print {
		position: absolute;
	}
	/* grindelwald: a print of its own under the words, with its story beside it */
	.grindel {
		grid-column: 3 / 8;
		margin: 56px 0 0;
		display: grid;
		grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
		gap: 28px;
		align-items: end;
	}
	.grindel figcaption .say {
		margin-top: 10px;
		max-width: 30ch;
	}
	.city {
		position: absolute;
		left: 18px;
		top: -12px;
		display: flex;
		gap: 8px;
		align-items: baseline;
		padding: 4px 9px;
		background: var(--paper);
		box-shadow: 0 0 0 1px var(--hair);
		rotate: calc(-1 * var(--r));
	}
	.city b {
		font-size: 14px;
		font-weight: 500;
		letter-spacing: -0.01em;
	}
	.city .mono {
		font-size: 10.5px;
		color: var(--ink-3);
	}

	/* ---------- pizza ---------- */
	.pizza-words {
		grid-column: 3 / 9;
	}
	.pizza .pull {
		margin-top: 28px;
		font-size: clamp(36px, 3.8vw, 56px);
		line-height: 1;
		letter-spacing: -0.04em;
		font-weight: 600;
		font-variation-settings: 'wdth' 80;
	}
	.pizza .say {
		margin-top: 18px;
		max-width: 44ch;
	}
	.line-up {
		grid-column: 1 / 13;
		margin-top: 40px;
	}

	/* the oil-painted mountain from the home page, standing behind the title, right */
	.mountains {
		isolation: isolate;
	}
	/* the words stay clear of the paint behind them */
	.mountains .lede,
	.mountains h2 {
		text-shadow:
			0 0 2px var(--paper),
			0 0 6px var(--paper),
			0 0 14px var(--paper);
	}
	/* the range runs the full width of the page, under the words and over the trek profile */
	.mountains .range {
		grid-column: 1 / -1;
		margin: 36px calc(-1 * var(--gut)) -24px;
		-webkit-mask: linear-gradient(to right, transparent 0, #000 4%, #000 94%, transparent);
		mask: linear-gradient(to right, transparent 0, #000 4%, #000 94%, transparent);
	}
	/* the tunnel mouth, at the foot of the range right where the trail runs: a dark arch in a ring
	   of cut stone. the range is drawn over the trail, so the line is hidden inside the mountain and
	   walks out of the arch */
	.mountains .tunnel {
		position: absolute;
		left: calc(var(--tunnel) * 100% / 12);
		/* tiny, at the very foot of the rock, the size a real tunnel would be on a mountain this
		   big: a detail for whoever looks. its floor is the range's bottom edge (the range hangs 24px
		   below the section, which has 8px of padding) */
		bottom: -16px;
		width: 11px;
		height: 8px;
		translate: -50% 0;
		z-index: 2 !important;
		border-radius: 6px 6px 0 0;
		background: radial-gradient(ellipse 70% 100% at 50% 100%, #0d0d0c 0 60%, #3a3935 85%, transparent 86%);
		box-shadow: 0 -1px 0 0 color-mix(in srgb, var(--ink) 35%, transparent);
	}
	/* the trail, out of the tunnel's dark: it starts again at the arch's floor */
	.mountains .tunnel::after {
		content: '';
		position: absolute;
		left: 50%;
		bottom: -1px;
		width: 1px;
		height: 2px;
		background: var(--trail);
	}

	/* ---------- cinema ---------- */
	.dune {
		grid-column: 1 / 7;
		padding-right: 5%;
		text-align: right;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}
	.dune .giant {
		margin-top: 28px;
		font-size: clamp(80px, 9vw, 150px);
		line-height: 0.82;
	}
	.dune .lede {
		margin-top: 24px;
		max-width: 30ch;
	}
	/* arrakis, in line: a worm breaching the dunes, under the title */
	.arrakis {
		margin: 48px 0 0;
		width: min(100%, 560px);
	}
	.arrakis figcaption {
		margin-top: 12px;
		font-size: 10.5px;
		color: var(--ink-3);
	}
	.watch {
		grid-column: 9 / 13;
		margin-top: 130px;
	}
	.watch .pull {
		margin-top: 12px;
	}
	.watch dl {
		margin-top: 24px;
	}
	.watch dl div {
		display: grid;
		grid-template-columns: 110px 1fr;
		gap: 12px;
		padding: 6px 0;
		align-items: baseline;
	}
	.watch dt {
		font-size: 11px;
		color: var(--ink-3);
	}
	.watch dd {
		font-size: 16px;
		font-weight: 500;
		letter-spacing: -0.01em;
	}
	.notice {
		margin-top: 20px;
		display: flex;
		flex-direction: column;
		gap: 10px;
		font-size: 15px;
		line-height: 1.45;
		color: var(--ink-2);
		max-width: 52ch;
	}
	.notice li {
		padding-left: 18px;
		position: relative;
	}
	.notice li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.7em;
		width: 9px;
		height: 1px;
		background: var(--ink-3);
	}

	/* ---------- zimmer ---------- */
	.zimmer .left {
		grid-column: 9 / 13;
		position: relative;
	}
	/* the year he found the music, drawn in outline and set behind the words */
	.ghost {
		position: absolute;
		z-index: -1;
		left: -0.06em;
		top: -0.42em;
		font-size: clamp(140px, 15vw, 240px);
		font-weight: 600;
		letter-spacing: -0.06em;
		line-height: 0.8;
		font-variation-settings: 'wdth' 80;
		color: transparent;
		-webkit-text-stroke: 1px var(--hair);
		user-select: none;
	}
	.zimmer h2 {
		margin-top: 8px;
	}
	.zimmer .first {
		margin-top: 18px;
		max-width: 46ch;
	}
	.tracks {
		margin-top: 26px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.tracks li {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		column-gap: 10px;
	}
	.tracks b {
		font-size: 19px;
		font-weight: 500;
		letter-spacing: -0.02em;
	}
	.tracks .mono {
		font-size: 11px;
		color: var(--ink-3);
	}
	.drive {
		grid-column: 2 / 7;
		grid-row: 1;
		align-self: start;
		margin-top: 150px;
		padding-right: 6%;
		text-align: right;
		justify-self: end;
		max-width: 22ch;
		color: var(--ink);
	}

	/* ---------- books, building ---------- */
	.books .beside {
		grid-column: 4 / 10;
		text-align: right;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}
	.books .beside .say {
		margin-top: 14px;
		max-width: 44ch;
	}
	.case {
		grid-column: 2 / 11;
		margin-top: 36px;
	}
	.building .p0 {
		grid-column: 2 / 6;
		margin-top: 22px;
		padding-right: 20px;
	}
	.building .p1 {
		grid-column: 6 / 10;
		margin-top: 52px;
		padding-left: 20px;
	}
	.building .draw {
		grid-column: 2 / 10;
		margin-top: 40px;
	}

	/* ---------- jaipur ---------- */
	.jaipur .words {
		grid-column: 1 / 5;
		padding-right: 48px;
		text-align: right;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}
	.jaipur .tag {
		color: var(--ink-2);
	}
	.jaipur .giant {
		margin-top: 20px;
		margin-bottom: 22px;
		font-size: clamp(80px, 8.5vw, 140px);
	}
	.jaipur .say {
		max-width: 34ch;
	}
	.jaipur .say + .say {
		margin-top: 12px;
	}
	.jaipur .draw {
		grid-column: 6 / 13;
		margin-top: 90px;
		position: relative;
		isolation: isolate;
	}
	/* the evening light on the street, under the palace */
	.jaipur .draw .swash {
		left: -2%;
		right: 0;
		top: auto;
		bottom: 1%;
		height: 26%;
		rotate: -1deg;
	}
	.jaipur figcaption {
		margin-top: 14px;
		font-size: 11px;
		color: var(--ink-2);
		text-align: right;
	}

	/* ---------- the end ---------- */
	.scared {
		padding-bottom: 200px;
	}
	.scared .pull {
		grid-column: 3 / 11;
		font-size: clamp(30px, 3vw, 44px);
		max-width: 30ch;
	}
	.scared .q0 {
		margin-top: 22px;
	}
	.scared .q1 {
		grid-column: 4 / 12;
		margin-top: 36px;
		color: var(--ink-2);
		max-width: 34ch;
	}

	/* ---------- a narrower desk: the same walk, a little closer together ---------- */
	@media (max-width: 1240px) {
		.life {
			--gut: 32px;
		}
		.alone .beside {
			grid-column: 7 / 12;
			padding-right: 28px;
		}
		.trek {
			padding: 0 14px;
		}
	}

	/* ---------- a phone, or a narrow window: the trail runs down the left edge ---------- */
	@media (max-width: 1000px) {
		.life {
			--gut: 20px;
			background: linear-gradient(
				to top,
				var(--dusk-lo) 0,
				var(--dusk-lo) 300px,
				var(--dusk-hi) 1500px,
				var(--paper) 2500px
			);
		}
		.intro {
			display: block;
			padding-top: 44px;
			padding-bottom: 36px;
		}
		.mountains .range {
			position: relative;
			left: auto;
			right: auto;
			bottom: auto;
			margin: 8px -20px -10px -50px;
			-webkit-mask: none;
			mask: none;
		}
		/* on a phone the trail is one line down the left edge, 5px in from the walk */
		.mountains .tunnel {
			left: 5.5px;
			bottom: -2px;
		}
		.intro > .me {
			position: absolute;
			right: 4px;
			top: 60px;
			width: 110px;
			margin: 0;
		}
		.intro h1 {
			font-size: clamp(104px, 30vw, 200px);
		}
		.intro .lede {
			margin-top: 24px;
		}
		.walk::before {
			content: '';
			position: absolute;
			left: 5px;
			top: 0;
			bottom: 0;
			width: 1px;
			background: var(--trail);
			mask-image: linear-gradient(to bottom, #000 calc(100% - 260px), transparent);
		}
		.walk .trail,
		.trailhead,
		.climb .desk,
		.summit {
			display: none;
		}
		.walk::after {
			content: '';
			position: absolute;
			left: 0;
			top: -5px;
			width: 11px;
			height: 11px;
			border: 1px solid var(--trail);
			border-radius: 50%;
			background: var(--paper);
		}
		.bend,
		.bend.short,
		.bend.wide,
		.bend.tall {
			height: 64px;
		}
		.leg {
			display: flex;
			flex-direction: column;
			align-items: stretch;
			padding-left: 30px;
		}
		.leg > * {
			grid-column: auto !important;
			grid-row: auto !important;
		}
		.stop {
			left: 5px;
			width: 18px;
		}
		.at.r {
			text-align: left;
			padding-right: 0;
		}
		.stop::before,
		.stop.home::after {
			left: -3px;
		}
		.stop.home::after {
			left: -7px;
		}
		.giant {
			font-size: clamp(88px, 27vw, 150px);
		}
		.km {
			margin-top: 28px !important;
		}
		.story {
			margin-top: 28px;
			font-size: 16px;
		}
		.ride {
			margin-top: 32px;
		}
		.lake {
			margin: 40px 8px 0 0;
			align-self: flex-start;
			width: min(100%, 420px);
		}
		.lake figcaption {
			left: auto;
			right: -10px;
			top: 22px;
		}
		.ride .axis .track span:is(:nth-child(3), :nth-child(4), :nth-child(5)) {
			visibility: hidden;
		}

		.mountains .big {
			margin-top: 20px;
		}
		.climb {
			height: 120px;
			margin: 18px 0 0;
		}
		.climb .phone {
			display: block;
			left: 5px;
			width: calc(100% - 5px);
		}
		.treks {
			gap: 56px;
			padding-bottom: 0;
		}
		.trek {
			margin-top: 0;
			padding: 0;
		}
		.trek .print {
			width: min(100%, 420px);
		}
		.trek:nth-child(3) .print {
			margin-left: auto;
			width: 82%;
		}
		.trek:nth-child(4) .print {
			width: 88%;
		}
		.trek.next {
			margin-top: -8px;
		}

		.alone {
			padding-top: 64px;
		}
		.hrs {
			margin-top: 0;
			white-space: normal;
		}
		.alone .beside {
			padding: 0;
			margin-top: 24px;
		}
		.alone .beside .lede {
			font-size: 18px;
		}
		.bags {
			margin-top: 64px;
		}
		.mid {
			font-size: 38px;
		}

		.solo .pull {
			margin-top: 20px;
		}
		.table {
			height: auto;
			margin-top: 36px;
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 30px 16px;
		}
		.table .print {
			position: relative;
			left: auto !important;
			top: auto !important;
			width: auto !important;
		}
		.table .print:first-child {
			grid-column: 1 / -1;
			width: 86% !important;
		}
		.table .print:nth-child(3) {
			margin-top: 28px;
		}
		.grindel {
			grid-column: 1 / -1;
			grid-template-columns: 1fr;
			gap: 18px;
			margin-top: 40px;
		}
		.city {
			left: 10px;
			flex-direction: column;
			gap: 0;
		}

		.dune {
			padding-right: 0;
			text-align: left;
			align-items: flex-start;
		}
		.dune .giant {
			margin-top: 18px;
		}
		.watch {
			margin-top: 64px;
		}
		.watch dl div {
			grid-template-columns: 100px 1fr;
		}
		.zimmer .left {
			padding-right: 0;
		}
		.ghost {
			top: -20px;
			right: 0;
			font-size: clamp(110px, 32vw, 180px);
		}
		.drive {
			margin-top: 48px;
			padding-right: 0;
			text-align: left;
			justify-self: start;
			font-size: 26px;
		}

		.case {
			margin-top: 24px;
			overflow: hidden;
		}
		.building .p0,
		.building .p1 {
			padding: 0;
			margin-top: 16px;
		}
		.building .p0 {
			margin-top: 20px;
		}
		.building .draw {
			margin-top: 28px;
		}

		.jaipur .words {
			padding-right: 0;
			text-align: left;
			align-items: flex-start;
		}
		.jaipur .draw {
			margin-top: 36px;
		}
		.jaipur figcaption {
			text-align: left;
		}
		.scared {
			padding-bottom: 120px;
		}
		.scared .pull {
			font-size: 26px;
		}
		.scared .q0 {
			margin-top: 18px;
		}
		.scared .q1 {
			margin-top: 24px;
		}
	}
</style>
