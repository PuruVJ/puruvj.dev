// the pizza line, with its physics on. a small hand-made sim, no library:
//
// - the wire is a rope of N+1 points tied to two nails, joined by stiff springs that are already
//   stretched (that is the wire's tension). each point also feels a fixed force that holds the rope
//   in exactly the sag the page draws without js, so waking up moves nothing: the sim only acts
//   when someone touches it, and the rope always comes back to the same curve.
// - each print hangs from a peg that sits at a spot along the rope and rides it. the print is a
//   pendulum on its string; it swings when its peg is shoved, slid or bounced. its weight sits on
//   the rope, so the rope is heavier, and slower, where prints hang.
// - grab a print: sideways slides its peg along the wire, down pulls the wire down to the hand.
//   pegs keep their order with a gap, so a print slid into another shoves it along.
// - when nothing moves any more the loop stops.

type Opts = {
	/** where each print hangs at rest, 0..1 across */
	at: number[];
	/** each print's own crooked hang, in degrees */
	tilt: number[];
	/** the wire at rest, px down from the top at x (0..1 across) */
	rest: (x: number) => number;
};

const N = 40; // segments
const DT = 1 / 900; // fixed sim step
const G = 6000; // gravity for the pendulums, px/s²
const M = 3; // a print's mass against one rope point's 1
const DEG = 180 / Math.PI;

export function clothesline(line: HTMLElement, o: Opts) {
	const lis = [...line.querySelectorAll<HTMLElement>(':scope > ul > li')];
	const path = line.querySelector<SVGPathElement>('.wire path');
	if (!path || lis.length !== o.at.length) return;
	const still = path.getAttribute('d') ?? '';
	const n = lis.length;
	const phone = matchMedia('(max-width: 1000px)');
	const calm = matchMedia('(prefers-reduced-motion: reduce)');

	const f64 = (k: number) => new Float64Array(k);
	// the rope: rest shape, now, velocity, mass, the holding force, and the springs' rest lengths
	const rx = f64(N + 1), ry = f64(N + 1), x = f64(N + 1), y = f64(N + 1);
	const vx = f64(N + 1), vy = f64(N + 1), m = f64(N + 1);
	const hx = f64(N + 1), hy = f64(N + 1), fx = f64(N + 1), fy = f64(N + 1), l0 = f64(N);
	let W = 0, K = 0;
	// the prints: spot on the rope (in segments), last spot, swing and its speed, pendulum length,
	// and the peg's last position and velocity, to feel how it is being shoved
	const s = f64(n), sp = f64(n), th = f64(n), om = f64(n), L = f64(n);
	const qx = f64(n), qy = f64(n), qvx = f64(n), qvy = f64(n);
	const s0 = o.at.map((a) => a * N);
	let moved = false; // has anything left its rest place since load
	let z = 20;

	// the hand
	let held = -1, pointer = -1;
	let tx = 0, ty = 0; // where the hand wants the peg
	let gx = 0, gy = 0, gvx = 0; // where the peg is being led, smoothly
	let ox = 0, oy = 0; // grab offset, peg to hand

	function build() {
		W = line.clientWidth;
		const h = W / N;
		// the wire's tension: a wave crosses and comes back in about half a second
		const c = (2 * W) / 0.5;
		const T = (c * c) / h;
		K = T / (0.3 * h);
		for (let j = 0; j <= N; j++) {
			rx[j] = x[j] = (j / N) * W;
			ry[j] = y[j] = o.rest(j / N);
			vx[j] = vy[j] = 0;
			hx[j] = hy[j] = 0;
		}
		for (let j = 0; j < N; j++) {
			const dx = rx[j + 1] - rx[j], dy = ry[j + 1] - ry[j], len = Math.hypot(dx, dy);
			l0[j] = len - T / K;
			// at rest every spring pulls with T; hold each point against that
			const ux = (T * dx) / len, uy = (T * dy) / len;
			hx[j] -= ux; hy[j] -= uy;
			hx[j + 1] += ux; hy[j + 1] += uy;
		}
		for (let i = 0; i < n; i++) {
			const print = lis[i].querySelector<HTMLElement>('.print');
			L[i] = Math.max(60, lis[i].offsetHeight - (print?.offsetHeight ?? 0) / 2);
			th[i] = om[i] = 0;
			sp[i] = s[i];
			const [px, py] = at(s[i]);
			qx[i] = px; qy[i] = py; qvx[i] = qvy[i] = 0;
		}
	}

	/** the rope at spot u (in segments) */
	function at(u: number): [number, number] {
		const j = Math.min(N - 1, Math.floor(u)), w = u - j;
		return [x[j] + (x[j + 1] - x[j]) * w, y[j] + (y[j + 1] - y[j]) * w];
	}
	const rest_at = (u: number) => {
		const j = Math.min(N - 1, Math.floor(u)), w = u - j;
		return [rx[j] + (rx[j + 1] - rx[j]) * w, ry[j] + (ry[j + 1] - ry[j]) * w];
	};
	/** the spot on the rope right above px across */
	function spot(px: number) {
		let j = 0;
		while (j < N - 1 && x[j + 1] < px) j++;
		const w = (px - x[j]) / (x[j + 1] - x[j] || 1);
		return j + Math.max(0, Math.min(1, w));
	}

	/** keep pegs in order with a gap, inside the line. the held one wins, the rest give way */
	function order() {
		const gap = Math.max(0.5, (22 / W) * N), lo = 0.9, hi = N - 0.9;
		for (let i = 0; i < n; i++) s[i] = Math.max(lo + i * gap, Math.min(hi - (n - 1 - i) * gap, s[i]));
		const from = held < 0 ? 0 : held;
		for (let i = from + 1; i < n; i++) if (s[i] < s[i - 1] + gap) s[i] = s[i - 1] + gap;
		for (let i = from - 1; i >= 0; i--) if (s[i] > s[i + 1] - gap) s[i] = s[i + 1] - gap;
		if (held < 0) for (let i = n - 2; i >= 0; i--) if (s[i] > s[i + 1] - gap) s[i] = s[i + 1] - gap;
	}

	function step() {
		const slow = calm.matches;
		const damp = 1 - (slow ? 25 : 3.2) * DT; // the rope's
		const grip = 1 - (slow ? 60 : 7) * DT; // a peg's grip on the wire, as it slides
		const swing = slow ? 11 : 2.4; // how fast a swing dies

		m.fill(1);
		for (let i = 0; i < n; i++) {
			const j = Math.min(N - 1, Math.floor(s[i])), w = s[i] - j;
			m[j] += M * (1 - w);
			m[j + 1] += M * w;
		}
		fx.set(hx);
		fy.set(hy);
		for (let j = 0; j < N; j++) {
			const dx = x[j + 1] - x[j], dy = y[j + 1] - y[j], len = Math.hypot(dx, dy);
			const f = (K * (len - l0[j])) / len;
			fx[j] += f * dx; fy[j] += f * dy;
			fx[j + 1] -= f * dx; fy[j + 1] -= f * dy;
		}

		// the hand: lead the peg smoothly toward it, slide it along, pull the wire to it
		if (held >= 0) {
			const e = slow ? 0.05 : 0.035;
			const nx = gx + (tx - gx) * e;
			gvx = (nx - gx) / DT;
			gx = nx;
			gy += (ty - gy) * e;
			s[held] = spot(gx);
			const j = Math.min(N - 1, Math.floor(s[held])), w = s[held] - j;
			const ya = y[j] + (y[j + 1] - y[j]) * w;
			const va = vy[j] + (vy[j + 1] - vy[j]) * w;
			// the wire gives a little, then holds: you can only pull it so far
			const r = rest_at(s[held])[1];
			const d = gy - r;
			const want = r + (d > 0 ? 240 * Math.tanh(d / 240) : 30 * Math.tanh(d / 30));
			const F = 1e6 * (want - ya) - 900 * va;
			fy[j] += F * (1 - w);
			fy[j + 1] += F * w;
		}

		for (let j = 1; j < N; j++) {
			vx[j] = (vx[j] + (fx[j] / m[j]) * DT) * damp;
			vy[j] = (vy[j] + (fy[j] / m[j]) * DT) * damp;
			x[j] += vx[j] * DT;
			y[j] += vy[j] * DT;
		}

		// pegs slide on, losing speed to their grip
		for (let i = 0; i < n; i++) {
			if (i === held) continue;
			const v = (s[i] - sp[i]) * grip;
			sp[i] = s[i];
			s[i] += v;
		}
		order();
		if (held >= 0) sp[held] = s[held];

		// the prints swing from their pegs as the pegs are moved
		for (let i = 0; i < n; i++) {
			const [px, py] = at(s[i]);
			const pvx = (px - qx[i]) / DT, pvy = (py - qy[i]) / DT;
			const ax = (pvx - qvx[i]) / DT, ay = (pvy - qvy[i]) / DT;
			qx[i] = px; qy[i] = py; qvx[i] = pvx; qvy[i] = pvy;
			if (i === held) {
				// in the hand it just leans a little the way it is being moved
				const want = Math.max(-0.14, Math.min(0.14, -gvx * 0.00012));
				const nt = th[i] + (want - th[i]) * 0.02;
				om[i] = (nt - th[i]) / DT;
				th[i] = nt;
				continue;
			}
			const g = Math.max(0.3 * G, Math.min(3 * G, G - ay));
			const a = (-g * Math.sin(th[i]) + ax * Math.cos(th[i])) / L[i] - swing * om[i];
			om[i] += a * DT;
			th[i] = Math.max(-1.2, Math.min(1.2, th[i] + om[i] * DT));
		}
	}

	const f = (v: number) => v.toFixed(1);
	function draw() {
		const k = 1000 / W;
		let d = `M0 ${f(y[0])}`;
		for (let j = 0; j <= N; j++) d += `L${f(x[j] * k)} ${f(y[j])}`;
		path!.setAttribute('d', d);
		for (let i = 0; i < n; i++) {
			const [px, py] = at(s[i]);
			const [bx, by] = rest_at(s0[i]);
			const st = lis[i].style;
			st.translate = `calc(-50% + ${f(px - bx)}px) ${f(py - by)}px`;
			st.rotate = `${(o.tilt[i] + th[i] * DEG).toFixed(2)}deg`;
		}
	}

	/** is it all still? then put it exactly at rest and stop */
	function asleep() {
		if (held >= 0) return false;
		let e = 0;
		for (let j = 1; j < N; j++) e = Math.max(e, Math.abs(vx[j]) + Math.abs(vy[j]), Math.abs(x[j] - rx[j]) + Math.abs(y[j] - ry[j]) * 20);
		for (let i = 0; i < n; i++) e = Math.max(e, Math.abs(om[i]) * 300, Math.abs(th[i]) * 1500, Math.abs(s[i] - sp[i]) * 3e4);
		if (e > 2) return false;
		for (let j = 0; j <= N; j++) { x[j] = rx[j]; y[j] = ry[j]; vx[j] = vy[j] = 0; }
		for (let i = 0; i < n; i++) { th[i] = om[i] = 0; sp[i] = s[i]; }
		return true;
	}

	let raf = 0, last = 0, acc = 0;
	function frame(t: number) {
		acc += Math.min(0.05, (t - last) / 1000);
		last = t;
		let k = 0;
		while (acc >= DT && k++ < 40) {
			step();
			acc -= DT;
		}
		const done = asleep();
		draw();
		raf = done ? 0 : requestAnimationFrame(frame);
	}
	function wake() {
		if (raf) return;
		last = performance.now();
		acc = 0;
		raf = requestAnimationFrame(frame);
	}

	function local(e: PointerEvent) {
		const b = line.getBoundingClientRect();
		return [e.clientX - b.left, e.clientY - b.top];
	}
	function down(e: PointerEvent) {
		if (phone.matches || held >= 0 || (e.pointerType === 'mouse' && e.button !== 0)) return;
		const li = e.currentTarget as HTMLElement;
		const i = lis.indexOf(li);
		if (i < 0) return;
		e.preventDefault();
		li.setPointerCapture(e.pointerId);
		held = i;
		pointer = e.pointerId;
		moved = true;
		const [px, py] = local(e);
		const [qx0, qy0] = at(s[i]);
		ox = px - qx0;
		oy = py - qy0;
		tx = gx = qx0;
		ty = gy = qy0;
		gvx = 0;
		li.style.zIndex = String(++z);
		li.classList.add('held');
		wake();
	}
	function move(e: PointerEvent) {
		if (e.pointerId !== pointer) return;
		const [px, py] = local(e);
		tx = Math.max(0, Math.min(W, px - ox));
		ty = py - oy;
	}
	function up(e: PointerEvent) {
		if (e.pointerId !== pointer) return;
		lis[held]?.classList.remove('held');
		// let go: it keeps the speed it had, so a flick slides it on
		if (!calm.matches) sp[held] = s[held] - (gvx * DT * N) / W;
		held = pointer = -1;
		wake();
	}
	const no_drag = (e: Event) => e.preventDefault();

	function on() {
		if (phone.matches) return;
		line.classList.add('live');
		build();
		if (moved) draw();
		for (const li of lis) {
			li.addEventListener('pointerdown', down);
			li.addEventListener('pointermove', move);
			li.addEventListener('pointerup', up);
			li.addEventListener('pointercancel', up);
			li.addEventListener('dragstart', no_drag);
		}
	}
	function off() {
		cancelAnimationFrame(raf);
		raf = 0;
		held = pointer = -1;
		line.classList.remove('live');
		path!.setAttribute('d', still);
		for (const li of lis) {
			li.style.translate = li.style.rotate = '';
			li.classList.remove('held');
			li.removeEventListener('pointerdown', down);
			li.removeEventListener('pointermove', move);
			li.removeEventListener('pointerup', up);
			li.removeEventListener('pointercancel', up);
			li.removeEventListener('dragstart', no_drag);
		}
	}

	for (let i = 0; i < n; i++) s[i] = sp[i] = s0[i];
	on();
	const flip = () => (off(), on());
	phone.addEventListener('change', flip);
	// a new width: start the rope over at rest, the pegs where they were along it
	const ro = new ResizeObserver(() => {
		if (phone.matches || line.clientWidth === W) return;
		build();
		if (moved) draw();
	});
	ro.observe(line);

	return () => {
		phone.removeEventListener('change', flip);
		ro.disconnect();
		off();
	};
}
