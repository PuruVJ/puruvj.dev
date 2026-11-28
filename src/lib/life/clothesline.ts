// the pizza line, with its physics on. a small hand-made sim, no library:
//
// - the wire is a string of N+1 points tied to two nails. each point only moves up and down, away
//   from the sag the page draws without js, and the string's tension pulls every point toward the
//   middle of its two neighbours. so the wire is always one line across, left to right: it can be
//   pulled down into two straight runs to the nails, it can ring, but it can never fold back on
//   itself or kink. with nothing pulling it, it is exactly the drawn sag, so waking up moves nothing.
// - each print hangs from a peg that sits at a spot along the wire and rides it. the print is a
//   pendulum on its string; it swings when its peg is shoved, slid or bounced. its weight sits on
//   the wire, so the wire is heavier, and slower, where prints hang.
// - grab a print: sideways slides its peg along the wire, down pulls the wire down to the hand and
//   up pulls it up, less far the nearer the nail either way. pegs keep their order with a gap, so a
//   print slid into another shoves it along.
// - a grab always ends: let go anywhere (on the page or off it), lose the pointer to the browser,
//   switch windows or tabs, and the print is dropped, the wire is let go and its creak stops.
// - when the line first scrolls into view the prints are already swaying a little, as if a breeze
//   had been at them, and settle.
// - when nothing moves any more the loop stops.
// - it makes small sounds (see line-sound.ts), only once someone has picked up a print.

import { line_sound } from './line-sound.ts';

type Opts = {
	/** where each print hangs at rest, 0..1 across */
	at: number[];
	/** each print's own crooked hang, in degrees */
	tilt: number[];
	/** the wire at rest, px down from the top at x (0..1 across) */
	rest: (x: number) => number;
	/** is sound switched off */
	muted: () => boolean;
};

const N = 40; // segments
const DT = 1 / 900; // fixed sim step
const G = 6000; // gravity for the pendulums, px/s²
const M = 3; // a print's mass against one wire point's 1
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
	// the wire: its rest height at each point, how far each is off it now and a step ago, its mass
	const ry = f64(N + 1), u = f64(N + 1), u0 = f64(N + 1), m = f64(N + 1);
	let W = 0, h = 1, k2 = 0;
	// the prints: spot on the wire (in segments), last spot, swing and its speed, pendulum length,
	// and the peg's last position and velocity, to feel how it is being shoved
	const s = f64(n), sp = f64(n), th = f64(n), om = f64(n), L = f64(n);
	const qx = f64(n), qy = f64(n), qvx = f64(n), qvy = f64(n);
	const s0 = o.at.map((a) => a * N);
	const fs = f64(n); // each peg's spot at the last frame, to hear how fast it slides
	const hard: boolean[] = []; // is this print swinging hard (for the paper's flap as it settles)
	let gap = 1, pull = 0, was = 0; // the pegs' gap, how hard the hand pulls the wire (px, up or down), and last frame
	const sound = line_sound(o.muted, () => calm.matches);
	let moved = false; // has anything left its rest place since load
	let z = 20;

	// the hand
	let held = -1, pointer = -1;
	let tx = 0, ty = 0; // where the hand wants the peg
	let gx = 0, gy = 0, gvx = 0; // where the peg is being led, smoothly
	let ox = 0, oy = 0; // grab offset, peg to hand

	function build() {
		W = line.clientWidth;
		h = W / N;
		// the wire's tension: a wave crosses and comes back in about half a second
		const c = (2 * W) / 0.5;
		k2 = (c * c) / (h * h);
		for (let j = 0; j <= N; j++) {
			ry[j] = o.rest(j / N);
			u[j] = u0[j] = 0;
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

	const seg = (v: number) => Math.max(0, Math.min(N - 1, Math.floor(v)));
	/** the wire at spot v (in segments) */
	function at(v: number): [number, number] {
		const j = seg(v), w = v - j;
		return [v * h, ry[j] + u[j] + (ry[j + 1] + u[j + 1] - ry[j] - u[j]) * w];
	}
	const rest_at = (v: number): [number, number] => {
		const j = seg(v);
		return [v * h, ry[j] + (ry[j + 1] - ry[j]) * (v - j)];
	};

	/** keep pegs in order with a gap, inside the line. the held one wins, the rest give way */
	function order() {
		gap = Math.max(0.5, (22 / W) * N);
		const lo = 0.9, hi = N - 0.9;
		for (let i = 0; i < n; i++) s[i] = Math.max(lo + i * gap, Math.min(hi - (n - 1 - i) * gap, s[i]));
		const from = held < 0 ? 0 : held;
		for (let i = from + 1; i < n; i++) if (s[i] < s[i - 1] + gap) s[i] = s[i - 1] + gap;
		for (let i = from - 1; i >= 0; i--) if (s[i] > s[i + 1] - gap) s[i] = s[i + 1] - gap;
		if (held < 0) for (let i = n - 2; i >= 0; i--) if (s[i] > s[i + 1] - gap) s[i] = s[i + 1] - gap;
	}

	function step() {
		const slow = calm.matches;
		const damp = 1 - (slow ? 25 : 6) * DT; // the wire's
		const grip = 1 - (slow ? 60 : 7) * DT; // a peg's grip on the wire, as it slides
		const swing = slow ? 11 : 2.4; // how fast a swing dies

		m.fill(1);
		for (let i = 0; i < n; i++) {
			const j = seg(s[i]), w = s[i] - j;
			m[j] += M * (1 - w);
			m[j + 1] += M * w;
		}
		// the wire: each point pulled toward the middle of its neighbours (verlet, ends tied)
		let prev = u[0];
		for (let j = 1; j < N; j++) {
			const a = (k2 * (prev + u[j + 1] - 2 * u[j])) / m[j];
			const next = u[j] + (u[j] - u0[j]) * damp + a * DT * DT;
			prev = u[j];
			u0[j] = u[j];
			u[j] = next;
		}

		// the hand: lead the peg smoothly toward it, slide it along, hold the wire to it
		if (held >= 0) {
			const e = slow ? 0.05 : 0.035;
			const nx = gx + (tx - gx) * e;
			gvx = (nx - gx) / DT;
			gx = nx;
			gy += (ty - gy) * e;
			s[held] = gx / h;
			order();
			const v = s[held], j = seg(v), w = v - j;
			// the wire gives a little, then holds: you can only pull it so far, and less near a nail
			const r = rest_at(v)[1];
			const near = Math.min(v, N - v) * h;
			const deep = Math.min(240, 18 + near * 0.9), high = Math.min(200, 16 + near * 0.75);
			const d = gy - r;
			const want = d > 0 ? deep * Math.tanh(d / deep) : high * Math.tanh(d / high);
			// put the wire there, shared by the two points either side of the peg (the ends stay tied)
			const now = u[j] + (u[j + 1] - u[j]) * w;
			const aj = j > 0 ? 1 - w : 0, aj1 = j + 1 < N ? w : 0;
			const sum = aj * aj + aj1 * aj1 || 1;
			const fix = (want - now) / sum;
			u[j] += fix * aj;
			u[j + 1] += fix * aj1;
			// how taut it is, the same scale up or down, so a hard pull either way rings the same
			pull = want > 0 ? want : (-want * deep) / high;
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
		// a smooth line through the points: straight runs stay straight, a corner gets a small round
		const k = 1000 / W;
		const X = (j: number) => f(j * h * k), Y = (j: number) => ry[j] + u[j];
		let d = `M0 ${f(Y(0))}`;
		for (let j = 1; j < N; j++) d += `Q${X(j)} ${f(Y(j))} ${f((j + 0.5) * h * k)} ${f((Y(j) + Y(j + 1)) / 2)}`;
		d += `L1000 ${f(Y(N))}`;
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
		for (let j = 1; j < N; j++) e = Math.max(e, Math.abs(u[j] - u0[j]) / DT, Math.abs(u[j]) * 20);
		for (let i = 0; i < n; i++) e = Math.max(e, Math.abs(om[i]) * 300, Math.abs(th[i]) * 1500, Math.abs(s[i] - sp[i]) * 3e4);
		if (e > 2) return false;
		u.fill(0);
		u0.fill(0);
		for (let i = 0; i < n; i++) { th[i] = om[i] = 0; sp[i] = s[i]; }
		return true;
	}

	let raf = 0, last = 0, acc = 0;
	function frame(t: number) {
		const dt = Math.min(0.05, (t - last) / 1000);
		acc = Math.min(acc + dt, 0.05);
		last = t;
		fs.set(s);
		while (acc >= DT) {
			step();
			acc -= DT;
		}
		const done = asleep();
		draw();
		listen(dt);
		raf = done ? 0 : requestAnimationFrame(frame);
	}
	/** the sounds follow the frame: the fastest peg's pulley ticks, the wire creaks as it is pulled,
	 *  and a print that was swinging hard gives one soft flap as it settles */
	function listen(dt: number) {
		if (dt <= 0) return;
		const px = h / dt;
		let fast = 0;
		for (let i = 0; i < n; i++) fast = Math.max(fast, Math.abs(s[i] - fs[i]) * px);
		sound.slide(fast);
		sound.creak(pull, held >= 0 ? (pull - was) / dt : 0);
		was = pull;
		for (let i = 0; i < n; i++) {
			if (i === held) continue;
			if (Math.abs(om[i]) > 2.2) hard[i] = true;
			else if (hard[i] && Math.abs(om[i]) < 0.5 && Math.abs(th[i]) < 0.08) {
				hard[i] = false;
				sound.flap(L[i]);
			}
		}
	}
	function wake() {
		if (raf) return;
		last = performance.now();
		acc = 0;
		raf = requestAnimationFrame(frame);
	}

	// a breeze before you got here: the first time the line comes into view, set the prints
	// swaying a little, each its own way, from where they hang (so nothing jumps), and let them settle
	let breezed = false;
	const io = new IntersectionObserver((es) => {
		if (!es.some((e) => e.isIntersecting) || breezed) return;
		breezed = true;
		io.disconnect();
		if (calm.matches || phone.matches || moved) return;
		moved = true;
		for (let i = 0; i < n; i++) {
			const sway = (0.05 + 0.04 * Math.abs(Math.sin(i * 2.3 + 0.7))) * (i % 2 ? -1 : 1);
			// a mid-swing start: at rest angle, moving, so the first frame is exactly the page
			om[i] = sway * Math.sqrt(G / L[i]) * (0.8 + 0.4 * Math.abs(Math.cos(i * 1.7)));
		}
		wake();
	}, { threshold: 0.25 });

	function local(e: PointerEvent) {
		const b = line.getBoundingClientRect();
		return [e.clientX - b.left, e.clientY - b.top];
	}
	// the grab. the peg follows one pointer, from its down to whatever ends it first: its up, a
	// cancel, the li losing capture, a move with no button down (an up we never saw, let go outside
	// the window), the window losing focus, the tab hidden. listeners on window catch what the li misses.
	let holder: HTMLElement | null = null;
	function down(e: PointerEvent) {
		if (phone.matches || (e.pointerType === 'mouse' && e.button !== 0)) return;
		// the same pointer coming down again means its last up never reached us: drop that grab first
		if (held >= 0) {
			if (e.pointerId !== pointer) return;
			end(false);
		}
		const li = e.currentTarget as HTMLElement;
		const i = lis.indexOf(li);
		if (i < 0) return;
		e.preventDefault();
		try {
			li.setPointerCapture(e.pointerId);
		} catch {}
		sound.unlock();
		sound.clack();
		pull = was = 0;
		held = i;
		pointer = e.pointerId;
		holder = li;
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
		li.addEventListener('lostpointercapture', lost);
		addEventListener('pointermove', move, true);
		addEventListener('pointerup', up, true);
		addEventListener('pointercancel', cancel, true);
		addEventListener('blur', drop);
		addEventListener('contextmenu', drop, true);
		addEventListener('pagehide', drop);
		document.addEventListener('visibilitychange', hidden);
		wake();
	}
	function move(e: PointerEvent) {
		if (e.pointerId !== pointer) return;
		// no button down any more: the up happened somewhere we never heard it
		if (e.pointerType !== 'touch' && e.buttons === 0) return end(true);
		const [px, py] = local(e);
		tx = Math.max(0, Math.min(W, px - ox));
		ty = py - oy;
	}
	const up = (e: PointerEvent) => e.pointerId === pointer && end(true);
	const cancel = (e: PointerEvent) => e.pointerId === pointer && end(false);
	// capture is let go after an up too, and that up has already ended the grab
	const lost = (e: PointerEvent) => e.pointerId === pointer && end(false);
	const drop = () => end(false);
	const hidden = () => document.hidden && end(false);
	/** end the grab. a real let go keeps the hand's speed (a flick slides it on) and the wire rings;
	 *  a lost one just puts the print down and lets the wire go quietly */
	function end(release: boolean) {
		const li = holder;
		holder = null;
		if (li) {
			li.removeEventListener('lostpointercapture', lost);
			try {
				if (li.hasPointerCapture(pointer)) li.releasePointerCapture(pointer);
			} catch {}
		}
		removeEventListener('pointermove', move, true);
		removeEventListener('pointerup', up, true);
		removeEventListener('pointercancel', cancel, true);
		removeEventListener('blur', drop);
		removeEventListener('contextmenu', drop, true);
		removeEventListener('pagehide', drop);
		document.removeEventListener('visibilitychange', hidden);
		if (held < 0) return;
		lis[held]?.classList.remove('held');
		if (release && !calm.matches) sp[held] = s[held] - (gvx * DT * N) / W;
		else sp[held] = s[held];
		sound.let_go(release ? pull : 0);
		pull = was = 0;
		gvx = 0;
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
			li.addEventListener('dragstart', no_drag);
		}
	}
	function off() {
		end(false);
		cancelAnimationFrame(raf);
		raf = 0;
		line.classList.remove('live');
		path!.setAttribute('d', still);
		for (const li of lis) {
			li.style.translate = li.style.rotate = '';
			li.classList.remove('held');
			li.removeEventListener('pointerdown', down);
			li.removeEventListener('dragstart', no_drag);
		}
	}

	for (let i = 0; i < n; i++) s[i] = sp[i] = s0[i];
	on();
	io.observe(line);
	const flip = () => (off(), on());
	phone.addEventListener('change', flip);
	// a new width: start the wire over at rest, the pegs where they were along it
	const ro = new ResizeObserver(() => {
		if (phone.matches || line.clientWidth === W) return;
		build();
		if (moved) draw();
	});
	ro.observe(line);

	return () => {
		phone.removeEventListener('change', flip);
		ro.disconnect();
		io.disconnect();
		off();
		sound.close();
	};
}
