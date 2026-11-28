// the tear-off strips at the foot of the lost poster. pull one down and it rips along the
// perforation and drops; a plain click tears it for you. either way the page then goes where the
// strip says. without js (or before this wakes) they are ordinary links, and with reduced motion
// they stay ordinary links.

import { MUTE_KEY } from '$lib/life/line-sound.ts';

const RIP = 44; // px of pull before the paper gives
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** a ragged top edge, as a clip-path, for a strip that has just come off */
function ragged() {
	const pts = ['0% 100%', '100% 100%'];
	const n = 9;
	for (let i = n; i >= 0; i--) pts.push(`${((i / n) * 100).toFixed(1)}% ${rand(0, 5).toFixed(1)}px`);
	return `polygon(${pts.join(',')})`;
}

/** paper giving way: a short crackle of filtered noise. made on the first pull, silent when muted */
function rip_sound() {
	let ac: AudioContext | null = null;
	let noise: AudioBuffer;
	return {
		unlock() {
			if (ac) return void (ac.state === 'suspended' && ac.resume());
			const AC = window.AudioContext ?? (window as any).webkitAudioContext;
			if (!AC) return;
			ac = new AC() as AudioContext;
			noise = ac.createBuffer(1, ac.sampleRate * 0.4, ac.sampleRate);
			const d = noise.getChannelData(0);
			// fibres: mostly quiet, with sharp little snaps through it
			for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (Math.random() < 0.12 ? 1 : 0.18);
		},
		play() {
			let muted = false;
			try {
				muted = localStorage.getItem(MUTE_KEY) === '1';
			} catch {}
			if (!ac || ac.state !== 'running' || muted) return;
			const t = ac.currentTime;
			const s = ac.createBufferSource();
			s.buffer = noise;
			const bp = ac.createBiquadFilter();
			bp.type = 'bandpass';
			bp.frequency.setValueAtTime(rand(2600, 3200), t);
			bp.frequency.exponentialRampToValueAtTime(1400, t + 0.16);
			bp.Q.value = 0.9;
			const g = ac.createGain();
			g.gain.setValueAtTime(0.0001, t);
			g.gain.exponentialRampToValueAtTime(0.22, t + 0.01);
			g.gain.exponentialRampToValueAtTime(0.05, t + 0.09);
			g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
			s.connect(bp).connect(g).connect(ac.destination);
			s.start(t, rand(0, 0.15));
			s.stop(t + 0.22);
		},
	};
}

export function tear(list: HTMLElement) {
	if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	const poster = list.closest<HTMLElement>('.poster');
	const sound = rip_sound();
	let leaving = false;

	/** the strip comes off: a loose copy falls down the window, a stub stays on the poster */
	function rip(a: HTMLAnchorElement, dx: number, dy: number) {
		if (leaving) return;
		leaving = true;
		sound.play();
		// size from the layout box, place from the centre of the (tilted) box on screen
		const r = a.getBoundingClientRect();
		const w = a.offsetWidth;
		const h = a.offsetHeight;
		const tilt = parseFloat(getComputedStyle(poster ?? a).getPropertyValue('--tilt')) || 0;
		const loose = a.cloneNode(true) as HTMLElement;
		loose.removeAttribute('href');
		loose.setAttribute('aria-hidden', 'true');
		loose.classList.add('loose');
		Object.assign(loose.style, {
			position: 'fixed',
			left: `${r.left + r.width / 2 - w / 2}px`,
			top: `${r.top + r.height / 2 - h / 2}px`,
			width: `${w}px`,
			height: `${h}px`,
			margin: '0',
			zIndex: '60',
			transform: '',
			clipPath: ragged(),
		});
		// on <body>: inside the tilted poster, position: fixed would be fixed to the poster
		document.body.append(loose);
		a.closest('li')?.classList.add('torn');
		a.style.visibility = 'hidden';

		// fall: a slow start, a flutter from side to side, a turn that follows the way it was pulled
		const spin = rand(14, 30) * (dx < 0 ? -1 : 1) * (Math.abs(dx) > 4 ? 1.6 : 1);
		const drift = rand(30, 70) * Math.sign(spin);
		const H = innerHeight - r.top + 80;
		const frames: Keyframe[] = [];
		for (let i = 0; i <= 24; i++) {
			const k = i / 24;
			const y = dy + H * k * k;
			const x = drift * k + Math.sin(k * Math.PI * 2.2) * 14 * k;
			frames.push({ transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(tilt + spin * k * 3).toFixed(1)}deg)` });
		}
		loose.animate(frames, { duration: 1100, easing: 'linear', fill: 'forwards' });

		// the poster jumps a little on its tape
		poster?.animate(
			[{ transform: 'rotate(0deg)' }, { transform: `rotate(${(0.7 * Math.sign(spin)).toFixed(2)}deg)` }, { transform: 'rotate(-0.25deg)' }, { transform: 'rotate(0deg)' }],
			{ duration: 600, easing: 'ease-out', composite: 'add' },
		);

		setTimeout(() => location.assign(a.href), 420);
	}

	const offs: (() => void)[] = [];
	for (const a of list.querySelectorAll<HTMLAnchorElement>('a.strip')) {
		let id = -1;
		let x0 = 0;
		let y0 = 0;
		let moved = false;
		let dragged = false;

		const down = (e: PointerEvent) => {
			if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || leaving) return;
			sound.unlock();
			id = e.pointerId;
			x0 = e.clientX;
			y0 = e.clientY;
			moved = dragged = false;
			// the strips take vertical drags for themselves (touch-action in Strips.svelte), so a finger
			// pulls the paper instead of scrolling the page
			a.setPointerCapture(id);
		};
		const move = (e: PointerEvent) => {
			if (e.pointerId !== id) return;
			const dx = e.clientX - x0;
			const dy = e.clientY - y0;
			if (!moved && Math.hypot(dx, dy) < 5) return;
			moved = dragged = true;
			const pull = Math.max(0, dy);
			if (pull > RIP) {
				id = -1;
				a.style.transition = '';
				return rip(a, dx, pull * 0.6);
			}
			// the paper stretches, then gives: most of the pull goes into the fibres
			a.style.transition = 'none';
			a.style.transform = `translate(${(dx * 0.08).toFixed(1)}px, ${(pull * 0.6).toFixed(1)}px) rotate(${(dx * 0.12).toFixed(1)}deg)`;
		};
		const up = (e: PointerEvent) => {
			if (e.pointerId !== id) return;
			id = -1;
			// let go too soon: it springs back onto the poster
			a.style.transition = '';
			a.style.transform = '';
		};
		const click = (e: MouseEvent) => {
			if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
			e.preventDefault();
			// a pull that did not rip is not a click
			if (dragged) return void (dragged = false);
			sound.unlock();
			// give the audio a beat to wake on the first gesture
			requestAnimationFrame(() => rip(a, rand(-3, 3), 0));
		};
		const block = (e: Event) => e.preventDefault();

		a.addEventListener('pointerdown', down);
		a.addEventListener('pointermove', move);
		a.addEventListener('pointerup', up);
		a.addEventListener('pointercancel', up);
		a.addEventListener('click', click);
		a.addEventListener('dragstart', block);
		offs.push(() => {
			a.removeEventListener('pointerdown', down);
			a.removeEventListener('pointermove', move);
			a.removeEventListener('pointerup', up);
			a.removeEventListener('pointercancel', up);
			a.removeEventListener('click', click);
			a.removeEventListener('dragstart', block);
		});
	}

	// back from the next page (bfcache): the strip is gone, and stays gone, like on a real poster.
	// but the page has to work again
	const show = (e: PageTransitionEvent) => {
		if (!e.persisted) return;
		leaving = false;
		document.querySelectorAll('.loose').forEach((n) => n.remove());
	};
	addEventListener('pageshow', show);
	return () => {
		offs.forEach((f) => f());
		removeEventListener('pageshow', show);
	};
}
