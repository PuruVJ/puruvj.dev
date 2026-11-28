<script lang="ts">
	import { page } from '$app/state';
	import { script } from 'ogygia';
	import Shell from '$lib/components/Shell.svelte';
	import Strips from '$lib/lost/Strips.svelte' with { wake: 'visible' };
	import { DM } from '$lib/site.ts';

	// a lost poster, taped up where the page should have been. the photo is my old face on this
	// site: a scared cat, upside down, and for years the line under it said the site was not hacked.
	let { status = page.status, path = page.url.pathname }: { status?: number; path?: string } = $props();
	const missing = $derived(status === 404);

	// null is a strip somebody already took
	const strips = [
		{ name: 'home', href: '/' },
		{ name: 'writing', href: '/writing' },
		null,
		{ name: 'work', href: '/work' },
		{ name: 'life', href: '/life' },
		{ name: 'talks', href: '/speaking' },
	];

	// 404.html is printed once, for every address that has no page, so the address on the poster
	// is filled in from the window before anything is painted
	const fill = script(() => {
		let p = location.pathname;
		try {
			p = decodeURIComponent(p);
		} catch {}
		document.querySelectorAll('[data-lost-path]').forEach((el) => (el.textContent = p));
	});
</script>

<Shell title="{status} · puru vijayvargia" description={missing ? 'nothing lives at this address.' : 'something broke on my side.'}>
	<section class="b wall">
		<div class="h">
			<span><span class="n">{status}</span>{missing ? 'not found' : 'something broke'}</span>
			<span class="where" data-lost-path>{path}</span>
		</div>

		<!-- an older poster, mostly torn away. it was the not-found page for years -->
		<div class="scrap" aria-hidden="true">
			<i class="tape"></i>
			<span>404 – not fou</span>
		</div>

		<!-- and where another one hung, until somebody took it: two bits of tape and the corners -->
		<div class="ghost" aria-hidden="true"><i class="bit"></i><i class="bit"></i><i class="tape"></i><i class="tape"></i></div>

		<article class="poster" aria-labelledby="lost-h">
			<i class="tape l" aria-hidden="true"></i>
			<i class="tape r" aria-hidden="true"></i>
			<div class="paper">
				<h1 id="lost-h">{missing ? 'lost' : 'broken'}</h1>
				<p class="sub">
					<b data-lost-path>{path}</b>
				</p>

				<label class="photo">
					<input type="checkbox" class="vh" />
					<span class="vh">turn the photo the right way up</span>
					<img src="/lost/cat.png" width="448" height="400" alt="a scared cat, photocopied, upside down" />
				</label>

				<p class="cap">
					{#if missing}
						this page doesn't exist.
					{:else}
						something broke on my side.
					{/if}
				</p>
				<p class="fine">
					<span class="was">*yes, the photo is upside down.</span><span class="now">*there. the right way up. still scared.</span>
					*no, the site is not hacked.
				</p>
			</div>

			<Strips {strips} />
		</article>
		{@html fill}
	</section>

	<aside class="b side">
		<div class="h"><span>if found</span></div>
		<div class="found">
			<p class="lede">pull a strip to go somewhere that exists.</p>
			<ul>
				<li><a class="ln" href="/">home</a></li>
				<li><a class="ln" href="/writing">writing</a></li>
				<li><a class="ln" href="/work">work</a></li>
			</ul>
			<p class="note">
				a link on this site sent you here? <a class="u" href={DM}>drop me a dm on x</a> and i'll fix it.
			</p>
		</div>
	</aside>
</Shell>

<style>
	/* the poster's paper stays paper in the dark too, lit like a flyer under a street lamp, so its
	   ink is its own and not the page's */
	.wall {
		grid-column: 1 / 3;
		--tilt: -1.6deg;
		--p-ink: #141413;
		--p-ink-2: #4b4a45;
		--lamp: radial-gradient(120% 90% at 30% 0%, #fdfcf8, #f3f1ea 70%, #e9e6dc);
		--strip-paper: #ebe8df;
		--tape: rgba(222, 214, 190, 0.72);
		--cast: rgba(40, 36, 28, 0.3);
		overflow: hidden;
	}
	@media (prefers-color-scheme: dark) {
		:root:not([data-pref-theme='light'], [data-pref-theme='sunrise']) .wall {
			--lamp: radial-gradient(120% 90% at 30% 0%, #d9d6cc, #bdb9ae 60%, #8f8c83);
			--strip-paper: #9d9a91;
			--tape: rgba(170, 160, 130, 0.6);
			--cast: rgba(0, 0, 0, 0.75);
			--scrap-a: 0.45;
		}
	}
	:root:is([data-pref-theme='dark'], [data-pref-theme='sunset']) .wall {
		--lamp: radial-gradient(120% 90% at 30% 0%, #d9d6cc, #bdb9ae 60%, #8f8c83);
		--strip-paper: #9d9a91;
		--tape: rgba(170, 160, 130, 0.6);
		--cast: rgba(0, 0, 0, 0.75);
		--scrap-a: 0.45;
	}
	.where {
		max-width: 50%;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.poster {
		--pp: clamp(22px, 7cqi, 34px);
		container-type: inline-size;
		position: relative;
		z-index: 1;
		align-self: center;
		width: min(100%, 372px);
		margin: 30px auto 24px;
		color: var(--p-ink);
		transform: rotate(var(--tilt));
	}
	/* the printed part. the strips under it are cut loose, so the wall shows between them */
	.paper {
		padding: var(--pp) var(--pp) 18px;
		background: var(--lamp);
		/* lies flat in the middle and lifts a little at the bottom corners (the shadows below) */
		box-shadow:
			0 1px 1px rgba(0, 0, 0, 0.12),
			0 2px 6px -2px var(--cast);
	}
	.poster::before,
	.poster::after {
		content: '';
		position: absolute;
		z-index: -1;
		bottom: 18px;
		width: 46%;
		height: 30%;
		box-shadow: 0 16px 18px var(--cast);
	}
	.poster::before {
		left: 8px;
		transform: skew(-6deg) rotate(-4deg);
	}
	.poster::after {
		right: 8px;
		transform: skew(6deg) rotate(4deg);
	}

	/* masking tape: see-through, crinkled at the torn ends */
	.tape {
		position: absolute;
		top: -15px;
		width: 92px;
		height: 30px;
		background:
			repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.12) 0 2px, transparent 2px 7px),
			var(--tape);
		box-shadow: 0 1px 1px rgba(0, 0, 0, 0.06);
		clip-path: polygon(3% 0, 97% 4%, 100% 22%, 96% 40%, 100% 62%, 97% 100%, 4% 96%, 0 78%, 4% 55%, 0 30%);
		z-index: 3;
	}
	.tape.l {
		left: 22px;
		transform: rotate(-7deg);
	}
	.tape.r {
		right: 18px;
		transform: rotate(5deg);
	}

	h1 {
		font-size: 32cqi;
		line-height: 0.74;
		font-weight: 700;
		letter-spacing: -0.065em;
		font-variation-settings: 'wdth' 75;
		margin: 0.04em 0 0 -0.05em;
	}
	.sub {
		margin-top: 16px;
		font-family: var(--mono);
		font-size: 12px;
		line-height: 1.45;
		color: var(--p-ink-2);
	}
	.sub b {
		font-weight: 600;
		color: var(--p-ink);
		overflow-wrap: anywhere;
	}

	/* the photo: printed straight onto the paper by a tired photocopier. tap it to turn it */
	.photo {
		display: block;
		margin-top: 14px;
		cursor: pointer;
		position: relative;
	}
	.photo img {
		display: block;
		width: 100%;
		height: auto;
		/* ink on paper: the dots darken the paper under them and never cover it */
		mix-blend-mode: multiply;
		opacity: 0.93;
		transition: transform 0.7s cubic-bezier(0.5, 1.5, 0.5, 1);
	}
	.photo:has(:checked) img {
		transform: rotate(180deg);
	}
	.photo:has(:focus-visible) {
		outline: 1.5px solid var(--p-ink);
		outline-offset: 4px;
	}
	.cap {
		margin-top: 14px;
		font-size: 16.5px;
		line-height: 1.25;
		letter-spacing: -0.012em;
		text-wrap: pretty;
	}
	.fine {
		margin-top: 10px;
		font-family: var(--mono);
		font-size: 10.5px;
		line-height: 1.5;
		color: var(--p-ink-2);
	}
	.fine span {
		display: block;
	}
	.fine .now,
	.poster:has(.photo :checked) .fine .was {
		display: none;
	}
	.poster:has(.photo :checked) .fine .now {
		display: block;
	}

	/* what is left of an older poster: a corner under a strip of tape */
	.scrap {
		position: absolute;
		top: 168px;
		left: -14px;
		width: 168px;
		height: 74px;
		background: var(--lamp);
		color: var(--p-ink);
		transform: rotate(4deg);
		clip-path: polygon(0 0, 100% 0, 96% 22%, 100% 38%, 88% 54%, 92% 70%, 70% 84%, 52% 78%, 34% 100%, 18% 86%, 0 100%);
		opacity: var(--scrap-a, 0.8);
		overflow: hidden;
		filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.15));
	}
	.scrap span {
		position: absolute;
		left: 24px;
		top: 14px;
		font-size: 34px;
		font-weight: 600;
		letter-spacing: -0.05em;
		font-variation-settings: 'wdth' 80;
		white-space: nowrap;
	}
	.scrap .tape {
		top: -6px;
		left: 44px;
		width: 70px;
		height: 22px;
		transform: rotate(-3deg);
	}

	.ghost {
		position: absolute;
		top: 92px;
		right: 7%;
		width: 210px;
		transform: rotate(2.5deg);
		opacity: var(--scrap-a, 0.8);
	}
	.ghost .tape {
		top: 0;
		width: 64px;
		height: 24px;
	}
	.ghost .tape:nth-child(3) {
		left: 0;
		transform: rotate(-12deg);
	}
	.ghost .tape:nth-child(4) {
		right: 0;
		transform: rotate(8deg);
	}
	/* a torn-off corner of paper still stuck under each */
	.ghost .bit {
		position: absolute;
		top: 4px;
		width: 46px;
		height: 30px;
		background: var(--lamp);
		filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.12));
	}
	.ghost .bit:first-child {
		left: 10px;
		clip-path: polygon(0 0, 100% 0, 78% 38%, 62% 30%, 40% 72%, 22% 58%, 0 100%);
	}
	.ghost .bit:nth-child(2) {
		right: 8px;
		clip-path: polygon(0 0, 100% 0, 100% 90%, 84% 64%, 70% 80%, 50% 34%, 28% 46%);
	}

	.side .found {
		margin-top: auto;
		display: flex;
		flex-direction: column;
		gap: 22px;
	}
	.side .lede {
		max-width: 26ch;
	}
	.side ul {
		display: flex;
		gap: 22px;
		font-size: 17px;
		font-weight: 500;
		letter-spacing: -0.01em;
	}
	.note {
		font-size: 13px;
		line-height: 1.45;
		color: var(--ink-3);
		max-width: 34ch;
	}

	@media (prefers-reduced-motion: reduce) {
		.photo img {
			transition: none;
		}
	}
	@media (max-width: 760px) {
		.wall,
		.side {
			grid-column: 1 / -1;
		}
		.poster {
			margin: 44px auto 28px;
			width: min(100%, 360px);
		}
		.scrap,
		.ghost {
			display: none;
		}
	}
</style>
