<script lang="ts">
	import Shell from '$lib/components/Shell.svelte';
	import { low, md } from '$lib/site.ts';

	let { data } = $props();
	const minutes = $derived(data.years.flatMap(([, ps]) => ps).reduce((n, p) => n + p.minutes, 0));
</script>

<Shell
	here="/blog"
	title="writing · puru vijayvargia"
	description="everything i've written about the web, svelte, typescript and life, since 2020."
	md="/blog.md"
>
	<header class="b intro">
		<div class="h"><span><span class="n">01</span>writing</span><a href="/rss.xml">rss ↗</a></div>
		<h1 class="display">writing</h1>
		<p class="lede">
			notes from building things for the web. svelte, typescript, small libraries, and now and then
			life.
		</p>
		<dl class="facts mono">
			<div><dt>posts</dt><dd class="num">{data.count}</dd></div>
			<div><dt>since</dt><dd>{data.first.slice(0, 4)}</dd></div>
			<div><dt>reading, all of it</dt><dd class="num">{Math.round(minutes / 60)} hours</dd></div>
		</dl>
	</header>

	<aside class="b series">
		<div class="h"><span><span class="n">02</span>series</span></div>
		<ul>
			{#each data.series as s (s.key)}
				<li>
					<a href="/blog/{s.first}"><span>{s.name}</span><span class="mono dim">{s.count} parts</span></a>
				</li>
			{/each}
		</ul>
	</aside>

	{#each data.years as [year, list], i (year)}
		<section class="b year">
			<div class="y">
				<div class="h"><span><span class="n">{String(i + 3).padStart(2, '0')}</span>{list.length} {list.length === 1 ? 'post' : 'posts'}</span></div>
				<h2>{year}</h2>
			</div>
			<ol>
				{#each list as p (p.slug)}
					<li>
						<a href="/blog/{p.slug}">
							<time class="mono" datetime={p.date}>{md(p.date)}</time>
							<span class="t">{low(p.title)}</span>
							<span class="m mono">{p.minutes} min</span>
						</a>
					</li>
				{/each}
			</ol>
		</section>
	{/each}
</Shell>

<style>
	.intro {
		grid-column: 1 / 3;
		padding-bottom: 36px;
	}
	.intro h1 {
		margin-top: 96px;
	}
	.intro .lede {
		margin-top: 22px;
		max-width: 40ch;
	}
	.facts {
		margin-top: 40px;
		display: flex;
		gap: 48px;
		font-size: 11px;
	}
	.facts dt {
		color: var(--ink-3);
	}
	.facts dd {
		margin-top: 4px;
	}

	.series ul {
		margin-top: auto;
		padding-top: 28px;
		display: flex;
		flex-direction: column;
	}
	.series li + li {
		border-top: 1px solid var(--hair);
	}
	.series a {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 16px;
		padding: 11px 0;
		font-size: 15px;
		font-weight: 500;
		letter-spacing: -0.01em;
	}
	.series a .mono {
		font-size: 10.5px;
		font-weight: 400;
		white-space: nowrap;
	}
	.series a:hover span:first-child {
		text-decoration: underline;
		text-underline-offset: 4px;
		text-decoration-thickness: 1px;
	}

	.year {
		grid-column: 1 / -1;
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
		/* lines the list up with the header's second column */
		column-gap: calc(var(--pad) + 0.5px);
		padding-block: 26px 30px;
	}
	.year h2 {
		margin-top: 14px;
		font-size: 56px;
		line-height: 0.9;
		font-weight: 600;
		letter-spacing: -0.04em;
		font-variation-settings: 'wdth' 80;
		color: var(--ink);
	}
	.year .y {
		position: sticky;
		top: calc(var(--top-h) + 24px);
		align-self: start;
	}
	.year ol {
		display: flex;
		flex-direction: column;
	}
	.year li + li {
		border-top: 1px solid var(--hair);
	}
	.year a {
		display: grid;
		grid-template-columns: 52px minmax(0, 1fr) auto;
		gap: 18px;
		align-items: baseline;
		padding: 10px 0;
	}
	.year li:first-child a {
		padding-top: 0;
	}
	.year time,
	.year .m {
		font-size: 11px;
		color: var(--ink-3);
	}
	.year .t {
		font-size: 18px;
		font-weight: 500;
		letter-spacing: -0.02em;
		line-height: 1.2;
		text-wrap: balance;
	}
	.year a:hover .t {
		text-decoration: underline;
		text-underline-offset: 4px;
		text-decoration-thickness: 1px;
	}

	@media (max-width: 760px) {
		.intro,
		.series {
			grid-column: 1 / -1;
		}
		.intro h1 {
			margin-top: 56px;
		}
		.facts {
			gap: 28px;
		}
		.year {
			grid-template-columns: 1fr;
		}
		.year .y {
			position: static;
			margin-bottom: 18px;
		}
		.year h2 {
			font-size: 44px;
		}
		.year a {
			grid-template-columns: 44px minmax(0, 1fr);
		}
		.year .m {
			display: none;
		}
		.year .t {
			font-size: 17px;
		}
	}
</style>
