<script lang="ts">
	import {
		terrain,
		body,
		sky,
		angle_of,
		angle_at,
		phase_at,
		clock,
		SILHOUETTE,
		ORBIT,
		CYCLE,
		STILL,
		VW,
		VH,
		type Hand,
	} from './mountain.ts';
	import { dusk, theme_vars, body_vars, THEME_KEYS, BODY_KEYS } from './dusk.ts';

	// painted once on the server. the paint never moves, so it is drawn (rasterised) once per load,
	// resize or theme switch, and never while the sun travels.
	const painting = terrain();
	const sun = body('sun');
	const moon = body('moon');
	const s0 = sky(STILL);
	// the same painting in the other theme's greys, with its own filter ids. it is only made the
	// first time someone reaches for the sun, and fades in over the first as the page follows it.
	const twin_paint = () => painting.replace(/(id="|url\(#)oil-/g, '$1oiz-');

	/**
	 * the sky loop lives outside reactivity: it writes straight to the dom, never to $state.
	 * the sun and moon sit in their own svg, behind the paint, and the loop slides that whole svg with
	 * a css transform. that is compositor work only: the painted filters are never redrawn.
	 *
	 * the sun can be held. while it is, the loop stops, the sun follows the pointer round its arc,
	 * the arc shows as a dotted line, and the whole page takes the colours of that time of day. let
	 * go and the page eases back to its own theme, and the sun waits a moment, then travels on from
	 * where it was left.
	 */
	function sky_loop(mtn: HTMLDivElement) {
		const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
		const dark_mq = matchMedia('(prefers-color-scheme: dark)');
		const root = document.documentElement;
		const block = mtn.closest<HTMLElement>('.b');
		const svg = mtn.querySelector<SVGSVGElement>('.sky')!;
		const sunG = svg.querySelector<SVGGElement>('.sun')!;
		const moonG = svg.querySelector<SVGGElement>('.moon')!;
		const own = mtn.querySelector<SVGSVGElement>('.paint')!;
		const twin = mtn.querySelector<SVGSVGElement>('.twin')!;
		const grip = mtn.nextElementSibling!.querySelector<HTMLElement>('.grip')!;
		// is the sun behind the mountain? then it cannot be picked up
		const hill = new Path2D(SILHOUETTE);
		const pen = document.createElement('canvas').getContext('2d')!;

		// px per viewBox unit ('meet' scales by the tighter side), and where the drawing starts in the
		// box ('xMaxYMax' pins it to the bottom right)
		let s = 1;
		let ox = 0;
		let oy = 0;
		const ro = new ResizeObserver(() => {
			const w = mtn.clientWidth;
			const h = mtn.clientHeight;
			s = Math.min(w / VW, h / VH);
			ox = w - VW * s;
			oy = h - VH * s;
			grip.style.setProperty('--g', `${Math.max(48, Math.round(44 * s))}px`);
			kick();
		});
		ro.observe(mtn);

		let p = STILL;
		let t0 = performance.now() - STILL * CYCLE;
		let day = s0.day;
		let behind = false;
		// after a release the sun waits here until this time
		let rest = 0;
		// what is holding the sun: a pointer (its id), the keyboard, or nothing
		let held: { by: number | 'key'; hand: Hand; off: number } | null = null;
		let box: DOMRect | null = null;
		// how far the page follows the sun: 0 is the reader's own theme, 1 is the sun's time of day
		let k = 0;
		let k_from = 0;
		let k_to = 0;
		let k_at = 0;
		let themed = false;

		let raf = 0;
		function kick() {
			if (!raf) raf = requestAnimationFrame(frame);
		}

		function frame(now: number) {
			raf = 0;
			if (!held && !still && now >= rest) p = (((now - t0) / CYCLE) % 1 + 1) % 1;
			if (k !== k_to) {
				const t = still ? 1 : Math.min(1, (now - k_at) / (k_to > k_from ? 420 : 1000));
				k = t >= 1 ? k_to : k_from + (k_to - k_from) * (1 - Math.pow(1 - t, 3));
			}
			draw();
			if (k > 0) theme();
			else if (themed) untheme();
			if (!still || k !== k_to) kick();
		}

		function draw() {
			const b = sky(p);
			if (b.day !== day) {
				day = b.day;
				sunG.style.display = day ? '' : 'none';
				moonG.style.display = day ? 'none' : '';
			}
			svg.style.transform = `translate(${((b.x - s0.x) * s).toFixed(1)}px, ${((b.y - s0.y) * s).toFixed(1)}px)`;
			grip.style.transform = `translate(${(ox + b.x * s).toFixed(1)}px, ${(oy + b.y * s).toFixed(1)}px)`;
			block?.style.setProperty('--n', b.night.toFixed(3));
			const hid = pen.isPointInPath(hill, b.x, b.y);
			if (hid !== behind) grip.classList.toggle('behind', (behind = hid));
		}

		const own_dark = () => {
			const pref = root.getAttribute('data-pref-theme');
			return pref === 'dark' ? 1 : pref === 'light' ? 0 : dark_mq.matches ? 1 : 0;
		};

		function theme() {
			const base = own_dark();
			const { d, w } = dusk(p);
			const de = base + (d - base) * k;
			for (const [n, v] of theme_vars(de, w * k)) root.style.setProperty(n, v);
			for (const [n, v] of body_vars(de)) svg.style.setProperty(n, v);
			root.style.colorScheme = de > 0.5 ? 'dark' : 'light';
			// the twin fades in over the painting; past halfway the painting fades out under it, so
			// where the twin thins to nothing at the left edge, the old greys do not show through
			const t = Math.abs(de - base);
			twin.style.opacity = t.toFixed(3);
			own.style.opacity = Math.min(1, 2 - 2 * t).toFixed(3);
			themed = true;
		}

		function untheme() {
			for (const n of THEME_KEYS) root.style.removeProperty(n);
			for (const n of BODY_KEYS) svg.style.removeProperty(n);
			root.style.colorScheme = '';
			twin.style.opacity = '';
			own.style.opacity = '';
			themed = false;
		}

		function wake_twin() {
			if (!twin.firstChild) twin.innerHTML = twin_paint();
		}

		function hold(by: number | 'key', off = 0) {
			wake_twin();
			const was = held;
			held = { by, hand: sky(p).day ? 'sun' : 'moon', off };
			if (was) return;
			mtn.classList.add('held');
			grip.classList.add('held');
			k_from = k;
			k_to = 1;
			k_at = performance.now();
			kick();
		}

		function release() {
			if (!held) return;
			held = null;
			box = null;
			mtn.classList.remove('held');
			grip.classList.remove('held');
			const now = performance.now();
			rest = now + 700;
			t0 = rest - p * CYCLE;
			k_from = k;
			k_to = 0;
			k_at = now;
			kick();
		}

		const angle = (e: PointerEvent) =>
			angle_of((e.clientX - box!.left - ox) / s, (e.clientY - box!.top - oy) / s);

		function say() {
			grip.setAttribute('aria-valuenow', String(Math.round(p * 100)));
			grip.setAttribute('aria-valuetext', clock(p));
		}

		const ac = new AbortController();
		const on = <K extends keyof HTMLElementEventMap>(t: K, f: (e: HTMLElementEventMap[K]) => void) =>
			grip.addEventListener(t, f, { signal: ac.signal });

		on('pointerenter', wake_twin);
		on('pointerdown', (e) => {
			if (e.button !== 0 || (held && held.by !== 'key')) return;
			e.preventDefault();
			grip.setPointerCapture(e.pointerId);
			box = mtn.getBoundingClientRect();
			const hand: Hand = sky(p).day ? 'sun' : 'moon';
			// hold it where it was grabbed, so it does not jump to the pointer
			hold(e.pointerId, angle_at(p, hand) - angle(e));
		});
		on('pointermove', (e) => {
			if (!held || held.by !== e.pointerId) return;
			p = phase_at(angle(e) + held.off, held.hand);
			say();
			kick();
		});
		const up = (e: PointerEvent) => held?.by === e.pointerId && release();
		on('pointerup', up);
		on('pointercancel', up);
		on('lostpointercapture', up);
		on('keydown', (e) => {
			// a quarter of an hour a press, or two hours with shift
			const step = e.shiftKey ? 1 / 12 : 1 / 96;
			const dir = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
			if (e.key === 'Escape') return release();
			if (!dir) return;
			e.preventDefault();
			if (!held) hold('key');
			p = (((p + dir * step) % 1) + 1) % 1;
			say();
			kick();
		});
		on('blur', () => held?.by === 'key' && release());

		say();
		grip.hidden = false;
		kick();
		return () => {
			ac.abort();
			cancelAnimationFrame(raf);
			ro.disconnect();
			if (themed) untheme();
		};
	}
</script>

<div class="mtn" {@attach sky_loop}>
	<!-- back to front: the sky (sun or moon), the guide it rides on, the painting (and its twin in the
	     other theme), and a veil that dims it all at night -->
	<svg class="sky" viewBox="0 0 {VW} {VH}" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
		<g class="sun" transform="translate({s0.x.toFixed(2)} {s0.y.toFixed(2)})" style:display={s0.day ? null : 'none'}>
			{@html sun}
		</g>
		<g class="moon" transform="translate({s0.x.toFixed(2)} {s0.y.toFixed(2)})" style:display={s0.day ? 'none' : null}>
			{@html moon}
		</g>
	</svg>
	<svg class="orbit" viewBox="0 0 {VW} {VH}" preserveAspectRatio="xMaxYMax meet" aria-hidden="true"><path d={ORBIT} /></svg>
	<svg class="paint" viewBox="0 0 {VW} {VH}" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">{@html painting}</svg>
	<svg class="paint twin" viewBox="0 0 {VW} {VH}" preserveAspectRatio="xMaxYMax meet" aria-hidden="true"></svg>
	<svg class="veil" viewBox="0 0 {VW} {VH}" preserveAspectRatio="xMaxYMax meet" aria-hidden="true"><path d={SILHOUETTE} /></svg>
</div>
<!-- the handle: an invisible ring round the sun that follows it, in a layer of its own over the
     words (the name runs the full width of the block). it wakes with the island. -->
<div class="hand">
	<div
		class="grip"
		role="slider"
		tabindex="0"
		aria-label="time of day"
		aria-valuemin={0}
		aria-valuemax={100}
		aria-valuenow={Math.round(STILL * 100)}
		aria-valuetext={clock(STILL)}
		hidden
	></div>
</div>

<style>
	/* the handle's layer covers the same box as the painting, over the words; only the ring round
	   the sun takes the pointer */
	.mtn,
	.hand {
		position: absolute;
		right: 0;
		bottom: 0;
		width: 100%;
		height: 92%;
		pointer-events: none;
	}
	.hand {
		z-index: 2;
	}
	/* paint tones: greys on paper by day, charcoal greys in the dark. each is rgb(v, v-1, v-4). */
	.mtn {
		--oil-back: rgb(228 227 224);
		--oil-lit: rgb(217 216 213);
		--oil-shade: rgb(184 183 180);
		--oil-snow: rgb(250 249 246);
		--oil-sun: rgb(218 217 214);
		--oil-moon: rgb(174 173 170);
		--oil-sheen: #fff;
		--m-dusk: #8f8d86;
		--veil: 0.26;
		z-index: 0;
	}
	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-pref-theme='light'])) .mtn {
			--oil-back: rgb(29 28 25);
			--oil-lit: rgb(50 49 46);
			--oil-shade: rgb(33 32 29);
			--oil-snow: rgb(111 110 107);
			--oil-sun: rgb(59 58 55);
			--oil-moon: rgb(201 200 197);
			--oil-sheen: #555;
			--m-dusk: #000;
			--veil: 0.3;
		}
	}
	:global(:root[data-pref-theme='dark']) .mtn {
		--oil-back: rgb(29 28 25);
		--oil-lit: rgb(50 49 46);
		--oil-shade: rgb(33 32 29);
		--oil-snow: rgb(111 110 107);
		--oil-sun: rgb(59 58 55);
		--oil-moon: rgb(201 200 197);
		--oil-sheen: #555;
		--m-dusk: #000;
		--veil: 0.3;
	}
	svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
		/* the back range runs on past the left edge of the drawing; the block clips it */
		overflow: visible;
	}
	.sky {
		will-change: transform;
	}
	/* the path the sun rides, shown only while it is held. it lies under the paint, so the mountain
	   hides it wherever it runs behind */
	.orbit {
		opacity: 0;
		transition: opacity 0.5s ease;
	}
	.orbit path {
		fill: none;
		stroke: var(--ink);
		stroke-opacity: 0.4;
		stroke-width: 1.2px;
		stroke-linecap: round;
		stroke-dasharray: 0 5px;
		vector-effect: non-scaling-stroke;
	}
	.mtn:global(.held) .orbit {
		opacity: 1;
	}
	/* the other theme's greys, faded in as the page follows the sun: an opacity, never a repaint */
	.twin {
		opacity: 0;
		--oil-back: rgb(29 28 25);
		--oil-lit: rgb(50 49 46);
		--oil-shade: rgb(33 32 29);
		--oil-snow: rgb(111 110 107);
		--oil-sheen: #555;
	}
	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-pref-theme='light'])) .twin {
			--oil-back: rgb(228 227 224);
			--oil-lit: rgb(217 216 213);
			--oil-shade: rgb(184 183 180);
			--oil-snow: rgb(250 249 246);
			--oil-sheen: #fff;
		}
	}
	:global(:root[data-pref-theme='dark']) .twin {
		--oil-back: rgb(228 227 224);
		--oil-lit: rgb(217 216 213);
		--oil-shade: rgb(184 183 180);
		--oil-snow: rgb(250 249 246);
		--oil-sheen: #fff;
	}
	.grip {
		position: absolute;
		left: 0;
		top: 0;
		width: var(--g, 56px);
		height: var(--g, 56px);
		margin: calc(var(--g, 56px) / -2) 0 0 calc(var(--g, 56px) / -2);
		border-radius: 50%;
		pointer-events: auto;
		cursor: grab;
		touch-action: none;
		-webkit-tap-highlight-color: transparent;
		will-change: transform;
	}
	.grip[hidden] {
		display: none;
	}
	.grip:global(.behind) {
		pointer-events: none;
	}
	.grip:global(.held) {
		cursor: grabbing;
	}
	@media (prefers-reduced-motion: reduce) {
		.orbit {
			transition: none;
		}
	}
	/* its own layer, so the sun sliding behind it never asks it to be painted again */
	.paint {
		will-change: transform;
	}
	.mtn :global(.tone-back) {
		flood-color: var(--oil-back);
	}
	.mtn :global(.tone-lit) {
		flood-color: var(--oil-lit);
	}
	.mtn :global(.tone-shade) {
		flood-color: var(--oil-shade);
	}
	.mtn :global(.tone-snow) {
		flood-color: var(--oil-snow);
	}
	.mtn :global(.tone-sun) {
		flood-color: var(--oil-sun);
	}
	.mtn :global(.tone-moon) {
		flood-color: var(--oil-moon);
	}
	.mtn :global(.sheen) {
		lighting-color: var(--oil-sheen);
	}
	/* night falls as a veil over the painting: a css opacity, so it costs no repaint of the paint */
	.veil {
		fill: var(--m-dusk);
		opacity: calc(var(--n, 0) * var(--veil));
		mix-blend-mode: multiply;
	}
	@media (max-width: 760px) {
		/* on a phone the mountain sits above the name, not behind it */
		.mtn,
		.hand {
			top: 48px;
			bottom: auto;
			width: 100%;
			height: 230px;
		}
		.mtn {
			/* no hard floor under the hills: their feet melt into the page */
			mask-image: linear-gradient(to bottom, #000 62%, transparent);
		}
	}
</style>
