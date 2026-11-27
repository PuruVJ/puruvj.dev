<script lang="ts">
	import { page } from '$app/state';
	import Shell from '$lib/components/Shell.svelte';

	let { status = page.status, path = page.url.pathname }: { status?: number; path?: string } = $props();
	const name = $derived(
		path.replace(/^\/+|\/+$/g, '').replace(/[^a-z0-9_]+/gi, '_') || 'page',
	);
	const missing = $derived(status === 404);
</script>

<Shell title="{status} · puru vijayvargia" description="nothing lives at this address.">
	<section class="b err">
		<div class="h"><span><span class="n">{status}</span>{missing ? 'not found' : 'something broke'}</span><span>{path}</span></div>
		<div class="lean">
			<pre><code><span class="c">-- puruvj.dev/Pages.lean</span>
<b>theorem</b> page_exists : PuruVJ.routes.contains {name} := <b>by</b>
  exact <i>{name}</i>.mem_routes</code></pre>
			<pre class="out"><code><span class="e">error:</span> unknown identifier '<i>{name}</i>'
  {missing ? 'this page was never written, or it moved.' : 'the build proved something false. that is on me.'}</code></pre>
		</div>
		<p class="lede">
			{missing ? 'the proof does not go through.' : 'that went wrong.'} try
			<a class="u" href="/">home</a>, <a class="u" href="/blog">writing</a> or
			<a class="u" href="/work">work</a>.
		</p>
	</section>
	<aside class="b side">
		<div class="h"><span>hint</span></div>
		<p>
			a renamed post keeps its old address. if a link here is broken, tell me at
			<a class="u" href="mailto:devpuruvj@gmail.com">devpuruvj@gmail.com</a> and i will add the lemma.
		</p>
		<i class="clay banana" aria-hidden="true"></i>
	</aside>
</Shell>

<style>
	.err {
		grid-column: 1 / 3;
		/* fill the screen between the header and footer rows */
		min-height: calc(100vh - 2 * var(--sheet) - 182px);
	}
	.lean {
		margin-top: auto;
		padding-top: 64px;
		display: flex;
		flex-direction: column;
		gap: 1px;
		background: var(--hair);
		align-self: flex-start;
		max-width: 100%;
		border: 1px solid var(--hair);
	}
	pre {
		font-family: var(--mono);
		font-size: 15px;
		line-height: 1.7;
		padding: 22px 26px;
		background: var(--paper-2);
		overflow-x: auto;
	}
	.lean {
		padding-top: 0;
		margin-top: auto;
	}
	pre b {
		font-weight: 600;
	}
	pre i {
		font-style: italic;
	}
	.c {
		color: var(--ink-3);
		font-style: italic;
	}
	.out {
		background: var(--paper);
		color: var(--ink-2);
	}
	.e {
		color: var(--ink);
		font-weight: 600;
	}
	.err .lede {
		margin-top: 32px;
	}
	.side p {
		margin-top: auto;
		font-size: 15px;
		line-height: 1.5;
		color: var(--ink-2);
		max-width: 34ch;
		padding-bottom: 40px;
	}
	.banana {
		right: 30px;
		bottom: 0;
	}
	@media (max-width: 760px) {
		.err,
		.side {
			grid-column: 1 / -1;
		}
		pre {
			font-size: 12.5px;
		}
	}
</style>
