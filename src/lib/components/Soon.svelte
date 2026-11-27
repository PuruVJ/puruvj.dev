<script lang="ts">
	// "coming soon", with three small four-point stars twinkling around it. css only.
	// with reduced motion the stars just sit there.
	import type { Snippet } from 'svelte';
	let { children }: { children?: Snippet } = $props();
</script>

<span class="soon-sparkle">
	{#if children}{@render children()}{:else}coming soon{/if}
	{#each [1, 2, 3] as i (i)}
		<svg class="s s{i}" viewBox="0 0 10 10" aria-hidden="true">
			<path d="M5 0C5.4 3.2 6.8 4.6 10 5 6.8 5.4 5.4 6.8 5 10 4.6 6.8 3.2 5.4 0 5 3.2 4.6 4.6 3.2 5 0Z" />
		</svg>
	{/each}
</span>

<style>
	.soon-sparkle {
		position: relative;
		display: inline-block;
		padding-right: 0.15em;
	}
	.s {
		position: absolute;
		fill: currentColor;
		pointer-events: none;
	}
	.s1 {
		width: 0.62em;
		height: 0.62em;
		top: -0.42em;
		right: -0.55em;
	}
	.s2 {
		width: 0.36em;
		height: 0.36em;
		top: 0.1em;
		right: -0.95em;
		opacity: 0.7;
	}
	.s3 {
		width: 0.3em;
		height: 0.3em;
		bottom: -0.2em;
		right: -0.4em;
		opacity: 0.55;
	}
	@media (prefers-reduced-motion: no-preference) {
		.s {
			animation: twinkle 2.4s ease-in-out infinite;
			transform-origin: center;
		}
		.s2 {
			animation-delay: 0.8s;
		}
		.s3 {
			animation-delay: 1.5s;
		}
	}
	@keyframes twinkle {
		0%,
		100% {
			transform: scale(0.35) rotate(0deg);
			opacity: 0.15;
		}
		45% {
			transform: scale(1) rotate(45deg);
			opacity: 1;
		}
	}
</style>
