<script lang="ts">
	import Shell from '#lib/components/Shell.svelte';
	import { CAREER, span } from '#lib/career.ts';

	// the axis under every row: 2021 to the end of this year
	const now = new Date();
	const A = Date.UTC(2021, 0, 1);
	const B = Date.UTC(now.getUTCFullYear() + 1, 0, 1);
	const at = (ym: string | null) => {
		const t = ym ? Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7) - 1, 1) : now.getTime();
		return ((t - A) / (B - A)) * 100;
	};
	const years = Array.from({ length: now.getUTCFullYear() - 2021 + 1 }, (_, i) => 2021 + i);
	const months = (j: (typeof CAREER)[number]) => {
		const [y1, m1] = j.from.split('-').map(Number);
		const end = j.to ? j.to.split('-').map(Number) : [now.getUTCFullYear(), now.getUTCMonth() + 1];
		const n = (end[0] - y1) * 12 + (end[1] - m1) + 1;
		return n < 12 ? `${n} mo` : `${Math.floor(n / 12)} yr${n % 12 ? ` ${n % 12} mo` : ''}`;
	};
</script>

<Shell
	here="/career"
	title="career · puru vijayvargia"
	description="where i've worked: schneider electric, the svelte team, beyonk, clockwork labs, stackblitz and more."
	md="/career.md"
>
	<header class="b intro">
		<div class="h">
			<span>career</span>
			<a href="/resume.pdf">resume.pdf ↗</a>
		</div>
		<h1 class="display">career</h1>
		<p class="lede">
			frontend all the way down. product teams, developer tools, a database company, and the svelte
			team on the side since 2023.
		</p>
	</header>
	<aside class="b note">
		<div class="h"><span>now</span></div>
		<p class="now">
			<b>{CAREER[0].org}</b>, {CAREER[0].role}.<br />still on the <b>svelte team</b>.
		</p>
		<a class="pdf" href="/resume.pdf">the long version, as a pdf ↗</a>
		<i class="clay papers" aria-hidden="true"></i>
	</aside>

	<section class="b jobs">
		<div class="row axis" aria-hidden="true">
			<span class="h"><span>jobs</span></span>
			<div class="track">
				{#each years as y (y)}<span style="left: {at(`${y}-01`)}%">{y}</span>{/each}
			</div>
		</div>
		<ol>
			{#each CAREER as j, i (j.org)}
				<li class="row">
					<div class="who">
						<span class="i mono">{String(i + 1).padStart(2, '0')}</span>
						<span class="org">{#if j.href}<a href={j.href}>{j.org}</a>{:else}{j.org}{/if}</span>
						<span class="role">{j.role}{#if j.note}<span class="dim">&nbsp;·&nbsp;{j.note}</span>{/if}</span>
					</div>
					<div class="when mono"><span>{span(j)}</span><span class="dim">{months(j)}</span></div>
					<div class="track" aria-hidden="true">
						{#each years as y (y)}<i style="left: {at(`${y}-01`)}%"></i>{/each}
						<b class:open={!j.to} style="left: {at(j.from)}%; width: {at(j.to) - at(j.from)}%"></b>
					</div>
				</li>
			{/each}
		</ol>
	</section>
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
		max-width: 44ch;
	}
	.note {
		overflow: hidden;
	}
	.now {
		margin-top: auto;
		font-size: 22px;
		line-height: 1.25;
		letter-spacing: -0.02em;
		color: var(--ink-2);
	}
	.now b {
		font-weight: 500;
		color: var(--ink);
	}
	.pdf {
		margin-top: 18px;
		font-family: var(--mono);
		font-size: 11px;
		color: var(--ink-3);
		align-self: flex-start;
	}
	.pdf:hover {
		color: var(--ink);
	}
	.papers {
		right: 30px;
		bottom: 0;
	}

	.jobs {
		grid-column: 1 / -1;
		padding-top: 26px;
	}
	.row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 150px minmax(0, 1.15fr);
		gap: 28px;
		align-items: center;
	}
	.axis {
		padding-bottom: 14px;
		border-bottom: 1px solid var(--ink);
	}
	.axis .h {
		grid-column: 1 / 3;
	}
	.axis .track span {
		position: absolute;
		top: 0;
		font-family: var(--mono);
		font-size: 10.5px;
		color: var(--ink-3);
		transform: translateX(-50%);
	}
	.axis .track span:first-child {
		transform: none;
	}
	.axis .track {
		height: 14px;
	}
	ol .row {
		padding: 18px 0;
		border-bottom: 1px solid var(--hair);
	}
	ol .row:last-child {
		border-bottom: 0;
		padding-bottom: 4px;
	}
	.who {
		display: grid;
		grid-template-columns: 34px minmax(0, 1fr);
		row-gap: 4px;
		align-items: baseline;
	}
	.i {
		font-size: 10.5px;
		color: var(--ink-3);
	}
	.org {
		font-size: 26px;
		font-weight: 600;
		letter-spacing: -0.035em;
		line-height: 1;
		font-variation-settings: 'wdth' 85;
	}
	.org a:hover {
		text-decoration: underline;
		text-underline-offset: 4px;
		text-decoration-thickness: 1px;
	}
	.role {
		grid-column: 2;
		font-size: 14px;
		color: var(--ink-2);
	}
	.when {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 11px;
	}
	.track {
		position: relative;
		height: 18px;
	}
	.track i {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 1px;
		background: var(--hair);
	}
	.track b {
		position: absolute;
		top: 6px;
		height: 6px;
		background: var(--ink);
	}
	/* still going: the bar runs off into a fade */
	.track b.open {
		background: linear-gradient(to right, var(--ink) 70%, transparent);
	}

	@media (max-width: 760px) {
		.intro,
		.note {
			grid-column: 1 / -1;
		}
		.note {
			min-height: 220px;
		}
		.intro h1 {
			margin-top: 56px;
		}
		.row {
			grid-template-columns: 1fr auto;
			gap: 12px 16px;
		}
		.row .track {
			grid-column: 1 / -1;
		}
		.axis .h {
			grid-column: 1 / -1;
		}
		.org {
			font-size: 22px;
		}
	}
</style>
