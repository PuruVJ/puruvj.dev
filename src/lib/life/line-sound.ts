// the pizza line's sounds, made on the fly (no files) and kept quiet: a wooden peg scraping along
// the wire while it slides, the wire's low twang when it is pulled down and let go, and a paper
// tick when two prints bump. nothing is made until the first drag, and the shelf's sound switch
// (the same stored choice) silences it all.

export const MUTE_KEY = 'toys-muted';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function line_sound(muted: () => boolean, calm: () => boolean) {
	let ac: AudioContext | null = null;
	let out: GainNode, noise: AudioBuffer;
	let scrape: GainNode, tone: BiquadFilterNode;
	let last_twang = 0;
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
		// the scrape runs all the time, silent until a peg moves
		const src = ac.createBufferSource();
		src.buffer = noise;
		src.loop = true;
		tone = ac.createBiquadFilter();
		tone.type = 'bandpass';
		tone.Q.value = 0.9;
		tone.frequency.value = 900;
		scrape = ac.createGain();
		scrape.gain.value = 0;
		src.connect(tone);
		tone.connect(scrape);
		scrape.connect(out);
		src.start();
	}
	const live = () => !!ac && ac.state === 'running' && !muted();

	/** how fast the fastest peg slides, px/s; its level and brightness follow */
	function slide(v: number) {
		if (!ac) return;
		const t = ac.currentTime;
		const k = live() ? clamp((v - 25) / 900, 0, 1) : 0;
		scrape.gain.setTargetAtTime(0.11 * Math.sqrt(k), t, 0.03);
		tone.frequency.setTargetAtTime(700 + 2600 * k, t, 0.05);
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
