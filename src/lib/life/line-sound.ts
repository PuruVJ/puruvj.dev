// the pizza line's sounds, made on the fly (no files) and kept quiet: a little metal pulley wheel
// ticking along the wire while a peg slides (tk tk tk, faster the faster it rolls), the wire's low twang when it is pulled down and let go, and a paper
// tick when two prints bump. nothing is made until the first drag, and the shelf's sound switch
// (the same stored choice) silences it all.

export const MUTE_KEY = 'toys-muted';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function line_sound(muted: () => boolean, calm: () => boolean) {
	let ac: AudioContext | null = null;
	let out: GainNode, noise: AudioBuffer;
	let last_twang = 0;
	// the pulley: how far round it has rolled since its last tick, and when slide() last ran
	let roll = 0;
	let last_slide = 0;
	const ticks: number[] = [];

	/** call on a drag: makes the sound graph the first time, wakes it after that */
	function unlock() {
		if (ac) return void (ac.state === 'suspended' && ac.resume());
		const AC = window.AudioContext ?? (window as any).webkitAudioContext;
		if (!AC) return;
		ac = new AC() as AudioContext;
		out = ac.createGain();
		out.gain.value = 0.5;
		out.connect(ac.destination);
		noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
		const d = noise.getChannelData(0);
		// a rough grain, not smooth hiss: wood on a twisted wire catches and lets go
		for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (Math.random() < 0.08 ? 1 : 0.35);
	}
	const live = () => !!ac && ac.state === 'running' && !muted();

	/** one tick of the pulley: a ridge on a small steel wheel clicking over the wire. a sharp,
	 *  ringing click, high and narrow, with a tiny knock of the axle under it */
	function click(t: number, k: number) {
		const amp = (0.035 + 0.05 * k) * rand(0.75, 1.1);
		const s = ac!.createBufferSource();
		s.buffer = noise;
		const ring = ac!.createBiquadFilter();
		ring.type = 'bandpass';
		ring.frequency.value = rand(5200, 6400) * (0.92 + 0.12 * k);
		ring.Q.value = 9;
		const g = ac!.createGain();
		g.gain.setValueAtTime(0.0001, t);
		g.gain.exponentialRampToValueAtTime(amp, t + 0.0008);
		g.gain.exponentialRampToValueAtTime(0.0001, t + 0.018);
		s.connect(ring);
		ring.connect(g);
		g.connect(out);
		s.start(t, rand(0, 0.9));
		s.stop(t + 0.03);
		const o = ac!.createOscillator();
		const og = ac!.createGain();
		o.type = 'sine';
		o.frequency.value = rand(1900, 2300);
		og.gain.setValueAtTime(amp * 0.35, t);
		og.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);
		o.connect(og);
		og.connect(out);
		o.start(t);
		o.stop(t + 0.02);
	}

	/** how fast the fastest peg slides, px/s: the pulley rolls that far and ticks once per ridge */
	function slide(v: number) {
		if (!ac) return;
		const t = ac.currentTime;
		const dt = last_slide ? Math.min(0.1, t - last_slide) : 0;
		last_slide = t;
		if (!live() || v < 12) return void (roll = 0);
		// a ridge every 11px of wire; never more than ~45 ticks a second, past that it would buzz
		const SPACING = Math.max(11, v / 45);
		roll += v * dt;
		const k = clamp(v / 900, 0, 1);
		let n = 0;
		while (roll >= SPACING && n < 4) {
			roll -= SPACING;
			// spread the ticks over the frame that just passed, a hair uneven, like a real wheel
			click(t + (n * SPACING) / v + rand(0, 0.004), k);
			n++;
		}
		if (roll > SPACING) roll = 0;
	}

	/** the wire let go after a pull of depth px: a low pluck, higher the tighter it was pulled */
	function twang(depth: number) {
		if (!live() || depth < 14) return;
		const t = ac!.currentTime;
		// never a run of them: one now and then, fewer still for anyone who asked for less motion
		if (t - last_twang < (calm() ? 2.5 : 0.7)) return;
		last_twang = t;
		const k = clamp(depth / 240, 0, 1);
		const f0 = (72 + 150 * k) * rand(0.97, 1.03);
		const amp = (0.05 + 0.08 * k) * (calm() ? 0.6 : 1);
		const g = ac!.createGain();
		g.gain.setValueAtTime(0.0001, t);
		g.gain.exponentialRampToValueAtTime(amp, t + 0.006);
		g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
		const lp = ac!.createBiquadFilter();
		lp.type = 'lowpass';
		lp.frequency.setValueAtTime(f0 * 8, t);
		lp.frequency.exponentialRampToValueAtTime(f0 * 2, t + 0.3);
		lp.connect(g);
		g.connect(out);
		// a wire's partials sit a little sharp of whole numbers
		for (const [h, a] of [[1, 1], [2.01, 0.5], [3.03, 0.22]]) {
			const o = ac!.createOscillator();
			const og = ac!.createGain();
			o.type = 'triangle';
			// it drops a touch as the wire settles back
			o.frequency.setValueAtTime(f0 * h * 1.02, t);
			o.frequency.exponentialRampToValueAtTime(f0 * h, t + 0.25);
			og.gain.value = a;
			o.connect(og);
			og.connect(lp);
			o.start(t);
			o.stop(t + 0.5);
		}
	}

	/** two prints bumped, closing at v px/s: a dry little paper tick */
	function tick(v: number) {
		if (!live() || v < 40) return;
		const t = ac!.currentTime;
		while (ticks.length && t - ticks[0] > 0.25) ticks.shift();
		if (ticks.length >= 3) return;
		ticks.push(t);
		const amp = clamp(v / 1500, 0.015, 0.07);
		const s = ac!.createBufferSource();
		s.buffer = noise;
		const hp = ac!.createBiquadFilter();
		hp.type = 'bandpass';
		hp.frequency.value = rand(2800, 4200);
		hp.Q.value = 1.4;
		const g = ac!.createGain();
		// a tick and a fainter flutter of the paper right after
		g.gain.setValueAtTime(0.0001, t);
		g.gain.exponentialRampToValueAtTime(amp, t + 0.002);
		g.gain.exponentialRampToValueAtTime(amp * 0.08, t + 0.02);
		g.gain.exponentialRampToValueAtTime(amp * 0.3, t + 0.035);
		g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
		s.connect(hp);
		hp.connect(g);
		g.connect(out);
		s.start(t, rand(0, 0.9));
		s.stop(t + 0.08);
	}

	return { unlock, slide, twang, tick, close: () => ac?.close() };
}
