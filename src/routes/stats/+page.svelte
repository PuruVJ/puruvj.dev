<script lang="ts">
	import Shell from '$lib/components/Shell.svelte';
	import { short, full } from '$lib/numbers.ts';

	let { data } = $props();
	const s = $derived(data.stats);
	const max = $derived(Math.max(...data.rows.map((r) => r.downloads ?? 0), 1));
	const when = $derived(s ? new Date(s.fetchedAt) : null);
	const stamp = $derived(
		when ? `${when.toISOString().slice(0, 10).replaceAll('-', '.')} ${when.toISOString().slice(11, 16)} utc` : 'never',
	);
	// a log scale keeps 3.6k visible next to 389m
	const bar = (n: number) => (Math.log10(Math.max(n, 1)) / Math.log10(max)) * 100;
</script>

<Shell
	here="/stats"
	title="stats · puru vijayvargia"
	description="live numbers: all-time npm downloads, github stars and lines of code across puru's projects."
	md="/stats.md"
>
	<header class="b hero">
		<div class="h">
			<span><span class="n">01</span>npm downloads, all time</span>
			<span>{data.packages} packages</span>
		</div>
		<p class="big num">{s?.npm ? full(s.npm.total) : '–'}</p>
		<p class="lede">
			every download of every package puru maintains on npm, since the first one. counted again once a
			day.
		</p>
	</header>
	<aside class="b meta">
		<div class="h"><span><span class="n">02</span>how this works</span></div>
		<p>
			each build asks npm and github, then keeps the answer for a day so every deploy shares one count.
			if an api is down, the last good number stays.
		</p>
		<dl class="mono">
			<div><dt>counted</dt><dd>{stamp}</dd></div>
			<div><dt>sources</dt><dd>api.npmjs.org, api.github.com</dd></div>
		</dl>
	</aside>

	<section class="b projects">
		<div class="h"><span><span class="n">03</span>by project</span><span>log scale</span></div>
		<ol>
			{#each data.rows as r (r.title)}
				<li>
					<a href={r.url} class="name">{r.title}</a>
					<span class="track"><b style="width: {bar(r.downloads ?? 0)}%"></b></span>
					<span class="n2 num">{short(r.downloads ?? 0)}</span>
					<span class="exact mono num">{full(r.downloads ?? 0)}</span>
				</li>
			{/each}
		</ol>
	</section>

	<section class="b cell">
		<div class="h"><span><span class="n">04</span>github stars</span></div>
		<p class="mid num">{s?.github ? full(s.github.stars) : '–'}</p>
		<p class="sub mono">across {s?.github?.repos ?? '–'} repos, forks left out</p>
	</section>
	<section class="b cell">
		<div class="h"><span><span class="n">05</span>lines written</span></div>
		<p class="mid num">{s?.code ? `+${short(s.code.additions)}` : '–'}</p>
		<p class="sub mono">
			{#if s?.code}−{short(s.code.deletions)} deleted, net {short(s.code.additions - s.code.deletions)}{:else}needs a github token{/if}
		</p>
	</section>
	<section class="b cell">
		<div class="h"><span><span class="n">06</span>commits</span></div>
		<p class="mid num">{s?.code ? full(s.code.commits) : '–'}</p>
		<p class="sub mono">to puru's own repos, as counted by github</p>
	</section>
</Shell>

<style>
	.hero {
		grid-column: 1 / 3;
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
	.meta p {
		margin-top: auto;
		font-size: 15px;
		line-height: 1.5;
		color: var(--ink-2);
		max-width: 36ch;
	}
	.meta dl {
		margin-top: 22px;
		display: flex;
		flex-direction: column;
		gap: 10px;
		font-size: 11px;
	}
	.meta dt {
		color: var(--ink-3);
	}
	.meta dd {
		margin-top: 2px;
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
	.track {
		height: 10px;
		background: repeating-linear-gradient(to right, var(--hair) 0 1px, transparent 1px 10%);
		position: relative;
	}
	.track b {
		position: absolute;
		inset: 2px auto 2px 0;
		background: var(--ink);
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
		.meta,
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
		.track {
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
