<script lang="ts">
	import type { Snippet } from 'svelte';
	import Clock from './Clock.svelte' with { wake: 'idle' };
	import ThemeSwitch from './ThemeSwitch.svelte';
	import Shelf from '$lib/toys/Shelf.svelte' with { wake: 'idle' };
	import { NAV, ELSEWHERE, DM } from '$lib/site.ts';

	let {
		here = '',
		title,
		description,
		md,
		reading = false,
		children,
	}: { here?: string; title: string; description: string; md?: string; reading?: boolean; children: Snippet } = $props();
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	{#if md}<link rel="alternate" type="text/markdown" href={md} />{/if}
</svelte:head>

<div class="sheet page" class:reading>
	<header class="b top-id">
		<a href="/" class="name">puru vijayvargia</a>
	</header>
	<nav class="b top-nav" aria-label="site">
		{#each NAV as item (item.href)}
			<a class="ln" href={item.href} aria-current={here === item.href ? 'page' : undefined}>{item.name}</a>
		{/each}
	</nav>
	<div class="b top-meta">
		<Clock />
		<ThemeSwitch />
	</div>

	<main class="main">{@render children()}</main>

	<!-- the toy shelf: its bottom edge is the rule above the footer -->
	<div class="b shelf"><Shelf /></div>

	<footer class="b foot-mail">
		<div class="h"><span>say hi</span></div>
		<a class="mail hov" href={DM}>drop me a dm on x</a>
	</footer>
	<div class="b foot-links">
		<div class="h"><span>elsewhere</span></div>
		<div class="links">
			{#each ELSEWHERE as l (l.href)}<a class="ln" href={l.href}>{l.name}</a>{/each}
			<a class="ln" href="/llms.txt">llms.txt</a>
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
	/* header, the page, footer. the page row takes whatever height is left, so a short page
	   still ends with the footer on the bottom edge of the window */
	.page {
		min-height: 100vh;
		min-height: 100dvh;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
		grid-template-rows: auto 1fr auto auto;
	}
	/* a page made for reading (a post): the middle column is twice as wide, header included,
	   so the text gets a real measure and every rule still lines up top to bottom */
	@media (min-width: 1300px) {
		.page.reading {
			grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr);
		}
	}
	/* the page's own blocks sit on the same three columns; when there is spare height, every
	   row of blocks grows a little, so the ruled lines run straight down to the footer */
	.main {
		grid-column: 1 / -1;
		display: grid;
		grid-template-columns: subgrid;
		grid-auto-rows: auto;
		align-content: stretch;
		gap: 1px;
		min-width: 0;
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
	.top-meta {
		justify-content: space-between;
		font-family: var(--mono);
		font-size: 11px;
		color: var(--ink-3);
		gap: 16px;
	}

	.shelf {
		grid-column: 1 / -1;
		padding: 0;
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
	.foot-note p {
		margin-top: 18px;
		font-size: 13px;
		line-height: 1.45;
		color: var(--ink-3);
		max-width: 38ch;
	}

	@media (min-width: 761px) and (max-width: 1100px) {
		.top-nav {
			gap: 16px;
			font-size: 14px;
		}
	}
	@media (max-width: 760px) {
		.page {
			grid-template-columns: minmax(0, 1fr) auto;
			grid-template-rows: auto auto 1fr;
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
