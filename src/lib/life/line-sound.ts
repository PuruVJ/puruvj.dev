// the pizza line's sounds, made on the fly (no files), quiet and warm, each one a single thing
// that happened, never a running bed of noise:
//
// - clack: the wooden peg's jaws as you pick a print up
// - tick: a small metal pulley rolling along the wire, one tk per ridge, so the faster it slides
//   the closer they come; each has a soft low knock of the wheel under it
// - creak: the wire straining as it is pulled up or down, only while the pull changes, higher the tighter
// - thrum: the wire let go, a low plucked note that rings out, higher the harder it was pulled
// - flap: a print that was swinging hard gives one soft paper flap as it settles
//
// everything goes through a low pass, so nothing is sharp up high. nothing is made until the
// first grab, and the shelf's sound switch (the same stored choice) silences it all.

export const MUTE_KEY = 'toys-muted';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** the sounds, on any audio context (a live one, or an offline one to render a recording) */
export function voices(ac: BaseAudioContext, dest: AudioNode) {
	const out = ac.createGain();
	out.gain.value = 0.6;
	// two gentle low passes: warm, and nothing much past 6kHz
	const lp1 = ac.createBiquadFilter(), lp2 = ac.createBiquadFilter();
	lp1.type = lp2.type = 'lowpass';
	lp1.frequency.value = lp2.frequency.value = 5600;
	lp1.Q.value = lp2.Q.value = 0.5;
	out.connect(lp1).connect(lp2).connect(dest);

	const noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
	const nd = noise.getChannelData(0);
	for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

	/** a gain that rises to peak in `a` s and dies away over `d` s */
	function env(t: number, peak: number, a: number, d: number, to: AudioNode = out) {
		const g = ac.createGain();
		g.gain.setValueAtTime(0.0001, t);
		g.gain.exponentialRampToValueAtTime(peak, t + a);
		g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
		g.connect(to);
		return g;
	}
	/** a sine that rings at f and dies in d s */
	function ring(t: number, f: number, peak: number, d: number, to?: AudioNode) {
		const o = ac.createOscillator();
		o.frequency.value = f;
		o.connect(env(t, peak, 0.002, d, to));
		o.start(t);
		o.stop(t + d + 0.02);
	}
	/** a puff of noise through a band at f */
	function burst(t: number, f: number, q: number, peak: number, a: number, d: number, to?: AudioNode) {
		const s = ac.createBufferSource();
		s.buffer = noise;
		const bp = ac.createBiquadFilter();
		bp.type = 'bandpass';
		bp.frequency.value = f;
		bp.Q.value = q;
		s.connect(bp).connect(env(t, peak, a, d, to));
		s.start(t, rand(0, 0.8));
		s.stop(t + a + d + 0.02);
	}

	/** the peg picked up: a dry wooden clack, then the jaws settling a hair after */
	function clack(t: number) {
		const v = rand(0.92, 1.08);
		for (const [dt, a] of [[0, 1], [0.03, 0.45]]) {
			const u = t + dt;
			burst(u, 1900 * v, 2.5, 0.05 * a, 0.001, 0.008);
			ring(u, 640 * v, 0.06 * a, 0.045);
			ring(u, 1480 * v, 0.025 * a, 0.025);
		}
	}

	/** one ridge of the pulley wheel over the wire: a crisp tk, a faint metal ring, a low knock */
	function tick(t: number, k: number) {
		const a = (0.6 + 0.4 * k) * rand(0.75, 1.1);
		burst(t, rand(2300, 3200), 3, 0.05 * a, 0.0008, 0.01);
		ring(t, rand(1350, 1650), 0.012 * a, 0.02);
		ring(t, rand(170, 220), 0.05 * a, 0.03);
	}

	/** the wire let go after a pull of depth px: a low plucked string, higher the harder it was pulled */
	function thrum(t: number, depth: number, soft = false) {
		const k = clamp(depth / 240, 0, 1);
		const f0 = (62 + 92 * k) * rand(0.98, 1.02);
		const amp = (0.045 + 0.05 * k) * (soft ? 0.6 : 1);
		const lp = ac.createBiquadFilter();
		lp.type = 'lowpass';
		lp.frequency.setValueAtTime(Math.min(5000, f0 * 22), t);
		lp.frequency.exponentialRampToValueAtTime(f0 * 4, t + 0.4);
		lp.connect(out);
		// a real string's partials sit a touch sharp of whole numbers, and the high ones die first
		for (const [hm, a] of [[1, 1], [2.004, 0.55], [3.012, 0.3], [4.03, 0.16], [5.05, 0.08]]) {
			const o = ac.createOscillator();
			o.frequency.setValueAtTime(f0 * hm * 1.012, t);
			o.frequency.exponentialRampToValueAtTime(f0 * hm, t + 0.15);
			const d = 0.62 / Math.sqrt(hm);
			o.connect(env(t, amp * a, 0.004, d, lp));
			o.start(t);
			o.stop(t + d + 0.05);
		}
		// the pluck: a short bright scuff as the wire leaves the peg
		burst(t, Math.min(3500, f0 * 9), 1.2, amp * 0.25, 0.001, 0.025);
	}

	/** a print settling: one soft flap of paper, two quick puffs */
	function flap(t: number, size: number) {
		const a = 0.1 * clamp(size / 140, 0.6, 1.4) * rand(0.8, 1.1);
		const f = rand(900, 1300);
		burst(t, f, 0.8, a, 0.006, 0.04);
		burst(t + 0.045, f * 0.85, 0.8, a * 0.55, 0.006, 0.05);
	}

	/** the wire's creak: a stick-slip buzz through a narrow band. returns a handle to steer it */
	function creaker(t: number) {
		const o = ac.createOscillator();
		o.type = 'sawtooth';
		o.frequency.value = 40;
		const bp = ac.createBiquadFilter();
		bp.type = 'bandpass';
		bp.frequency.value = 700;
		bp.Q.value = 7;
		const g = ac.createGain();
		g.gain.value = 0;
		o.connect(bp).connect(g).connect(out);
		o.start(t);
		return {
			/** tension 0..1, and how fast it is changing 0..1 */
			set(t: number, k: number, rate: number) {
				o.frequency.setTargetAtTime((34 + 46 * k) * rand(0.96, 1.04), t, 0.03);
				bp.frequency.setTargetAtTime(520 + 900 * k, t, 0.05);
				g.gain.setTargetAtTime(0.2 * clamp(rate, 0, 1) * (0.4 + 0.6 * k), t, 0.04);
			},
			stop(t: number) {
				g.gain.setTargetAtTime(0, t, 0.04);
				o.stop(t + 0.3);
			},
		};
	}

	return { clack, tick, thrum, flap, creaker };
}

export function line_sound(muted: () => boolean, calm: () => boolean) {
	let ac: AudioContext | null = null;
	let v: ReturnType<typeof voices>;
	let creak: ReturnType<ReturnType<typeof voices>['creaker']> | null = null;
	let last_thrum = 0, last_flap = 0, last_slide = 0;
	// the pulley: how far it has rolled since its last tick
	let roll = 0;

	/** call on a grab: makes the sound graph the first time, wakes it after that */
	function unlock() {
		if (ac) return void (ac.state === 'suspended' && ac.resume());
		const AC = window.AudioContext ?? (window as any).webkitAudioContext;
		if (!AC) return;
		ac = new AC() as AudioContext;
		v = voices(ac, ac.destination);
	}
	const live = () => !!ac && ac.state !== 'closed' && !muted();

	function clack() {
		if (live()) v.clack(ac!.currentTime + 0.005);
	}

	/** how fast the fastest peg slides, px/s: the pulley rolls that far and ticks once per ridge */
	function slide(speed: number) {
		if (!ac) return;
		const t = ac.currentTime;
		const dt = last_slide ? Math.min(0.1, t - last_slide) : 0;
		last_slide = t;
		if (!live() || speed < 15) return void (roll = 0);
		// a ridge every 18px of wire, and never more than ~16 a second: ticks, not a buzz
		const gap = Math.max(18, speed / 16);
		roll += speed * dt;
		const k = clamp(speed / 900, 0, 1);
		if (roll >= gap) {
			roll %= gap;
			v.tick(t + rand(0, 0.006), k);
		}
	}

	/** the wire's pull, px either way, and how fast that is changing, px/s */
	function creak_at(depth: number, rate: number) {
		if (!live() || calm()) return;
		const t = ac!.currentTime;
		const r = clamp((Math.abs(rate) - 25) / 500, 0, 1);
		if (!creak && (r <= 0 || depth < 10)) return;
		creak ??= v.creaker(t);
		creak.set(t, clamp(depth / 240, 0, 1), depth < 10 ? 0 : r);
	}
	function let_go(depth: number) {
		if (!ac) return;
		const t = ac.currentTime;
		creak?.stop(t);
		creak = null;
		if (!live() || depth < 14) return;
		// never a run of them: one now and then, fewer still for anyone who asked for less motion
		if (t - last_thrum < (calm() ? 2.5 : 0.6)) return;
		last_thrum = t;
		v.thrum(t + 0.005, depth, calm());
	}
	function flap(size: number) {
		if (!live()) return;
		const t = ac!.currentTime;
		if (t - last_flap < 0.15) return;
		last_flap = t;
		v.flap(t, size);
	}

	return { unlock, clack, slide, creak: creak_at, let_go, flap, close: () => ac?.close() };
}
