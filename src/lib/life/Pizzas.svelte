<script lang="ts">
	import { Img, type ImageDescriptor } from '@ogygia/image';

	// neapolitan pizzas, pinned to a line like prints drying in a darkroom: a wire sags across the
	// page and each photo hangs off it on a wooden peg, a little crooked. more than five and a
	// second line starts below. to add one, add a file to src/lib/life and a line to PIZZAS.
	const PIZZAS: { of: ImageDescriptor; alt: string }[] = [
		{ of: import.meta.og.image('./pizza-1.jpg'), alt: 'a margherita in its box, leopard-spotted crust, basil on top' },
		{ of: import.meta.og.image('./pizza-2.jpg'), alt: 'a pizza with rounds of goat cheese, at a café table' },
		{ of: import.meta.og.image('./pizza-3.jpg'), alt: 'a pizza of grilled aubergine, courgette, peppers and two chillies' },
	];

	const PER = 5;
	const rows = Array.from({ length: Math.ceil(PIZZAS.length / PER) }, (_, i) => PIZZAS.slice(i * PER, i * PER + PER));
	// seeded tilt, so each print hangs crooked the same way every time
	const tilt = (i: number) => +(Math.sin(i * 12.9898) * 3.2).toFixed(2);
	// where the wire is, 0..1 across: it sags in the middle, SAG px at its lowest
	const SAG = 34;
	const sag = (x: number) => SAG * (1 - (2 * x - 1) ** 2);
	// the prints sit evenly along the wire, away from its ends
	const at = (i: number, n: number) => (n === 1 ? 0.5 : 0.12 + (i * 0.76) / (n - 1));
	const f = (n: number) => +n.toFixed(2);
	const wire = 'M0 6' + Array.from({ length: 41 }, (_, i) => `L${f(i * 25)} ${f(6 + sag(i / 40))}`).join('');
</script>

{#each rows as row, r (r)}
	<div class="line">
		<svg class="wire" viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true">
			<path d={wire} />
		</svg>
		<span class="nail l" aria-hidden="true"></span>
		<span class="nail r" aria-hidden="true"></span>
		<ul>
			{#each row as p, i (p.of)}
				{@const x = at(i, row.length)}
				<li style="left: {x * 100}%; top: {f(6 + sag(x))}px; --r: {tilt(r * PER + i)}deg">
					<span class="peg" aria-hidden="true"></span>
					<div class="print"><Img of={p.of} alt={p.alt} aspect="3/4" width={300} layout="constrained" /></div>
				</li>
			{/each}
		</ul>
	</div>
{/each}

<style>
	.line {
		position: relative;
		height: 320px;
	}
	.line + .line {
		margin-top: 24px;
	}
	.wire {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 60px;
		overflow: visible;
	}
	.wire path {
		fill: none;
		stroke: var(--ink-2);
		stroke-width: 1px;
		vector-effect: non-scaling-stroke;
	}
	/* where the wire is tied off */
	.nail {
		position: absolute;
		top: 2px;
		width: 7px;
		height: 7px;
		border: 1px solid var(--ink-2);
		border-radius: 50%;
		background: var(--paper);
	}
	.nail.l {
		left: -3px;
	}
	.nail.r {
		right: -3px;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	li {
		position: absolute;
		width: clamp(120px, 15%, 200px);
		translate: -50% 0;
		/* it hangs from the peg, so it turns about the peg */
		transform-origin: 50% 0;
		rotate: var(--r);
	}
	/* a wooden peg in line: two jaws and a spring */
	.peg {
		position: absolute;
		left: 50%;
		top: -9px;
		width: 9px;
		height: 26px;
		translate: -50% 0;
		z-index: 2;
		border: 1px solid var(--ink-2);
		border-radius: 2px;
		background:
			linear-gradient(var(--ink-3), var(--ink-3)) 50% 0 / 1px 100% no-repeat,
			var(--paper);
	}
	.peg::after {
		content: '';
		position: absolute;
		left: -3px;
		right: -3px;
		top: 9px;
		height: 3px;
		border: 1px solid var(--ink-2);
		border-radius: 2px;
		background: var(--paper);
	}
	.print {
		margin-top: 2px;
		padding: 7px 7px 22px;
		background: var(--print, #fbfaf7);
		box-shadow: var(--shadow, 0 10px 26px -10px rgba(30, 28, 20, 0.28));
	}
	.print :global(img) {
		display: block;
		width: 100%;
		height: auto;
	}

	/* a phone: the line is short, so the prints get bigger and two to a row */
	@media (max-width: 1000px) {
		.line {
			height: auto;
			padding-top: 30px;
		}
		ul {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 28px 18px;
		}
		li {
			position: relative;
			left: auto !important;
			top: auto !important;
			width: auto;
			translate: none;
		}
	}
</style>
