<script lang="ts">
	import type { ImageDescriptor } from '@ogygia/image';
	import Shell from '$lib/components/Shell.svelte';
	import Soon from '$lib/components/Soon.svelte';
	import Photo from '$lib/life/Photo.svelte';
	import HawaMahal from '$lib/life/HawaMahal.svelte';
	import Bridge from '$lib/life/Bridge.svelte';
	import * as L from '$lib/life.ts';

	// the photos. each is a ruled stand-in until its file is in: to put one in, drop the jpg in
	// src/lib/life/ and swap its null for import.meta.og.image('../../lib/life/<name>.jpg')
	const PHOTOS: Record<string, ImageDescriptor | null> = {
		annecy: null,
		kedarkantha: null,
		brahmatal: null,
		'dayara bugyal': null,
		interlaken: null,
		lucerne: null,
		salzburg: null,
	};

	const pad = (n: number) => String(n).padStart(2, '0');
	const INDEX = [
		{ n: 3, id: 'annecy', name: 'annecy' },
		{ n: 5, id: 'mountains', name: 'the mountains' },
		{ n: 12, id: 'solo', name: 'solo travel' },
		{ n: 14, id: 'cinema', name: 'cinema' },
		{ n: 16, id: 'zimmer', name: 'hans zimmer' },
		{ n: 17, id: 'books', name: 'books' },
		{ n: 18, id: 'building', name: 'always building' },
		{ n: 19, id: 'jaipur', name: 'jaipur' },
		{ n: 20, id: 'scared', name: 'what scares me' },
	];
	// the annecy ride on a 0 to 50 km rule
	const KM = [0, 10, 20, 30, 40, 50];
</script>

<Shell here="/life" title="life · puru vijayvargia" description={`away from the keyboard: ${L.LIFE_LEDE}`} md="/life.md">
	<header class="b intro">
		<div class="h"><span><span class="n">01</span>life</span><span>away from the keyboard</span></div>
		<h1 class="display">life</h1>
		<p class="lede">{L.LIFE_LEDE}</p>
	</header>
	<nav class="b index" aria-label="on this page">
		<div class="h"><span><span class="n">02</span>on this page</span></div>
		<ol>
			{#each INDEX as x (x.id)}
				<li><a href="#{x.id}"><span class="mono dim">{pad(x.n)}</span><span class="t">{x.name}</span></a></li>
			{/each}
		</ol>
	</nav>

	<!-- the comeback ride -->
	<article class="b annecy" id="annecy">
		<div class="h"><span><span class="n">03</span>annecy, france</span><span>oct 2025</span></div>
		<h2 class="big">50 km around the lake</h2>
		<div class="prose-s">
			{#each L.ANNECY as p (p)}<p>{p}</p>{/each}
		</div>
		<div class="ride" aria-label="the plan was 10 km. the ride was 50 km.">
			<div class="row">
				<span class="k mono">the plan</span>
				<div class="track"><b style="width: 20%"></b><span class="mono" style="left: 20%">5 out, 5 back</span></div>
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
	</article>
	<figure class="b annecy-photo">
		<div class="h"><span><span class="n">04</span>the lake</span></div>
		<div class="ph"><Photo of={PHOTOS.annecy} name="annecy" alt="lake annecy" /></div>
	</figure>

	<!-- the mountains -->
	<header class="b sec" id="mountains">
		<div class="h"><span><span class="n">05</span>the mountains</span><span>dec 2025 – now</span></div>
		<h2 class="big">the mountains</h2>
		<p class="lede">{L.TREKS_NOTE}</p>
	</header>
	{#each L.TREKS as t, i (t.name)}
		<article class="b trek">
			<div class="h"><span><span class="n">{pad(6 + i)}</span>{t.when}</span><span>trek {pad(i + 1)}</span></div>
			<Photo of={PHOTOS[t.name]} name={t.name} alt="{t.name}, {t.when}" />
			<h3>{t.name}</h3>
			<ul class="facts mono">{#each t.facts as x (x)}<li>{x}</li>{/each}</ul>
			<p class="say">{t.text}</p>
		</article>
	{/each}
	<!-- the next one, before it has a name -->
	<article class="b trek next">
		<div class="h"><span><span class="n">09</span>next</span><span>trek 04</span></div>
		<h3><Soon><span class="redact" title="not yet">█████████</span></Soon></h3>
		<p class="say">one more, coming.</p>
	</article>
	<article class="b small">
		<div class="h"><span><span class="n">10</span>on every trek</span></div>
		<p class="mid num">1–2 hrs</p>
		<p class="say">{L.ALONE}</p>
	</article>
	<article class="b small">
		<div class="h"><span><span class="n">11</span>back in jaipur</span></div>
		<p class="mid">garbage bags</p>
		<p class="say">{L.BAGS}</p>
	</article>

	<!-- alone, abroad -->
	<article class="b solo" id="solo">
		<div class="h"><span><span class="n">12</span>solo travel</span><span>europe</span></div>
		<p class="pull">{L.SOLO}</p>
		<p class="say">hostels in {L.CITIES.map((c) => c.name).join(', ').replace(/, ([^,]*)$/, ' and $1')}.</p>
	</article>
	<section class="b cities">
		<div class="h"><span><span class="n">13</span>hostels</span><span>{L.CITIES.length} cities</span></div>
		<ul>
			{#each L.CITIES as c (c.name)}
				<li>
					<Photo of={PHOTOS[c.name]} name={c.name} alt={c.name} aspect="3/4" width={360} />
					<span class="city"><b>{c.name}</b><span class="mono dim">{c.country}</span></span>
				</li>
			{/each}
		</ul>
	</section>

	<!-- films and music -->
	<article class="b dune" id="cinema">
		<div class="h"><span><span class="n">14</span>cinema</span></div>
		<h2 class="big">dune:<br />part two</h2>
		<p class="say">{L.DUNE}</p>
	</article>
	<article class="b watch">
		<div class="h"><span><span class="n">15</span>how i watch</span></div>
		<p class="pull">{L.WATCH_QUOTE}</p>
		<dl>
			{#each L.WATCH as w (w.k)}<div><dt class="mono">{w.k}</dt><dd>{w.v}</dd></div>{/each}
		</dl>
		<ul class="notice">{#each L.NOTICE as x (x)}<li>{x}</li>{/each}</ul>
	</article>
	<article class="b zimmer" id="zimmer">
		<div class="h"><span><span class="n">16</span>hans zimmer</span><span>since 2018</span></div>
		<p class="say first">{L.ZIMMER}</p>
		<ol class="tracks">
			{#each L.TRACKS as x, i (x.t)}
				<li><span class="mono dim">{pad(i + 1)}</span><b>{x.t}</b><span class="mono dim f">{x.f}</span></li>
			{/each}
		</ol>
		<p class="say drive">{L.DRIVE}</p>
	</article>

	<!-- books, and building things -->
	<article class="b books" id="books">
		<div class="h"><span><span class="n">17</span>books</span></div>
		<p class="huge num">70+</p>
		<p class="sub mono">times i've read harry potter, hindi and english combined</p>
		<p class="say">{L.BOOKS}</p>
	</article>
	<article class="b building" id="building">
		<div class="h"><span><span class="n">18</span>always building</span><span>an engineer at heart</span></div>
		<div class="cols">
			{#each L.BUILDING as p (p)}<p class="say">{p}</p>{/each}
		</div>
		<div class="draw"><Bridge /></div>
	</article>

	<!-- home, at twilight -->
	<section class="b jaipur" id="jaipur">
		<div class="h"><span><span class="n">19</span>home</span><span>twilight</span></div>
		<div class="words">
			<h2 class="big">jaipur</h2>
			{#each L.HOME as p (p)}<p class="say">{p}</p>{/each}
		</div>
		<figure class="draw">
			<HawaMahal />
			<figcaption class="mono">hawa mahal, jaipur · 26.92° n, 75.83° e</figcaption>
		</figure>
	</section>

	<article class="b scared" id="scared">
		<div class="h"><span><span class="n">20</span>what scares me</span></div>
		{#each L.SCARED as p (p)}<p class="pull">{p}</p>{/each}
	</article>
</Shell>

<style>
	/* the dusk: the one tint on this page. paper above, the sky going down behind jaipur */
	.jaipur {
		--dusk-hi: #e1e1e1;
		--dusk-lo: #ebe6df;
	}
	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-pref-theme='light'])) .jaipur {
			--dusk-hi: #08090b;
			--dusk-lo: #211d18;
		}
	}
	:global(:root[data-pref-theme='dark']) .jaipur {
		--dusk-hi: #08090b;
		--dusk-lo: #211d18;
	}

	[id] {
		scroll-margin-top: calc(var(--top-h) + 8px);
	}
	h2,
	h3,
	.mid,
	.huge,
	.pull {
		font-weight: 600;
		letter-spacing: -0.04em;
		font-variation-settings: 'wdth' 80;
	}
	.big {
		font-size: 40px;
		line-height: 0.95;
	}
	h3 {
		font-size: 30px;
		line-height: 1;
		letter-spacing: -0.035em;
	}
	.say {
		font-size: 15px;
		line-height: 1.45;
		color: var(--ink-2);
		max-width: 48ch;
	}
	.pull {
		font-size: 24px;
		line-height: 1.12;
		letter-spacing: -0.025em;
		font-weight: 500;
		font-variation-settings: normal;
		max-width: 30ch;
	}

	.intro {
		grid-column: 1 / 3;
		padding-bottom: 36px;
	}
	.intro h1 {
		margin-top: 96px;
	}
	.intro .lede {
		margin-top: 22px;
		max-width: 44ch;
	}
	.index ol {
		margin-top: auto;
		padding-top: 28px;
		display: flex;
		flex-direction: column;
		gap: 7px;
	}
	.index a {
		display: grid;
		grid-template-columns: 34px 1fr;
		align-items: baseline;
		font-size: 15px;
		font-weight: 500;
		letter-spacing: -0.01em;
	}
	.index .mono {
		font-size: 10.5px;
	}
	.index a:hover .t {
		text-decoration: underline;
		text-underline-offset: 4px;
		text-decoration-thickness: 1px;
	}

	/* annecy */
	.annecy {
		grid-column: 1 / 3;
	}
	.annecy h2 {
		margin-top: 56px;
	}
	.prose-s {
		margin-top: 22px;
		display: flex;
		flex-direction: column;
		gap: 0.7em;
		font-size: 17px;
		line-height: 1.45;
		letter-spacing: -0.01em;
		color: var(--ink-2);
		max-width: 52ch;
	}
	.ride {
		margin-top: auto;
		padding-top: 40px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.ride .row {
		display: grid;
		grid-template-columns: 80px minmax(0, 1fr);
		gap: 16px;
		align-items: center;
	}
	.ride .k {
		font-size: 11px;
		color: var(--ink-3);
	}
	.ride .track {
		position: relative;
		height: 18px;
		background: linear-gradient(var(--hair), var(--hair)) 0 50% / 100% 1px no-repeat;
	}
	.ride .track b {
		position: absolute;
		left: 0;
		top: 6px;
		height: 6px;
		background: var(--ink);
	}
	.ride .track > span {
		position: absolute;
		top: 1px;
		margin-left: 10px;
		font-size: 10.5px;
		color: var(--ink-3);
		white-space: nowrap;
	}
	.ride .axis {
		padding-top: 6px;
		border-top: 1px solid var(--hair);
	}
	.ride .axis .track {
		background: none;
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
	.annecy-photo .ph {
		margin-top: 22px;
	}

	/* the mountains */
	.sec {
		grid-column: 1 / -1;
		padding-bottom: 32px;
	}
	.sec h2 {
		margin-top: 48px;
	}
	.sec .lede {
		margin-top: 12px;
	}
	.trek > :global(.photo) {
		margin-top: 22px;
	}
	.trek h3 {
		margin-top: 22px;
	}
	.facts {
		margin-top: 10px;
		display: flex;
		flex-wrap: wrap;
		gap: 4px 14px;
		font-size: 10.5px;
		color: var(--ink-3);
	}
	.trek .say {
		margin-top: 14px;
	}
	/* the unannounced one: drawn in pencil, not ink, as on /work */
	.next {
		background:
			repeating-linear-gradient(-45deg, transparent 0 9px, var(--hair) 9px 10px),
			var(--paper);
	}
	.next h3 {
		margin-top: auto;
		color: var(--ink-3);
	}
	.redact {
		letter-spacing: -0.02em;
	}
	.next .say {
		color: var(--ink-3);
	}
	.small {
		min-height: 300px;
	}
	.mid {
		margin-top: auto;
		padding-top: 40px;
		font-size: 44px;
		line-height: 0.95;
	}
	.small .say {
		margin-top: 14px;
	}

	/* solo travel */
	.solo .pull {
		margin-top: 56px;
	}
	.solo .say {
		margin-top: auto;
		padding-top: 24px;
	}
	.cities {
		grid-column: 2 / -1;
	}
	.cities ul {
		margin-top: 22px;
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 16px;
	}
	.city {
		margin-top: 10px;
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 8px;
	}
	.city b {
		font-size: 15px;
		font-weight: 500;
		letter-spacing: -0.01em;
	}
	.city .mono {
		font-size: 10.5px;
	}

	/* cinema and music */
	.dune h2 {
		margin-top: 56px;
		font-size: 56px;
		line-height: 0.88;
	}
	.dune .say {
		margin-top: auto;
		padding-top: 28px;
		font-size: 17px;
	}
	.watch .pull {
		margin-top: 40px;
	}
	.watch dl {
		margin-top: 24px;
		border-top: 1px solid var(--hair);
	}
	.watch dl div {
		display: grid;
		grid-template-columns: 110px 1fr;
		gap: 12px;
		padding: 9px 0;
		border-bottom: 1px solid var(--hair);
		align-items: baseline;
	}
	.watch dt {
		font-size: 10.5px;
		color: var(--ink-3);
	}
	.watch dd {
		font-size: 15px;
		font-weight: 500;
		letter-spacing: -0.01em;
	}
	.notice {
		margin-top: 18px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		font-size: 14px;
		line-height: 1.4;
		color: var(--ink-2);
	}
	.notice li {
		padding-left: 16px;
		position: relative;
	}
	.notice li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.62em;
		width: 7px;
		height: 1px;
		background: var(--ink-3);
	}
	.zimmer .first {
		margin-top: 40px;
	}
	.tracks {
		margin-top: 22px;
		border-top: 1px solid var(--hair);
	}
	.tracks li {
		display: grid;
		grid-template-columns: 28px minmax(0, 1fr);
		row-gap: 2px;
		padding: 8px 0;
		border-bottom: 1px solid var(--hair);
		align-items: baseline;
	}
	.tracks .mono {
		font-size: 10.5px;
	}
	.tracks b {
		font-size: 15px;
		font-weight: 500;
		letter-spacing: -0.01em;
	}
	.tracks .f {
		grid-column: 2;
	}
	.drive {
		margin-top: auto;
		padding-top: 24px;
	}

	/* books, building */
	.huge {
		margin-top: 56px;
		font-size: 96px;
		line-height: 0.86;
		letter-spacing: -0.05em;
	}
	.sub {
		margin-top: 10px;
		font-size: 11px;
		color: var(--ink-3);
	}
	.books .say {
		margin-top: auto;
		padding-top: 28px;
	}
	.building {
		grid-column: 2 / -1;
	}
	.building .cols {
		margin-top: 40px;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 28px;
	}
	.building .draw {
		margin-top: auto;
		padding-top: 32px;
	}

	/* jaipur at twilight */
	.jaipur {
		grid-column: 1 / -1;
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
		grid-template-rows: auto 1fr;
		column-gap: 28px;
		background: linear-gradient(to bottom, var(--paper), var(--dusk-hi) 30%, var(--dusk-lo) 88%, var(--paper));
	}
	.jaipur .h {
		grid-column: 1 / -1;
		color: var(--ink-2);
	}
	.jaipur .words h2 {
		margin-top: 56px;
		margin-bottom: 18px;
		font-size: 56px;
		line-height: 0.88;
	}
	.jaipur .words .say + .say {
		margin-top: 10px;
	}
	.jaipur .draw {
		align-self: end;
		padding-top: 32px;
	}
	.jaipur figcaption {
		margin-top: 14px;
		font-size: 10.5px;
		color: var(--ink-2);
		text-align: right;
	}

	.scared {
		grid-column: 1 / -1;
		padding-block: 40px 56px;
	}
	.scared .pull {
		margin-top: 36px;
		font-size: 30px;
		max-width: 36ch;
	}
	.scared .pull + .pull {
		margin-top: 14px;
		color: var(--ink-2);
	}

	@media (max-width: 1100px) {
		.building .cols {
			grid-template-columns: 1fr;
			gap: 12px;
		}
	}
	@media (max-width: 760px) {
		.b {
			grid-column: 1 / -1;
		}
		.intro h1 {
			margin-top: 56px;
		}
		.annecy h2,
		.dune h2,
		.huge,
		.solo .pull,
		.jaipur .words h2 {
			margin-top: 36px;
		}
		.small {
			min-height: 0;
		}
		.mid {
			padding-top: 28px;
		}
		.cities ul {
			gap: 10px;
		}
		.city {
			flex-direction: column;
			gap: 2px;
		}
		.jaipur {
			grid-template-columns: 1fr;
			grid-template-rows: none;
			background: linear-gradient(to bottom, var(--paper), var(--dusk-hi) 45%, var(--dusk-lo) 90%, var(--paper));
		}
		.jaipur figcaption {
			text-align: left;
		}
		.scared .pull {
			font-size: 24px;
		}
	}
</style>
