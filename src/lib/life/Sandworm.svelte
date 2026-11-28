<script lang="ts">
	// arrakis in the same 1px line: dunes rolling to the horizon, a sandworm breaching out of the
	// sand in a long arc, ringed like a giant earthworm, its round mouth open to the sky; a spray
	// of sand off its back, and a lone figure on the crest, very small, standing his ground.
	const W = 520;
	const H = 300;
	const f = (n: number) => +n.toFixed(2);

	// the dunes: long, low swells, the nearer ones taller
	const dune = (y: number, amp: number, k: number, ph: number) =>
		'M' +
		Array.from({ length: 53 }, (_, i) => {
			const x = (i * W) / 52;
			return `${f(x)} ${f(y - amp * Math.sin((x / W) * Math.PI * k + ph) - amp * 0.35 * Math.sin((x / W) * Math.PI * k * 2.3 + ph * 2))}`;
		}).join('L');

	// the worm's spine: out of the sand at the right, up, arching left, head lifted at the top
	const spine = (t: number): [number, number] => {
		const x = 430 - 230 * t + 30 * Math.sin(t * Math.PI);
		const y = 250 - 190 * Math.sin(t * Math.PI * 0.62) - 20 * t;
		return [x, y];
	};
	const N = 40;
	const pts = Array.from({ length: N + 1 }, (_, i) => spine(i / N));
	// body width: wide at the sand, narrowing a little toward the head, then the mouth flares
	const half = (t: number) => 30 - 9 * t + Math.max(0, t - 0.88) * 110;
	const side = (s: number) =>
		pts.map(([x, y], i) => {
			const [nx, ny] = i < N ? pts[i + 1] : pts[i];
			const [px, py] = i > 0 ? pts[i - 1] : pts[i];
			const dx = nx - px;
			const dy = ny - py;
			const l = Math.hypot(dx, dy) || 1;
			const h = half(i / N) * s;
			return [x - (dy / l) * h, y + (dx / l) * h] as [number, number];
		});
	const left = side(1);
	const right = side(-1);
	const body = 'M' + left.map(([x, y]) => `${f(x)} ${f(y)}`).join('L');
	const back = 'M' + right.map(([x, y]) => `${f(x)} ${f(y)}`).join('L');
	// the body as one filled shape, so the dunes behind it are hidden, not drawn through it
	const solid = body + 'L' + right.slice().reverse().map(([x, y]) => `${f(x)} ${f(y)}`).join('L') + 'Z';
	// the near dune, filled down to the bottom, buries the worm where it comes out of the sand
	const near = (y: number, amp: number, k: number, ph: number) => dune(y, amp, k, ph) + `L${W} ${H}L0 ${H}Z`;
	// rings across the body, closer together toward the head
	const rings = Array.from({ length: 16 }, (_, k) => Math.round(N * (1 - (1 - (k + 1) / 17) ** 1.2)))
		.filter((i) => i < N - 1)
		.map((i) => {
			const [ax, ay] = left[i];
			const [bx, by] = right[i];
			const [cx, cy] = pts[i];
			// a ring bows a little toward the tail, so the body reads as round
			const [tx, ty] = pts[Math.max(0, i - 1)];
			return `M${f(ax)} ${f(ay)}Q${f(cx + (tx - cx) * 1.6)} ${f(cy + (ty - cy) * 1.6)} ${f(bx)} ${f(by)}`;
		});
	// the mouth: an open ellipse at the head, with a ring of teeth inside
	const [hx, hy] = pts[N];
	const [gx, gy] = pts[N - 2];
	const ang = (Math.atan2(hy - gy, hx - gx) * 180) / Math.PI;
	const teeth = Array.from({ length: 22 }, (_, i) => {
		const a = (i / 22) * Math.PI * 2;
		const r1 = 33;
		const r2 = 24;
		return `M${f(Math.cos(a) * 12 * (r1 / 33))} ${f(Math.sin(a) * r1)}L${f(Math.cos(a) * 12 * (r2 / 33))} ${f(Math.sin(a) * r2)}`;
	}).join('');
	// sand pouring off its back as it rises
	const spray = Array.from({ length: 26 }, (_, i) => {
		const t = 0.08 + (i % 13) * 0.05;
		const [x, y] = right[Math.round(t * N)];
		const fall = 10 + ((i * 37) % 23);
		return `M${f(x + 2)} ${f(y + 4 + (i > 12 ? 6 : 0))}l${f(3 + (i % 3))} ${f(fall)}`;
	}).join('');
</script>

<svg class="worm" viewBox="0 0 {W} {H}" fill="none" aria-hidden="true">
	<!-- the far dunes, fading -->
	<path class="hair" d={dune(150, 6, 1.4, 0.4)} />
	<path class="hair" d={dune(176, 9, 2.1, 1.7)} />
	<path class="fine" d={dune(212, 12, 1.7, 2.6)} />
	<!-- the worm -->
	<path class="ground" d={solid} />
	<path class="main" d={body} />
	<path class="main" d={back} />
	{#each rings as d (d)}<path class="fine" {d} />{/each}
	<g transform="translate({f(hx)} {f(hy)}) rotate({f(ang)})">
		<ellipse class="main mouth" cx="0" cy="0" rx="13" ry="36" />
		<ellipse class="fine" cx="0" cy="0" rx="9" ry="26" />
		<path class="hair" d={teeth} />
	</g>
	<path class="hair" d={spray} />
	<!-- the sand it broke out of, and the near dune -->
	<path class="main ground" d={near(262, 14, 1.2, 0.9)} />
	<path class="fine" d="M360 252q30 -14 62 -2q24 8 46 -4" />
	<!-- a lone figure on the crest, facing it -->
	<g class="main" transform="translate(70 236)">
		<path d="M0 0v-13M0 -13l-3 7M0 -13l3 7M0 0l-3 8M0 0l3 8" />
		<circle cx="0" cy="-16" r="2.4" />
	</g>
</svg>

<style>
	.worm {
		display: block;
		width: 100%;
		height: auto;
		color: var(--ink);
		overflow: visible;
	}
	path,
	ellipse,
	circle {
		vector-effect: non-scaling-stroke;
		stroke-width: 1px;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.main {
		stroke: currentColor;
	}
	.ground,
	.mouth {
		fill: var(--paper);
	}
	.fine {
		stroke: var(--ink-2);
		opacity: 0.85;
	}
	.hair {
		stroke: var(--ink-3);
		opacity: 0.6;
	}
</style>
