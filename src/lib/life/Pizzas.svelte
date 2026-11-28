<script lang="ts">
	import { Img, type ImageDescriptor } from '@ogygia/image';
	import { clothesline } from './clothesline.ts';
	import { MUTE_KEY } from './line-sound.ts';

	// neapolitan pizzas, pinned to one line like prints drying in a darkroom, hung in a hurry: a wire
	// sags across the page and every photo hangs off it on a wooden peg, some on a longer string than
	// others, different sizes, crooked, crowding and overlapping each other. to add one, add a file
	// to src/lib/life and a line to PIZZAS.
	const PIZZAS: { of: ImageDescriptor; alt: string }[] = [
		{ of: import.meta.og.image('./pizza-1.jpg'), alt: 'a margherita in its box, leopard-spotted crust, basil on top' },
		{ of: import.meta.og.image('./pizza-2.jpg'), alt: 'a pizza with rounds of goat cheese, at a café table' },
		{ of: import.meta.og.image('./pizza-3.jpg'), alt: 'a pizza of grilled aubergine, courgette, peppers and two chillies' },
		{ of: import.meta.og.image('./pizza-4.jpg'), alt: 'a charred, puffy crust with burrata, basil and chilli flakes, in its box' },
		{ of: import.meta.og.image('./pizza-5.jpg'), alt: 'a pizza with black olives and peppers' },
		{ of: import.meta.og.image('./pizza-6.jpg'), alt: 'an oval pizza with feta, olives and green chillies on a wooden board' },
		{ of: import.meta.og.image('./pizza-7.jpg'), alt: 'a pizza with mushrooms, olives and peppers' },
	];

	// seeded mess, so it is the same mess every time
	const rnd = (i: number, k: number) => {
		const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
		return v - Math.floor(v);
	};
	const rows = [PIZZAS];
	const PER = PIZZAS.length;
	const tilt = (i: number) => +((rnd(i, 1) - 0.5) * 11).toFixed(2);
	// where the wire is, 0..1 across: it sags in the middle, SAG px at its lowest
	const SAG = 46;
	const sag = (x: number) => SAG * (1 - (2 * x - 1) ** 2);
	// spread along the wire, but bunched and uneven, not spaced out evenly
	const at = (i: number, n: number) => 0.07 + ((i + (rnd(i, 2) - 0.5) * 0.7) * 0.86) / (n - 1);
	// some hang on a longer string, some are bigger
	const drop = (i: number) => Math.round(rnd(i, 3) * 54);
	const size = (i: number) => +(12 + rnd(i, 4) * 6).toFixed(2);
	const f = (n: number) => +n.toFixed(2);
	// one sound switch for the whole site: the toy shelf's, kept under the same key
	let muted = $state(false);
	function toggle() {
		muted = !muted;
		try {
			localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
		} catch {}
	}
	// once awake, the line is a rope you can pull and the prints swing on it (see clothesline.ts)
	const hang = (el: HTMLElement) => {
		try {
			muted = localStorage.getItem(MUTE_KEY) === '1';
		} catch {}
		return clothesline(el, {
			at: PIZZAS.map((_, i) => at(i, PER)),
			tilt: PIZZAS.map((_, i) => tilt(i)),
			rest: (x) => 6 + sag(x),
			muted: () => muted,
		});
	};
	const wire = 'M0 6' + Array.from({ length: 41 }, (_, i) => `L${f(i * 25)} ${f(6 + sag(i / 40))}`).join('');
</script>

{#each rows as row, r (r)}
	<div class="line" {@attach hang}>
		<svg class="wire" viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true">
			<path d={wire} />
		</svg>
		<span class="nail l" aria-hidden="true"></span>
		<span class="nail r" aria-hidden="true"></span>
		<button type="button" class="mute" aria-pressed={!muted} onclick={toggle}>{muted ? 'sound off' : 'sound on'}</button>
		<ul>
			{#each row as p, i (p.of)}
				{@const x = at(i, row.length)}
				<li style="left: {x * 100}%; top: {f(6 + sag(x))}px; --r: {tilt(r * PER + i)}deg; --drop: {drop(i)}px; --w: {size(i)}%; z-index: {1 + Math.round(rnd(i, 5) * 6)}">
					<span class="peg" aria-hidden="true"></span>
					<span class="string" aria-hidden="true"></span>
					<div class="print"><Img of={p.of} alt={p.alt} aspect="3/4" width={300} layout="constrained" /></div>
				</li>
			{/each}
		</ul>
	</div>
{/each}

<style>
	.line {
		position: relative;
		height: 400px;
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
	/* the sound switch, like the toy shelf's: only there once the line can be pulled */
	.mute {
		all: unset;
		position: absolute;
		top: -24px;
		right: 16px;
		font-family: var(--mono);
		font-size: 10px;
		color: var(--ink-3);
		cursor: pointer;
	}
	.mute:hover {
		color: var(--ink);
	}
	.mute:focus-visible {
		outline: 1.5px solid var(--ink);
		outline-offset: 2px;
	}
	.line:not(:global(.live)) .mute {
		display: none;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	li {
		position: absolute;
		width: clamp(110px, var(--w), 210px);
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
	/* the string from the peg down to the print */
	.string {
		display: block;
		width: 1px;
		height: var(--drop);
		margin: 0 auto;
		background: var(--ink-3);
	}
	.print {
		margin-top: 0;
		padding: 7px 7px 22px;
		background: var(--print, #fbfaf7);
		box-shadow: var(--shadow, 0 10px 26px -10px rgba(30, 28, 20, 0.28));
	}
	.print :global(img) {
		display: block;
		width: 100%;
		height: auto;
	}

	/* awake: the prints can be picked up and moved along the wire */
	.line:global(.live) li {
		cursor: grab;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
	}
	.line:global(.live) li:global(.held) {
		cursor: grabbing;
	}
	.line:global(.live) :global(img) {
		-webkit-user-drag: none;
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
