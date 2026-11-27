<script lang="ts">
	import Shell from '$lib/components/Shell.svelte';
	import { low } from '$lib/site.ts';

	let { data } = $props();
	const dotted = (d: string) => d.slice(0, 7).replace('-', '.');
	const host = (u: string) => (u.includes('youtu') ? 'youtube' : new URL(u).hostname.replace('www.', ''));
</script>

<Shell
	here="/speaking"
	title="talks · puru vijayvargia"
	description="talks and podcasts by puru: svelte summit, react india, svelte radio and more."
	md="/speaking.md"
>
	<header class="b intro">
		<div class="h"><span><span class="n">01</span>talks</span></div>
		<h1 class="display">talks</h1>
		<p class="lede">on stage and on air. mostly svelte, sometimes react, always about making the web lighter.</p>
	</header>
	<aside class="b count">
		<div class="h"><span><span class="n">02</span>so far</span></div>
		<dl>
			<div><dt class="num">{data.talks.length}</dt><dd>talks</dd></div>
			<div><dt class="num">{data.podcasts.length}</dt><dd>podcasts</dd></div>
		</dl>
		<i class="clay mic" aria-hidden="true"></i>
	</aside>

	{#each [{ n: '03', name: 'on stage', list: data.talks }, { n: '04', name: 'on air', list: data.podcasts }] as group (group.n)}
		<section class="b list">
			<div class="side">
				<div class="h"><span><span class="n">{group.n}</span>{group.name}</span></div>
			</div>
			<ol>
				{#each group.list as t (t.id)}
					<li>
						<a href={t.url}>
							<time class="mono" datetime={t.date}>{dotted(t.date)}</time>
							<span class="t">{low(t.title)}</span>
							<span class="ev">{low(t.event)}</span>
							<span class="go mono">{host(t.url)} ↗</span>
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
	.count dl {
		margin-top: auto;
		display: flex;
		gap: 40px;
	}
	.count dt {
		font-size: 72px;
		line-height: 0.9;
		font-weight: 600;
		letter-spacing: -0.04em;
		font-variation-settings: 'wdth' 80;
	}
	.count dd {
		margin-top: 8px;
		font-family: var(--mono);
		font-size: 11px;
		color: var(--ink-3);
	}
	.mic {
		right: 36px;
		bottom: 0;
	}

	.list {
		grid-column: 1 / -1;
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
		column-gap: calc(var(--pad) + 0.5px);
		padding-block: 26px 30px;
	}
	.list li + li {
		border-top: 1px solid var(--hair);
	}
	.list a {
		display: grid;
		grid-template-columns: 64px minmax(0, 1.3fr) minmax(0, 1fr) 90px;
		gap: 18px;
		align-items: baseline;
		padding: 12px 0;
	}
	.list li:first-child a {
		padding-top: 0;
	}
	.list time,
	.go {
		font-size: 11px;
		color: var(--ink-3);
	}
	.go {
		text-align: right;
	}
	.t {
		font-size: 18px;
		font-weight: 500;
		letter-spacing: -0.02em;
		line-height: 1.2;
	}
	.ev {
		font-size: 14px;
		color: var(--ink-2);
	}
	.list a:hover .t {
		text-decoration: underline;
		text-underline-offset: 4px;
		text-decoration-thickness: 1px;
	}
	.list a:hover .go {
		color: var(--ink);
	}

	@media (max-width: 760px) {
		.intro,
		.count {
			grid-column: 1 / -1;
		}
		.count {
			min-height: 200px;
		}
		.intro h1 {
			margin-top: 56px;
		}
		.list {
			grid-template-columns: 1fr;
		}
		.side {
			margin-bottom: 16px;
		}
		.list a {
			grid-template-columns: 60px minmax(0, 1fr);
			row-gap: 4px;
		}
		.ev {
			grid-column: 2;
		}
		.go {
			display: none;
		}
	}
</style>
