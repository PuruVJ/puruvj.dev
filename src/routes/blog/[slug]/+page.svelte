<script lang="ts">
	import { Region } from 'ogygia';
	import Shell from '$lib/components/Shell.svelte';
	import '$lib/styles/prose.css';
	import { low } from '$lib/site.ts';

	let { data } = $props();
	const dotted = (d: string) => d.replaceAll('-', '.');
	const pad = (n: number) => String(n).padStart(2, '0');
	// a contents list only earns its column with three or more sections
	const toc = $derived(data.headings.length > 2);
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
	<!-- hero: the title runs across columns 1 and 2, the facts sit in column 3 -->
	<header class="b head">
		<div class="h">
			<span><span class="n">{pad(data.n)}</span>writing</span>
			<a href="/blog">← all writing</a>
		</div>
		<h1>{low(data.title)}</h1>
		<p class="lede">{data.description}</p>
	</header>
	<aside class="b meta">
		<div class="h"><span>this post</span></div>
		<dl class="facts mono">
			<div><dt>published</dt><dd><time datetime={data.date}>{dotted(data.date)}</time></dd></div>
			<div><dt>reading</dt><dd>{data.minutes} min</dd></div>
			{#if data.series}<div><dt>series</dt><dd>{data.series.name}</dd></div>{/if}
			<div><dt>also as</dt><dd><a class="ln" href="/blog/{data.slug}.md">markdown ↗</a></dd></div>
		</dl>
	</aside>

	<!-- column 1: contents -->
	<nav class="b toc-b" aria-label="contents">
		<div class="stick">
			{#if toc}
				<div class="h"><span>contents</span></div>
				<ol class="toc">
					{#each data.headings as h (h.id)}
						<li class:sub={h.depth === 3}><a href="#{h.id}">{h.text}</a></li>
					{/each}
				</ol>
			{:else}
				<div class="h"><span>contents</span></div>
				<p class="none">one short piece, no sections. about {data.minutes} min.</p>
			{/if}
		</div>
	</nav>

	<!-- column 2 (and 3 when column 2 is too narrow to read in) -->
	<article class="b body">
		<div class="prose">
			<Region of={data.body} />
		</div>
	</article>

	<!-- column 3: the margin -->
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
			<div class="h"><span>← older</span></div>
			{#if data.prev}<a class="pnl" href={data.prev.href}>{low(data.prev.title)}</a>{:else}<span class="pnl dim">this is the first one.</span>{/if}
			<div class="h"><span>newer →</span></div>
			{#if data.next}<a class="pnl" href={data.next.href}>{low(data.next.title)}</a>{:else}<span class="pnl dim">nothing newer yet. <a class="u" href="/rss.xml">follow the feed</a>.</span>{/if}
			<div class="h"><span>elsewhere</span></div>
			<div class="more mono">
				<a class="ln" href="/blog">all writing</a>
				<a class="ln" href={data.edit}>edit on github ↗</a>
			</div>
		</div>
		{#if !toc}<i class="clay papers" aria-hidden="true"></i>{/if}
	</aside>

	<!-- older / newer as a row, for when there is no margin column -->
	<nav class="b pn prev" aria-label="older post">
		<div class="h"><span>← older</span></div>
		{#if data.prev}<a href={data.prev.href}>{low(data.prev.title)}</a>{:else}<span class="dim">this is the first one.</span>{/if}
	</nav>
	<nav class="b pn next" aria-label="newer post">
		<div class="h"><span>newer →</span></div>
		{#if data.next}<a href={data.next.href}>{low(data.next.title)}</a>{:else}<span class="dim">nothing newer yet. <a class="u" href="/rss.xml">follow the feed</a>.</span>{/if}
	</nav>
	<div class="b pn all">
		<div class="h"><span>everything</span></div>
		<a href="/blog">all writing, by year →</a>
		<a class="edit ln mono" href={data.edit}>edit on github ↗</a>
	</div>
</Shell>

<style>
	/* the post locks to the header's three columns:
	   1 contents · 2 the text · 3 the margin. below 1300px column 2 is too narrow to read in,
	   so the text takes 2 and 3 and the margin's links move to a row at the end. */
	.head {
		grid-column: 1 / 3;
		padding-bottom: 40px;
	}
	h1 {
		margin-top: 72px;
		max-width: 18ch;
		font-size: clamp(44px, 5.2vw, 80px);
		line-height: 0.92;
		font-weight: 600;
		letter-spacing: -0.04em;
		font-variation-settings: 'wdth' 80;
		text-wrap: balance;
	}
	.head .lede {
		margin-top: 26px;
		/* one column wide: the dek ends where column 2's text would */
		max-width: min(48ch, calc(50% - 0.5px));
	}
	.meta {
		grid-column: 3;
		padding-bottom: 40px;
	}
	.facts {
		margin-top: auto;
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 10px 24px;
		font-size: 11px;
		padding-top: 40px;
	}
	.facts div {
		display: contents;
	}
	.facts dt {
		color: var(--ink-3);
	}
	.facts dd {
		color: var(--ink);
	}

	.toc-b {
		grid-column: 1;
	}
	.stick {
		position: sticky;
		top: 28px;
		display: flex;
		flex-direction: column;
	}
	.toc {
		margin-top: 16px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		font-size: 13.5px;
		line-height: 1.3;
		color: var(--ink-2);
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
	.none {
		margin-top: 16px;
		font-size: 13.5px;
		line-height: 1.4;
		color: var(--ink-3);
		max-width: 26ch;
	}

	.body {
		grid-column: 2;
		padding-top: 44px;
		padding-bottom: 80px;
		container-type: inline-size;
	}
	/* in one third of the page: a slightly smaller face so the column holds a fair line */
	.body .prose {
		font-size: 16.5px;
		--measure: none;
	}
	/* code bleeds across the rule into the margin column, to column 3's text edge, and sits
	   over the margin as it scrolls past */
	.body .prose :global(pre) {
		position: relative;
		z-index: 2;
		margin-right: calc(-100cqw - 2 * var(--pad) - 1px);
		font-size: 12.5px;
		padding: 16px 18px;
	}

	.rail {
		grid-column: 3;
		/* clip, not hidden: hidden would make a scroll box and break the sticky margin */
		overflow: clip;
	}
	.rail .h:not(:first-child) {
		margin-top: 36px;
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
	.pnl {
		margin-top: 12px;
		font-size: 16px;
		font-weight: 500;
		letter-spacing: -0.015em;
		line-height: 1.25;
		text-wrap: balance;
	}
	span.pnl {
		font-size: 14px;
		font-weight: 400;
	}
	a.pnl:hover {
		text-decoration: underline;
		text-underline-offset: 4px;
		text-decoration-thickness: 1px;
	}
	.more {
		margin-top: 12px;
		display: flex;
		flex-wrap: wrap;
		gap: 8px 20px;
		font-size: 11px;
		color: var(--ink-3);
	}
	.papers {
		right: 30px;
		bottom: 0;
	}

	.pn {
		display: none;
		min-height: 150px;
	}
	.pn > a:not(.edit),
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
	.pn > a:not(.edit):hover {
		text-decoration: underline;
		text-underline-offset: 4px;
		text-decoration-thickness: 1px;
	}
	.edit {
		margin-top: auto;
		padding-top: 18px;
		font-size: 11px;
		color: var(--ink-3);
		align-self: flex-start;
	}

	@media (max-width: 1299px) {
		.body {
			grid-column: 2 / -1;
		}
		.body .prose {
			font-size: 18px;
			--measure: 36em;
		}
		.body .prose :global(pre) {
			margin-right: 0;
			font-size: 13px;
			padding: 18px 22px;
		}
		.rail {
			display: none;
		}
		.pn {
			display: flex;
		}
	}
	@media (max-width: 760px) {
		.head,
		.meta,
		.body,
		.pn {
			grid-column: 1 / -1;
		}
		.head {
			padding-bottom: 28px;
		}
		.meta {
			padding-block: 20px;
		}
		.meta .h {
			display: none;
		}
		.facts {
			margin-top: 0;
			padding-top: 0;
		}
		.head .lede {
			max-width: none;
		}
		.toc-b {
			display: none;
		}
		h1 {
			margin-top: 48px;
			font-size: 42px;
		}
		.pn {
			min-height: 0;
		}
		.body {
			padding-top: 28px;
		}
		.body .prose {
			font-size: 17.5px;
		}
	}
</style>
