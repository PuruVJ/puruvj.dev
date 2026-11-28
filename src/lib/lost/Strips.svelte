<script lang="ts">
	import { tear } from './tear.ts';

	// the tear-off strips along the foot of the lost poster, like the phone numbers on a real one.
	// one is already gone: somebody got here first.
	let { strips }: { strips: ({ name: string; href: string } | null)[] } = $props();
</script>

<ul class="strips" aria-label="take one" {@attach tear}>
	{#each strips as s, i (i)}
		<li class:torn={!s}>
			{#if s}
				<a class="strip" href={s.href} draggable="false">
					<span class="t">{#if s.href === '/'}<b>puruvj.dev</b>{:else}puruvj.dev/<b>{s.href.slice(1)}</b>{/if}</span>
				</a>
			{/if}
		</li>
	{/each}
</ul>

<style>
	.strips {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: minmax(0, 1fr);
		gap: 2px;
		/* the poster's own paper, cut into strips: the perforation runs along the top */
		height: 136px;
		position: relative;
	}
	.strips::before {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		border-top: 1.5px dashed rgba(20, 20, 19, 0.35);
		z-index: 2;
		pointer-events: none;
	}
	li {
		position: relative;
		min-width: 0;
	}
	/* where a strip was: a ragged stub of paper and a gap */
	li.torn::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		height: 9px;
		background: var(--strip-paper);
		clip-path: polygon(0 0, 100% 0, 100% 62%, 88% 92%, 74% 48%, 61% 80%, 47% 38%, 33% 86%, 19% 52%, 8% 100%, 0 70%);
	}

	/* everything a strip needs is on the strip, so it looks the same once it falls loose of the poster */
	.strip {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		padding: 8px 0;
		transform-origin: 50% 0;
		background: var(--strip-paper, #ebe8df);
		color: #141413;
		font-family: var(--mono);
		font-size: 11.5px;
		letter-spacing: 0.01em;
		white-space: nowrap;
		overflow: hidden;
		cursor: grab;
		touch-action: pan-x pinch-zoom;
		user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
		box-shadow: 0 1px 1px rgba(0, 0, 0, 0.08);
		transition: transform 0.45s cubic-bezier(0.3, 1.6, 0.5, 1);
	}
	/* read from the bottom up, the way flyer strips are written */
	.t {
		writing-mode: vertical-rl;
		transform: rotate(180deg);
		line-height: 1;
		color: #3d3c38;
	}
	.t b {
		font-weight: 600;
		color: #141413;
	}
	.strip:active {
		cursor: grabbing;
	}
	/* a strip you point at lifts off the poster a hair, like loose paper does */
	.strip:hover {
		transform: rotate(-2deg) translateY(1px);
		box-shadow: 2px 4px 6px -3px rgba(0, 0, 0, 0.3);
	}
	.strip:focus-visible {
		outline: 1.5px solid #141413;
		outline-offset: -5px;
	}
	:global(.strip.loose) {
		pointer-events: none;
		box-shadow: 3px 10px 16px -6px rgba(0, 0, 0, 0.4) !important;
		--strip-paper: #ebe8df;
	}
	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-pref-theme='light']) .strip.loose) {
			--strip-paper: #9d9a91;
		}
	}
	:global(:root[data-pref-theme='dark'] .strip.loose) {
		--strip-paper: #9d9a91;
	}
	@media (prefers-reduced-motion: reduce) {
		.strip,
		.strip:hover {
			transition: none;
			transform: none;
		}
	}
	@media (max-width: 760px) {
		.strip {
			font-size: 10.5px;
		}
	}
</style>
