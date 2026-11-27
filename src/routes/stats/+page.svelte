<script lang="ts">
	import Shell from '$lib/components/Shell.svelte';
	import { short, full } from '$lib/numbers.ts';
	import Graph from '$lib/stats/Graph.svelte' with { wake: 'visible' };

	let { data } = $props();
	const s = $derived(data.stats);
</script>

<Shell
	here="/stats"
	title="stats · puru vijayvargia"
	description="live numbers: all-time npm downloads, github stars and lines of code across my projects."
	md="/stats.md"
>
	<header class="b hero">
		<div class="h">
			<span><span class="n">01</span>npm downloads, all time</span>
			<span>{data.packages} packages</span>
		</div>
		<p class="big num">{s?.npm ? full(s.npm.total) : '–'}</p>
		<p class="lede">
			every download of every package i maintain on npm, since the very first one.
		</p>
		{#if data.graphs.npm}<Graph g={data.graphs.npm} />{/if}
	</header>

	<section class="b projects">
		<div class="h"><span><span class="n">02</span>by project</span></div>
		<ol>
			{#each data.rows as r (r.title)}
				<li>
					<a href={r.url} class="name">{r.title}</a>
					<span class="spark">{#if r.graph}<Graph g={r.graph} inline />{/if}</span>
					<span class="n2 num">{short(r.downloads ?? 0)}</span>
					<span class="exact mono num">{full(r.downloads ?? 0)}</span>
				</li>
			{/each}
		</ol>
	</section>

	<section class="b cell">
		<div class="h"><span><span class="n">03</span>github stars</span></div>
		<p class="mid num">{s?.github ? full(s.github.stars) : '–'}</p>
		<p class="sub mono">across {s?.github?.repos ?? '–'} repos</p>
		{#if data.graphs.stars}<Graph g={data.graphs.stars} />{/if}
	</section>
	<section class="b cell">
		<div class="h"><span><span class="n">04</span>lines written</span></div>
		<p class="mid num">{s?.code ? `+${short(s.code.additions)}` : '–'}</p>
		<p class="sub mono">
			{#if s?.code}−{short(s.code.deletions)} deleted, net {short(s.code.additions - s.code.deletions)}{/if}
		</p>
		{#if data.graphs.lines}<Graph g={data.graphs.lines} />{/if}
	</section>
	<section class="b cell">
		<div class="h"><span><span class="n">05</span>commits</span></div>
		<p class="mid num">{s?.code ? full(s.code.commits) : '–'}</p>
		<p class="sub mono">to my own repos</p>
		{#if data.graphs.commits}<Graph g={data.graphs.commits} />{/if}
	</section>
</Shell>

<style>
	/* the number and its words sit over the graph */
	.hero > :not(:global(.graph)),
	.cell > :not(:global(.graph)) {
		position: relative;
		z-index: 1;
	}
	.hero,
	.cell {
		overflow: clip;
	}
	.hero {
		grid-column: 1 / -1;
		padding-bottom: 36px;
	}
	.big {
		margin-top: 110px;
		font-size: clamp(64px, 8.4vw, 132px);
		line-height: 0.84;
		font-weight: 600;
		letter-spacing: -0.05em;
		font-variation-settings: 'wdth' 76;
		white-space: nowrap;
	}
	.hero .lede {
		margin-top: 26px;
		max-width: 46ch;
	}
	.projects {
		grid-column: 1 / -1;
		padding-bottom: 30px;
	}
	.projects ol {
		margin-top: 26px;
	}
	.projects li {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr) 110px 150px;
		gap: 28px;
		align-items: center;
		padding: 13px 0;
		border-top: 1px solid var(--hair);
	}
	.projects li:first-child {
		border-top-color: var(--ink);
	}
	.name {
		font-size: 24px;
		font-weight: 600;
		letter-spacing: -0.035em;
		font-variation-settings: 'wdth' 85;
	}
	.name:hover {
		text-decoration: underline;
		text-underline-offset: 4px;
		text-decoration-thickness: 1px;
	}
	/* each project's downloads over its own lifetime, first download to now */
	.spark {
		height: 40px;
		align-self: stretch;
		display: block;
	}
	.n2 {
		font-size: 24px;
		font-weight: 600;
		letter-spacing: -0.03em;
		text-align: right;
	}
	.exact {
		font-size: 11px;
		color: var(--ink-3);
		text-align: right;
	}

	.cell {
		min-height: 260px;
	}
	.mid {
		margin-top: auto;
		font-size: 64px;
		line-height: 0.9;
		font-weight: 600;
		letter-spacing: -0.045em;
		font-variation-settings: 'wdth' 80;
	}
	.sub {
		margin-top: 12px;
		font-size: 11px;
		color: var(--ink-3);
	}

	@media (max-width: 760px) {
		.hero,
		.cell {
			grid-column: 1 / -1;
		}
		.big {
			margin-top: 64px;
			font-size: 56px;
		}
		.projects li {
			grid-template-columns: minmax(0, 1fr) auto;
			gap: 8px 16px;
		}
		.spark {
			grid-column: 1 / -1;
			grid-row: 2;
		}
		.exact {
			display: none;
		}
		.cell {
			min-height: 200px;
		}
	}
</style>
