<script lang="ts">
	import type { Snippet } from 'svelte';
	import Clock from './Clock.svelte' with { wake: 'idle' };
	import ThemeSwitch from './ThemeSwitch.svelte';
	import { NAV, ELSEWHERE, EMAIL } from '$lib/site.ts';

	let {
		here = '',
		title,
		description,
		md,
		children,
	}: { here?: string; title: string; description: string; md?: string; children: Snippet } = $props();
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	{#if md}<link rel="alternate" type="text/markdown" href={md} />{/if}
</svelte:head>

<div class="sheet page">
	<header class="b top-id">
		<a href="/" class="name">puru vijayvargia</a>
	</header>
	<nav class="b top-nav" aria-label="site">
		{#each NAV as item (item.href)}
			<a href={item.href} aria-current={here === item.href ? 'page' : undefined}>{item.name}</a>
		{/each}
	</nav>
	<div class="b top-meta">
		<Clock />
		<ThemeSwitch />
	</div>

	{@render children()}

	<footer class="b foot-mail">
		<div class="h"><span>say hi</span></div>
		<a class="mail hov" href="mailto:{EMAIL}">{EMAIL}</a>
	</footer>
	<div class="b foot-links">
		<div class="h"><span>elsewhere</span></div>
		<div class="links">
			{#each ELSEWHERE as l (l.href)}<a href={l.href}>{l.name}</a>{/each}
			<a href="/llms.txt">llms.txt</a>
		</div>
	</div>
	<div class="b foot-note">
		<div class="h"><span>colophon</span><span>© 2020 – {new Date().getFullYear()}</span></div>
		<p>
			plain html, a few islands. built with <a class="u" href="https://ogygiajs.dev">ogygia</a> on
			sveltekit. set in instrument sans and ibm plex mono.
		</p>
	</div>
</div>

<style>
	.page {
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
		min-height: 100vh;
		grid-auto-rows: auto;
		align-content: start;
	}
	.top-id,
	.top-nav,
	.top-meta {
		padding-block: 20px;
		flex-direction: row;
		align-items: baseline;
	}
	.name {
		font-size: 21px;
		font-weight: 600;
		letter-spacing: -0.035em;
		font-variation-settings: 'wdth' 80;
		line-height: 1;
	}
	.top-nav {
		gap: 26px;
		font-size: 15px;
		font-weight: 500;
		letter-spacing: -0.01em;
	}
	.top-nav a {
		color: var(--ink-2);
	}
	.top-nav a:hover,
	.top-nav a[aria-current] {
		color: var(--ink);
		text-decoration: underline;
		text-underline-offset: 5px;
		text-decoration-thickness: 1px;
	}
	.top-meta {
		justify-content: space-between;
		font-family: var(--mono);
		font-size: 11px;
		color: var(--ink-3);
		gap: 16px;
	}

	.foot-mail,
	.foot-links,
	.foot-note {
		padding-block: 24px 28px;
		align-self: end;
		height: 100%;
	}
	.mail {
		margin-top: 18px;
		font-size: 19px;
		font-weight: 500;
		letter-spacing: -0.02em;
		align-self: flex-start;
	}
	.links {
		margin-top: 20px;
		display: flex;
		flex-wrap: wrap;
		gap: 8px 20px;
		font-family: var(--mono);
		font-size: 11px;
		color: var(--ink-3);
	}
	.links a:hover {
		color: var(--ink);
	}
	.foot-note p {
		margin-top: 18px;
		font-size: 13px;
		line-height: 1.45;
		color: var(--ink-3);
		max-width: 38ch;
	}

	@media (max-width: 760px) {
		.page {
			grid-template-columns: minmax(0, 1fr) auto;
		}
		.top-id {
			grid-column: 1;
		}
		.top-meta {
			grid-column: 2;
			justify-content: flex-end;
		}
		.top-meta :global(.clock) {
			display: none;
		}
		.top-nav {
			grid-column: 1 / -1;
			grid-row: 2;
			gap: 18px;
			overflow-x: auto;
			padding-block: 14px;
		}
		.foot-mail,
		.foot-links,
		.foot-note {
			grid-column: 1 / -1;
		}
	}
</style>
