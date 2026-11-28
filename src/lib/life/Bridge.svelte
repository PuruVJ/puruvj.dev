<script lang="ts">
	// an arch bridge in the same 1px line: a deck on posts over one arch, piers in the water
	const W = 420;
	const DECK = 34;
	const SPRING = 92; // where the arch meets the piers
	const L = 60;
	const R = 360;
	const RISE = 50;
	const arch = (x: number) => SPRING - RISE * (1 - ((2 * (x - L)) / (R - L) - 1) ** 2);
	const posts = Array.from({ length: 13 }, (_, i) => L + ((i + 1) * (R - L)) / 14);
	const f = (n: number) => +n.toFixed(2);
	const curve = Array.from({ length: 41 }, (_, i) => {
		const x = L + (i * (R - L)) / 40;
		return `${f(x)} ${f(arch(x))}`;
	}).join('L');
	const under = Array.from({ length: 41 }, (_, i) => {
		const x = L + 8 + (i * (R - L - 16)) / 40;
		return `${f(x)} ${f(arch(x) + 7)}`;
	}).join('L');
</script>

<svg class="bridge" viewBox="0 0 {W} 120" fill="none" aria-hidden="true">
	<path class="main" d="M0 {DECK}H{W}M0 {DECK + 5}H{W}" />
	<path class="main" d="M{curve}" />
	<path class="fine" d="M{under}" />
	{#each posts as x (x)}
		<path class="fine" d="M{f(x)} {DECK + 5}V{f(arch(x))}" />
	{/each}
	<!-- the piers and abutments, standing in water -->
	<path class="main" d="M{L - 14} {DECK + 5}V112M{L} {SPRING}V112M{R} {SPRING}V112M{R + 14} {DECK + 5}V112" />
	<path class="main" d="M{L - 14} {SPRING}H{L}M{R} {SPRING}H{R + 14}" />
	<path class="fine" d="M0 104H{L - 22}M{L + 10} 104H{R - 10}M{R + 22} 104H{W}" />
	<path class="hair" d="M30 112H{L - 24}M{L + 40} 112H{R - 60}M{R + 30} 112H{W - 20}" />
</svg>

<style>
	.bridge {
		display: block;
		width: 100%;
		height: auto;
		color: var(--ink);
	}
	path {
		vector-effect: non-scaling-stroke;
		stroke-width: 1px;
		stroke-linecap: round;
	}
	.main {
		stroke: currentColor;
	}
	.fine {
		stroke: var(--ink-2);
		opacity: 0.8;
	}
	.hair {
		stroke: var(--ink-3);
		opacity: 0.6;
	}
</style>
