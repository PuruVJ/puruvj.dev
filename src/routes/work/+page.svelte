<script lang="ts">
	import { Region } from 'ogygia';
	import Shell from '$lib/components/Shell.svelte';
	import { short } from '$lib/numbers.ts';

	let { data } = $props();
	const host = (u: string) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
	const pad = (n: number) => String(n).padStart(2, '0');
</script>

<Shell
	here="/work"
	title="work · puru vijayvargia"
	description="puru's projects: ogygia, neosanitize, heisenbench, neotraverse, neodrag, neoconfetti, macos web and more."
	md="/work.md"
>
	<header class="b intro">
		<div class="h"><span><span class="n">01</span>work</span><a href="/stats">stats →</a></div>
		<h1 class="display">work</h1>
		<p class="lede">small libraries with large download counts, a few sites, and one framework.</p>
	</header>
	<aside class="b totals">
		<div class="h"><span><span class="n">02</span>all time</span></div>
		<dl>
			<div>
				<dt class="num">{data.total ? short(data.total) : '–'}</dt>
				<dd>npm downloads, every package</dd>
			</div>
			<div>
				<dt class="num">{data.stars ? short(data.stars) : '–'}</dt>
				<dd>github stars</dd>
			</div>
		</dl>
	</aside>

	{#each data.items as p, i (p.slug)}
		<article class="b proj" class:lead={i < 3}>
			<div class="h">
				<span><span class="n">{pad(i + 3)}</span>{p.started.slice(0, 4)}</span>
				<a href={p.url}>{host(p.url)} ↗</a>
			</div>
			<h2><a href={p.url}>{p.title}</a></h2>
			<p class="tag">{p.tagline}</p>
			{#if p.body}
				<div class="desc"><Region of={p.body} /></div>
			{/if}
			<div class="foot">
				<dl class="nums">
					{#if p.downloads}
						<div><dt class="num">{short(p.downloads)}</dt><dd>downloads</dd></div>
					{/if}
					{#if p.stars}
						<div><dt class="num">{short(p.stars)}</dt><dd>stars</dd></div>
					{/if}
				</dl>
				<p class="stack mono">{p.stack.replaceAll(',', ' ·')}</p>
				<div class="links mono">
					<a href={p.repo.url}>source ↗</a>
					{#if p.npm}<a href={p.npm}>npm ↗</a>{/if}
				</div>
			</div>
		</article>
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
	.totals dl {
		margin-top: auto;
		display: flex;
		flex-direction: column;
		gap: 22px;
	}
	.totals dt {
		font-size: 64px;
		line-height: 0.9;
		font-weight: 600;
		letter-spacing: -0.045em;
		font-variation-settings: 'wdth' 80;
	}
	.totals dd {
		margin-top: 8px;
		font-family: var(--mono);
		font-size: 11px;
		color: var(--ink-3);
	}

	.proj {
		min-height: 400px;
	}
	.proj h2 {
		margin-top: 56px;
		font-size: 40px;
		line-height: 0.95;
		font-weight: 600;
		letter-spacing: -0.04em;
		font-variation-settings: 'wdth' 80;
	}
	.proj h2 a:hover {
		text-decoration: underline;
		text-underline-offset: 5px;
		text-decoration-thickness: 1.5px;
	}
	.tag {
		margin-top: 10px;
		font-size: 17px;
		letter-spacing: -0.015em;
		color: var(--ink-2);
	}
	.desc {
		margin-top: 18px;
		font-size: 14px;
		line-height: 1.5;
		color: var(--ink-3);
		max-width: 46ch;
	}
	.desc :global(a) {
		text-decoration: underline;
		text-underline-offset: 3px;
		text-decoration-thickness: 1px;
	}
	.desc :global(code) {
		font-family: var(--mono);
		font-size: 0.85em;
	}
	.desc :global(p + p) {
		margin-top: 0.6em;
	}
	.foot {
		margin-top: auto;
		padding-top: 28px;
	}
	.nums {
		display: flex;
		gap: 36px;
		margin-bottom: 18px;
	}
	.nums dt {
		font-size: 30px;
		font-weight: 600;
		letter-spacing: -0.035em;
		line-height: 1;
		font-variation-settings: 'wdth' 85;
	}
	.nums dd {
		margin-top: 5px;
		font-family: var(--mono);
		font-size: 10.5px;
		color: var(--ink-3);
	}
	.stack {
		padding-top: 14px;
		border-top: 1px solid var(--hair);
		font-size: 10.5px;
		color: var(--ink-3);
	}
	.links {
		margin-top: 8px;
		display: flex;
		gap: 18px;
		font-size: 11px;
		color: var(--ink-2);
	}
	.links a:hover,
	.h a:hover {
		color: var(--ink);
	}

	@media (max-width: 760px) {
		.intro,
		.totals,
		.proj {
			grid-column: 1 / -1;
		}
		.intro h1 {
			margin-top: 56px;
		}
		.totals {
			min-height: 220px;
		}
		.proj {
			min-height: 0;
		}
		.proj h2 {
			margin-top: 36px;
		}
	}
</style>
