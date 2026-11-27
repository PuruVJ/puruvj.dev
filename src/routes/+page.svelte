<script lang="ts">
	import Clock from '$lib/components/Clock.svelte' with { wake: 'idle' };
	import Mountain from '$lib/home/Mountain.svelte' with { wake: 'visible' };
	import LineMap from '$lib/home/LineMap.svelte' with { wake: 'load' };
	import ThemeSwitch from '$lib/components/ThemeSwitch.svelte';
	import { CAREER, span } from '$lib/career.ts';
	import { EMAIL, ELSEWHERE, ym, low } from '$lib/site.ts';
	import { short } from '$lib/numbers.ts';

	let { data } = $props();
	const jobs = CAREER.slice(0, 3);
	const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
	const years = WORDS[new Date().getFullYear() - 2020] ?? String(new Date().getFullYear() - 2020);
</script>

<svelte:head>
	<title>puru vijayvargia</title>
	<meta name="description" content="puru vijayvargia makes small, fast things for the web. on the svelte team." />
	<meta property="og:title" content="puru vijayvargia" />
	<link rel="alternate" type="text/markdown" href="/index.md" />
</svelte:head>

<main class="sheet home">
	<section class="b b-id">
		<header class="h"><span><span class="n">01</span>puruvj.dev</span><span class="hl"><Clock /><ThemeSwitch /></span></header>
		<Mountain />
		<h1 class="display">puru<br />vijayvargia</h1>
		<p class="lede intro">small, fast things for the web.<br />on the svelte team.</p>
		<nav class="nav" aria-label="site">
			<a href="/blog">writing</a>
			<a href="/work">work</a>
			<a href="/career">career</a>
			<a href="/speaking">talks</a>
			<a href="/stats">stats</a>
		</nav>
	</section>

	<section class="b b-map">
		<header class="h">
			<span><span class="n">02</span>{years} years, as a line map</span><span>time runs down ↓</span>
		</header>
		<LineMap stations={data.stations} />
	</section>

	<section class="b b-work">
		<header class="h"><span><span class="n">03</span>work</span><a href="/work">all →</a></header>
		<ul class="list">
			{#each data.work as w (w.url)}
				<li><a href={w.url}><b>{w.title}</b><span>{w.tagline}</span></a></li>
			{/each}
		</ul>
		{#if data.downloads}
			<a class="total" href="/stats"><b class="num">{short(data.downloads)}</b> npm downloads, all time →</a>
		{/if}
	</section>

	<section class="b b-career">
		<header class="h">
			<span><span class="n">04</span>career</span>
			<span class="hl"><a href="/resume.pdf">resume.pdf ↗</a><a href="/career">all →</a></span>
		</header>
		<ul class="list jobs">
			{#each jobs as j (j.org)}
				<li><b>{j.org}</b><span>{j.role}</span><time>{span(j)}</time></li>
			{/each}
		</ul>
	</section>

	<section class="b b-write">
		<header class="h">
			<span><span class="n">05</span>latest writing</span><a href="/blog">all {data.count} →</a>
		</header>
		<ol class="posts">
			{#each data.latest as p (p.slug)}
				<li><a href="/blog/{p.slug}"><span class="t">{low(p.title)}</span><time>{ym(p.date)}</time></a></li>
			{/each}
		</ol>
	</section>

	<section class="b b-mail">
		<header class="h"><span><span class="n">06</span>say hi</span></header>
		<a class="mail" href="mailto:{EMAIL}">{EMAIL}</a>
		<div class="elsewhere">
			{#each ELSEWHERE.filter((l) => l.name !== 'dev.to') as l (l.href)}<a href={l.href}>{l.name}</a>{/each}
		</div>
		<i class="clay duck" aria-hidden="true"></i>
	</section>
</main>

<style>
	.home {
		height: 100vh;
		grid-template-columns: minmax(0, 0.62fr) minmax(0, 0.62fr) minmax(0, 1fr);
		grid-template-rows: minmax(0, 1fr) minmax(0, auto) minmax(0, auto);
		grid-template-areas: 'id id map' 'work career map' 'write mail map';
	}
	.b {
		overflow: hidden;
	}
	.b-id {
		grid-area: id;
		--sky: color-mix(in srgb, var(--paper), var(--night) calc(var(--n, 0) * 100%));
		background: var(--sky);
	}
	:global(:root) {
		--night: #e2e0d9;
	}
	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-pref-theme='light'])) {
			--night: #060606;
		}
	}
	:global(:root[data-pref-theme='dark']) {
		--night: #060606;
	}
	.b-id > :not(:global(.mtn), .clay) {
		position: relative;
		z-index: 1;
	}
	.b-map {
		grid-area: map;
	}
	.b-work {
		grid-area: work;
	}
	.b-career {
		grid-area: career;
	}
	.b-write {
		grid-area: write;
	}
	.b-mail {
		grid-area: mail;
	}

	.b-id h1 {
		margin-top: auto;
	}
	.intro {
		margin-top: 20px;
	}
	.nav {
		display: flex;
		gap: 26px;
		margin-top: 26px;
		font-size: 15px;
		font-weight: 500;
	}
	.nav a:hover,
	.posts a:hover .t,
	.mail:hover,
	.list a:hover b {
		text-decoration: underline;
		text-underline-offset: 4px;
		text-decoration-thickness: 1px;
	}
	.hl {
		display: inline-flex;
		align-items: baseline;
		gap: 18px;
	}

	.list {
		margin-top: 22px;
		display: flex;
		flex-direction: column;
		gap: 7px;
	}
	.list li,
	.list a {
		display: grid;
		grid-template-columns: 104px 1fr auto;
		gap: 12px;
		align-items: baseline;
		white-space: nowrap;
	}
	.list li:has(> a) {
		display: block;
	}
	.list b {
		font-weight: 500;
		font-size: 14px;
		letter-spacing: -0.01em;
	}
	.list span {
		color: var(--ink-3);
		font-size: 13px;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.list time {
		font-family: var(--mono);
		font-size: 10.5px;
		color: var(--ink-3);
	}
	.jobs li {
		grid-template-columns: 124px 1fr auto;
		column-gap: 10px;
	}
	.total {
		margin-top: auto;
		padding-top: 18px;
		font-family: var(--mono);
		font-size: 11px;
		color: var(--ink-3);
	}
	.total b {
		font-weight: 500;
		color: var(--ink);
	}
	.total:hover {
		color: var(--ink);
	}

	.posts {
		margin-top: 22px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.posts a {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 24px;
		align-items: baseline;
	}
	.posts .t {
		text-wrap: balance;
		font-size: 18px;
		font-weight: 500;
		letter-spacing: -0.02em;
		line-height: 1.15;
	}
	.posts time {
		font-family: var(--mono);
		font-size: 11px;
		color: var(--ink-3);
	}

	.mail {
		margin-top: 22px;
		font-size: 19px;
		font-weight: 500;
		letter-spacing: -0.02em;
		align-self: flex-start;
	}
	.elsewhere {
		margin-top: 14px;
		display: flex;
		gap: 20px;
		font-family: var(--mono);
		font-size: 11px;
		color: var(--ink-3);
	}
	.elsewhere a:hover {
		color: var(--ink);
	}

	.duck {
		right: 40px;
		bottom: 0;
	}

	@media (min-width: 761px) {
		:global(html:has(.home)),
		:global(body:has(.home)) {
			overflow: hidden;
		}
	}
	@media (min-width: 761px) and (max-height: 860px) {
		.b {
			--pad: 24px;
		}
		.intro {
			font-size: 16px;
			margin-top: 14px;
		}
		.nav {
			margin-top: 18px;
		}
		.posts {
			margin-top: 16px;
			gap: 10px;
		}
		.posts .t {
			font-size: 16px;
		}
		.mail {
			margin-top: 16px;
			font-size: 17px;
		}
		.list {
			margin-top: 16px;
			gap: 4px;
		}
		.list b {
			font-size: 13px;
		}
		.list span {
			font-size: 12px;
		}
	}
	@media (max-width: 760px) {
		.home {
			height: auto;
			grid-template-columns: 1fr;
			grid-template-rows: none;
			grid-template-areas: 'id' 'map' 'work' 'career' 'write' 'mail';
		}
		.b-id {
			min-height: 600px;
		}
		.b-id h1 {
			font-size: 72px;
		}
		.nav {
			gap: 18px;
			flex-wrap: wrap;
		}
		.b-map {
			height: 780px;
		}
		.posts .t {
			font-size: 19px;
		}
		.mail {
			font-size: 20px;
			padding-bottom: 40px;
		}
		.duck {
			right: 22px;
		}
	}
</style>
