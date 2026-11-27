<script lang="ts">
	import { Region } from 'ogygia';
	import Shell from '$lib/components/Shell.svelte';
	import '$lib/styles/prose.css';
	import { low } from '$lib/site.ts';

	let { data } = $props();
	const dotted = (d: string) => d.replaceAll('-', '.');
	const pad = (n: number) => String(n).padStart(2, '0');
</script>

<svelte:head>
	<meta property="og:type" content="article" />
	<meta property="og:url" content="https://puruvj.dev/blog/{data.slug}" />
	<meta property="og:image" content="https://puruvj.dev/og/blog/{data.slug}.png" />
	<meta property="article:published_time" content={data.date} />
	<link rel="canonical" href="https://puruvj.dev/blog/{data.slug}" />
</svelte:head>

<Shell
	here="/blog"
	title="{low(data.title)} · puru vijayvargia"
	description={data.description}
	md="/blog/{data.slug}.md"
>
	<header class="b head">
		<div class="h">
			<span><span class="n">{pad(data.n)}</span>writing</span>
			<a href="/blog">← all writing</a>
		</div>
		<h1>{low(data.title)}</h1>
		<p class="lede">{data.description}</p>
		<dl class="facts mono">
			<div><dt>published</dt><dd><time datetime={data.date}>{dotted(data.date)}</time></dd></div>
			<div><dt>reading</dt><dd>{data.minutes} min</dd></div>
			{#if data.series}<div><dt>series</dt><dd>{data.series.name}</dd></div>{/if}
			<div><dt>also as</dt><dd><a class="hov" href="/blog/{data.slug}.md">markdown ↗</a></dd></div>
		</dl>
	</header>

	<aside class="b rail">
		<div class="stick">
			{#if data.series}
				<div class="h"><span>series · {data.series.posts.length} parts</span></div>
				<ol class="series">
					{#each data.series.posts as p, i (p.slug)}
						<li>
							<span class="mono dim">{pad(i + 1)}</span>
							{#if p.slug === data.slug}<b>{low(p.title)}</b>{:else}<a class="hov" href="/blog/{p.slug}">{low(p.title)}</a>{/if}
						</li>
					{/each}
				</ol>
			{/if}
			{#if data.headings.length > 2}
				<div class="h toc-h"><span>contents</span></div>
				<ol class="toc">
					{#each data.headings as h (h.id)}
						<li class:sub={h.depth === 3}><a href="#{h.id}">{h.text}</a></li>
					{/each}
				</ol>
			{/if}
		</div>
	</aside>

	<article class="b body">
		<div class="prose">
			<Region of={data.body} />
		</div>
	</article>

	<nav class="b pn prev" aria-label="older post">
		{#if data.prev}
			<div class="h"><span>← older</span></div>
			<a href={data.prev.href}>{low(data.prev.title)}</a>
		{:else}
			<div class="h"><span>← older</span></div>
			<span class="dim">this is the first one.</span>
		{/if}
	</nav>
	<nav class="b pn next" aria-label="newer post">
		{#if data.next}
			<div class="h"><span>newer →</span></div>
			<a href={data.next.href}>{low(data.next.title)}</a>
		{:else}
			<div class="h"><span>newer →</span></div>
			<span class="dim">nothing newer yet. <a class="u" href="/rss.xml">follow the feed</a>.</span>
		{/if}
	</nav>
	<div class="b pn all">
		<div class="h"><span>everything</span></div>
		<a href="/blog">all writing, by year →</a>
	</div>
</Shell>

<style>
	.head {
		grid-column: 1 / -1;
		padding-bottom: 36px;
	}
	h1 {
		margin-top: 72px;
		max-width: 17ch;
		font-size: clamp(44px, 5.2vw, 80px);
		line-height: 0.92;
		font-weight: 600;
		letter-spacing: -0.04em;
		font-variation-settings: 'wdth' 80;
		text-wrap: balance;
	}
	.head .lede {
		margin-top: 26px;
		max-width: 52ch;
	}
	.facts {
		margin-top: 40px;
		display: flex;
		flex-wrap: wrap;
		gap: 10px 48px;
		font-size: 11px;
	}
	.facts dt {
		color: var(--ink-3);
	}
	.facts dd {
		margin-top: 4px;
		color: var(--ink);
	}

	.rail {
		grid-column: 1;
	}
	.stick {
		position: sticky;
		top: 28px;
	}
	.series {
		margin-top: 16px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		font-size: 14px;
		line-height: 1.3;
	}
	.series li {
		display: grid;
		grid-template-columns: 26px 1fr;
		align-items: baseline;
	}
	.series .mono {
		font-size: 10.5px;
	}
	.series b {
		font-weight: 500;
	}
	.series a {
		color: var(--ink-2);
	}
	.toc-h {
		margin-top: 40px;
	}
	.series + .toc-h {
		margin-top: 40px;
	}
	.stick > .toc-h:first-child {
		margin-top: 0;
	}
	.toc {
		margin-top: 16px;
		display: flex;
		flex-direction: column;
		gap: 7px;
		font-size: 13.5px;
		line-height: 1.3;
		color: var(--ink-2);
		max-width: 34ch;
	}
	.toc .sub {
		padding-left: 14px;
		font-size: 12.5px;
		color: var(--ink-3);
	}
	.toc a:hover {
		color: var(--ink);
		text-decoration: underline;
		text-underline-offset: 3px;
		text-decoration-thickness: 1px;
	}

	.body {
		grid-column: 2 / -1;
		padding-top: 44px;
		padding-bottom: 80px;
	}

	.pn {
		min-height: 150px;
	}
	.pn > a,
	.pn > span {
		margin-top: 18px;
		font-size: 18px;
		font-weight: 500;
		letter-spacing: -0.02em;
		line-height: 1.2;
		text-wrap: balance;
	}
	.pn > span {
		font-size: 15px;
		font-weight: 400;
	}
	.pn > a:hover {
		text-decoration: underline;
		text-underline-offset: 4px;
		text-decoration-thickness: 1px;
	}

	@media (max-width: 1100px) {
		.rail {
			display: none;
		}
		.body {
			grid-column: 1 / -1;
		}
	}
	@media (max-width: 760px) {
		h1 {
			margin-top: 48px;
			font-size: 42px;
		}
		.pn {
			grid-column: 1 / -1;
			min-height: 0;
		}
		.body {
			padding-top: 28px;
		}
	}
</style>
