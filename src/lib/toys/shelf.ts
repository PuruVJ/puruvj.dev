// the toy shelf: clay miniatures on the footer's top rule. poke, flick, drag, knock them over.
// loaded only after the page has settled (see Shelf.svelte). renders on demand: when nothing
// moves, nothing runs.
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { G, PI, mulberry } from './clay.ts';
import * as T from './toys.ts';

type Def = {
	id: string;
	label: string;
	href?: string;
	build: () => { g: THREE.Group; screen?: THREE.MeshStandardMaterial };
	/** where it sits, as a fraction of the shelf's width, and how far back (-1..1) */
	at: number;
	z?: number;
	turn?: number;
	scale?: number;
	round?: boolean;
	phone?: boolean;
	/** how strongly it rights itself */
	upright?: number;
	/** turns back to its resting angle once upright, so the screen and the beak face the room */
	face?: boolean;
};

const DEFS: Def[] = [
	{ id: 'duck', label: 'a duck. say hi →', href: 'mailto:devpuruvj@gmail.com', build: T.duck, at: 0.06, turn: 0.5, phone: true, upright: 0.7, face: true, scale: 1.7 },
	{ id: 'die-w', label: 'neodrag →', href: 'https://neodrag.dev', build: T.DICE.white, at: 0.15, z: 0.3, turn: 0.5, phone: true, scale: 1.45 },
	{ id: 'die-r', label: 'neodrag →', href: 'https://neodrag.dev', build: T.DICE.red, at: 0.185, z: -0.4, turn: -0.3, scale: 1.45 },
	{ id: 'banana', label: 'just a banana.', build: T.banana, at: 0.29, turn: 0.2, phone: true, scale: 1.35 },
	{ id: 'pebble', label: 'just a pebble.', build: T.pebble, at: 0.37, z: 0.3, round: true, scale: 1.4 },
	{ id: 'mic', label: 'talks →', href: '/speaking', build: T.mic, at: 0.47, turn: 0.4, upright: 1, scale: 1.05 },
	{ id: 'computer', label: 'macos web →', href: 'https://macos-web.app', build: T.computer, at: 0.59, turn: -0.35, phone: true, upright: 0.6, face: true, scale: 0.95 },
	{ id: 'papers', label: 'career →', href: '/career', build: T.papers, at: 0.71, turn: 0.15, scale: 1.25 },
	{ id: 'popper', label: 'neoconfetti →', href: 'https://npm.im/@neoconfetti/svelte', build: T.popper, at: 0.81, turn: 0.3, phone: true, upright: 1, scale: 1.3 },
	{ id: 'tree', label: 'ogygia, growing →', href: 'https://ogygiajs.dev', build: T.tree, at: 0.92, turn: 0.2, upright: 1.2, scale: 0.82 },
];

/** the shelf in world units: 1 unit is PX css pixels */
const DEPTH = 1.1;
const TILT = 0.2;

type Toy = Def & {
	outer: THREE.Group;
	inner: THREE.Group;
	body: CANNON.Body;
	size: THREE.Vector3;
	sq: { s: number; v: number };
	blob: THREE.Mesh;
	last: number;
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const dark_now = () => {
	const p = document.documentElement.getAttribute('data-pref-theme');
	return p === 'dark' || (p !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
};
const yield_ = () => new Promise<void>((r) => setTimeout(r, 0));

// ---------- sound: soft clay tocks, synthesised, after the first touch only ----------
function sounds(muted: () => boolean) {
	let ac: AudioContext | null = null;
	let out: GainNode | null = null;
	let noise: AudioBuffer | null = null;
	const unlock = () => {
		if (ac) return void (ac.state === 'suspended' && ac.resume());
		const AC = window.AudioContext ?? (window as any).webkitAudioContext;
		if (!AC) return;
		ac = new AC();
		out = ac.createGain();
		out.gain.value = 0.32;
		const lp = ac.createBiquadFilter();
		lp.type = 'lowpass';
		lp.frequency.value = 2400;
		out.connect(lp);
		lp.connect(ac.destination);
		noise = ac.createBuffer(1, ac.sampleRate / 4, ac.sampleRate);
		const d = noise.getChannelData(0);
		for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
	};
	const tock = (vel: number, size: number) => {
		if (!ac || !out || !noise || ac.state !== 'running' || muted()) return;
		const t = ac.currentTime;
		const amp = clamp((vel - 0.8) / 9, 0.02, 0.3);
		const f0 = rand(160, 210) / Math.sqrt(clamp(size, 0.3, 1.6));
		const o = ac.createOscillator();
		const g = ac.createGain();
		o.frequency.setValueAtTime(f0, t);
		o.frequency.exponentialRampToValueAtTime(f0 * 0.4, t + 0.12);
		g.gain.setValueAtTime(0.0001, t);
		g.gain.exponentialRampToValueAtTime(amp, t + 0.004);
		g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
		o.connect(g);
		g.connect(out);
		o.start(t);
		o.stop(t + 0.2);
		const s = ac.createBufferSource();
		const f = ac.createBiquadFilter();
		const n = ac.createGain();
		s.buffer = noise;
		f.type = 'lowpass';
		f.frequency.value = 320 + vel * 50;
		n.gain.setValueAtTime(0.0001, t);
		n.gain.exponentialRampToValueAtTime(amp * 0.5, t + 0.003);
		n.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
		s.connect(f);
		f.connect(n);
		n.connect(out);
		s.start(t);
		s.stop(t + 0.08);
	};
	return { unlock, tock, close: () => ac?.close() };
}

export async function mount(host: HTMLElement, opts: { phone: boolean; onReady?: () => void }) {
	const W0 = host.clientWidth;
	const H0 = host.clientHeight;
	// phones get five toys, spaced evenly along the narrow shelf
	const defs = opts.phone
		? DEFS.filter((d) => d.phone).map((d, i, all) => ({ ...d, at: (i + 0.5) / all.length, z: 0 }))
		: DEFS;

	// ---------- renderer, one canvas ----------
	const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
	renderer.setSize(W0, H0, false);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.shadowMap.autoUpdate = false;
	renderer.toneMapping = THREE.NeutralToneMapping;
	renderer.setClearColor(0x000000, 0);
	const canvas = renderer.domElement;
	canvas.className = 'toys-canvas';
	canvas.setAttribute('aria-hidden', 'true');

	const scene = new THREE.Scene();
	// world units: PX css pixels per unit, so the toys keep their size at any width
	const PX = opts.phone ? 56 : 66;
	let w = W0 / PX;
	let h = H0 / PX;
	const camera = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 40);
	const fwd = new THREE.Vector3(0, -Math.sin(TILT), -Math.cos(TILT));
	const up = new THREE.Vector3(0, Math.cos(TILT), -Math.sin(TILT));
	/** put the shelf's front edge exactly on the bottom row of the canvas, on the footer's rule */
	function frame_camera() {
		w = host.clientWidth / PX;
		h = host.clientHeight / PX;
		Object.assign(camera, { left: -w / 2, right: w / 2, top: h / 2, bottom: -h / 2 });
		const front = new THREE.Vector3(0, 0, DEPTH / 2);
		camera.position.copy(front).addScaledVector(up, h / 2).addScaledVector(fwd, -12);
		camera.up.copy(up);
		camera.lookAt(camera.position.clone().add(fwd));
		camera.updateProjectionMatrix();
		renderer.setSize(host.clientWidth, host.clientHeight, false);
	}
	frame_camera();

	// ---------- light: soft daylight, or one warm lamp in a dark room ----------
	const hemi = new THREE.HemisphereLight('#fff6ec', '#d8c8b2', 1);
	const key = new THREE.DirectionalLight('#fff1dd', 2);
	key.castShadow = true;
	key.shadow.mapSize.set(2048, 512);
	key.shadow.radius = 6;
	key.shadow.bias = -0.0006;
	key.shadow.normalBias = 0.02;
	const fill = new THREE.DirectionalLight('#b5c4e0', 0.4);
	fill.position.set(6, 2, 6);
	scene.add(hemi, key, key.target, fill);
	const catcher = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShadowMaterial({ opacity: 0.2 }));
	catcher.rotation.x = -PI / 2;
	catcher.receiveShadow = true;
	scene.add(catcher);

	function light_for(dark: boolean) {
		if (dark) {
			hemi.color.set('#9aa2b8');
			hemi.groundColor.set('#7a5838');
			hemi.intensity = 0.75;
			key.color.set('#ffd6a8');
			key.intensity = 1.9;
			fill.intensity = 0.22;
			renderer.toneMappingExposure = 0.98;
			(catcher.material as THREE.ShadowMaterial).opacity = 0.42;
		} else {
			hemi.color.set('#fff6ec');
			hemi.groundColor.set('#d8c8b2');
			hemi.intensity = 1.05;
			key.color.set('#fff1dd');
			key.intensity = 2.1;
			fill.intensity = 0.4;
			renderer.toneMappingExposure = 1;
			(catcher.material as THREE.ShadowMaterial).opacity = 0.2;
		}
		blobMat.opacity = dark ? 0.55 : 0.32;
	}
	function size_set() {
		catcher.scale.set(w + 2, DEPTH + 2, 1);
		const s = key.shadow.camera;
		Object.assign(s, { left: -w / 2 - 1, right: w / 2 + 1, top: 2, bottom: -2, near: 0.5, far: 30 });
		s.updateProjectionMatrix();
		key.position.set(-w * 0.15 - 2, 7, 3);
		key.target.position.set(-w * 0.15, 0, 0);
	}

	// a soft contact shadow under each toy, so it sits on the rule instead of floating
	const blobTex = (() => {
		const cv = document.createElement('canvas');
		cv.width = cv.height = 64;
		const g = cv.getContext('2d')!;
		const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
		gr.addColorStop(0, 'rgba(0,0,0,1)');
		gr.addColorStop(0.5, 'rgba(0,0,0,.45)');
		gr.addColorStop(1, 'rgba(0,0,0,0)');
		g.fillStyle = gr;
		g.fillRect(0, 0, 64, 64);
		return new THREE.CanvasTexture(cv);
	})();
	const blobMat = new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, opacity: 0.32, toneMapped: false });
	const blobGeo = new THREE.PlaneGeometry(1, 1);

	// ---------- physics ----------
	const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -15, 0) });
	world.allowSleep = true;
	(world.solver as CANNON.GSSolver).iterations = 10;
	world.defaultContactMaterial.friction = 0.55;
	world.defaultContactMaterial.restitution = 0.05;
	const walls: CANNON.Body[] = [];
	const plane = (pos: [number, number, number], e: [number, number, number]) => {
		const b = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
		b.position.set(...pos);
		b.quaternion.setFromEuler(...e);
		world.addBody(b);
		walls.push(b);
		return b;
	};
	plane([0, 0, 0], [-PI / 2, 0, 0]);
	plane([0, 0, -DEPTH / 2], [0, 0, 0]);
	plane([0, 0, DEPTH / 2], [0, PI, 0]);
	const left = plane([-w / 2, 0, 0], [0, PI / 2, 0]);
	const right = plane([w / 2, 0, 0], [0, -PI / 2, 0]);
	const lid = plane([0, h * 1.6, 0], [PI / 2, 0, 0]);
	const grab = new CANNON.Body({ mass: 0 });
	grab.collisionFilterGroup = 0;
	grab.collisionFilterMask = 0;
	world.addBody(grab);
	function walls_set() {
		left.position.x = -w / 2;
		right.position.x = w / 2;
		lid.position.y = h * 1.6;
	}

	// ---------- the toys, built a few at a time so the main thread stays free ----------
	const toys: Toy[] = [];
	const pick: THREE.Object3D[] = [];
	let screen: THREE.MeshStandardMaterial | undefined;
	const box = new THREE.Box3();
	const sound = sounds(() => muted);
	let muted = false;
	try {
		muted = localStorage.getItem('toys-muted') === '1';
	} catch {}

	for (const d of defs) {
		const built = d.build();
		if (built.screen) screen = built.screen;
		const g = built.g;
		g.scale.multiplyScalar(d.scale ?? 1);
		const inner = new THREE.Group();
		inner.add(g);
		box.setFromObject(inner);
		const c = box.getCenter(new THREE.Vector3());
		const size = box.getSize(new THREE.Vector3());
		g.position.sub(c);
		const outer = new THREE.Group();
		outer.add(inner);
		scene.add(outer);
		const shape = d.round ? new CANNON.Sphere(Math.max(size.x, size.y, size.z) / 2) : new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
		const mass = clamp(size.x * size.y * size.z * 2.2, 0.3, 2.2);
		const body = new CANNON.Body({ mass, shape, linearDamping: 0.16, angularDamping: 0.5, allowSleep: true, sleepSpeedLimit: 0.1, sleepTimeLimit: 0.4 });
		const x = (d.at - 0.5) * w;
		body.position.set(x, size.y / 2 + 0.002, (d.z ?? 0) * (DEPTH / 2 - Math.min(size.z, DEPTH) / 2) * 0.8);
		body.quaternion.setFromEuler(0, d.turn ?? 0, 0);
		world.addBody(body);
		body.sleep();
		const blob = new THREE.Mesh(blobGeo, blobMat);
		blob.rotation.x = -PI / 2;
		blob.renderOrder = -1;
		scene.add(blob);
		const t: Toy = { ...d, outer, inner, body, size, sq: { s: 0, v: 0 }, blob, last: 0 };
		g.traverse((m) => {
			if ((m as THREE.Mesh).isMesh) {
				m.userData.toy = t;
				pick.push(m);
			}
		});
		body.addEventListener('collide', (e: any) => {
			const iv = Math.abs(e.contact.getImpactVelocityAlongNormal());
			if (iv < 1) return;
			t.sq.v = clamp(t.sq.v + Math.min(iv, 10) * 0.28, -4, 4);
			const now = performance.now();
			if (now - t.last > 90) {
				t.last = now;
				sound.tock(iv, Math.cbrt(size.x * size.y * size.z) * 2);
			}
		});
		toys.push(t);
		sync(t);
		await yield_();
	}

	function sync(t: Toy) {
		const b = t.body;
		t.outer.position.set(b.position.x, b.position.y, b.position.z);
		t.outer.quaternion.set(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w);
		// the contact shadow stays on the shelf, fading as the toy lifts off it
		const lift = clamp(b.position.y - t.size.y / 2, 0, 2);
		const k = Math.max(0, 1 - lift * 1.6);
		t.blob.position.set(b.position.x, 0.003, b.position.z);
		t.blob.scale.set(t.size.x * 1.15 * (1 + lift * 0.5), Math.min(t.size.z, DEPTH) * 1.1, 1);
		t.blob.visible = k > 0.02;
		(t.blob as any).material = blobMat;
		t.blob.scale.multiplyScalar(0.6 + 0.4 * k);
	}

	// ---------- labels and the mute toggle ----------
	const label = document.createElement('a');
	label.className = 'toys-label';
	host.append(canvas, label);
	const mute = document.createElement('button');
	mute.type = 'button';
	mute.className = 'toys-mute';
	const mute_text = () => {
		mute.textContent = muted ? 'sound off' : 'sound on';
		mute.setAttribute('aria-pressed', String(!muted));
	};
	mute_text();
	mute.addEventListener('click', () => {
		muted = !muted;
		try {
			localStorage.setItem('toys-muted', muted ? '1' : '0');
		} catch {}
		mute_text();
	});
	host.append(mute);

	// ---------- interaction ----------
	const ray = new THREE.Raycaster();
	const ndc = new THREE.Vector2();
	const dragPlane = new THREE.Plane();
	const hitP = new THREE.Vector3();
	let press: null | { t: Toy; x: number; y: number; at: number; point: THREE.Vector3; id: number; dragging: boolean; e: PointerEvent } = null;
	let joint: CANNON.PointToPointConstraint | null = null;
	let shown: Toy | null = null;
	let hideT = 0;

	function set_ray(e: PointerEvent) {
		const r = canvas.getBoundingClientRect();
		ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
		ray.setFromCamera(ndc, camera);
	}
	function hit(e: PointerEvent) {
		set_ray(e);
		return ray.intersectObjects(pick, false)[0];
	}
	function show(t: Toy | null) {
		clearTimeout(hideT);
		if (!t) {
			hideT = window.setTimeout(() => label.classList.remove('on'), 900);
			shown = null;
			return;
		}
		shown = t;
		label.textContent = t.label;
		if (t.href) label.href = t.href;
		else label.removeAttribute('href');
		label.classList.add('on');
		place_label();
	}
	function place_label() {
		if (!shown) return;
		const v = shown.outer.position.clone();
		v.y += shown.size.y / 2 + 0.15;
		v.project(camera);
		const x = clamp((v.x * 0.5 + 0.5) * host.clientWidth, 40, host.clientWidth - 40);
		const y = (-v.y * 0.5 + 0.5) * host.clientHeight;
		label.style.transform = `translate(${x.toFixed(1)}px, ${Math.max(2, y).toFixed(1)}px) translate(-50%, -100%)`;
	}

	canvas.addEventListener('pointerdown', (e) => {
		sound.unlock();
		const hh = hit(e);
		if (!hh) return;
		e.preventDefault();
		canvas.setPointerCapture(e.pointerId);
		press = { t: hh.object.userData.toy, x: e.clientX, y: e.clientY, at: performance.now(), point: hh.point.clone(), id: e.pointerId, dragging: false, e };
		show(press.t);
		wake();
	});
	canvas.addEventListener('pointermove', (e) => {
		if (press && e.pointerId === press.id) {
			press.e = e;
			if (!press.dragging && Math.hypot(e.clientX - press.x, e.clientY - press.y) >= 5) start_drag();
			if (press.dragging) move_drag(e);
			return;
		}
		if (e.pointerType === 'mouse') {
			const hh = hit(e);
			const t = hh ? (hh.object.userData.toy as Toy) : null;
			canvas.style.cursor = t ? 'grab' : '';
			if (t !== shown) show(t);
		}
	});
	canvas.addEventListener('pointerleave', () => {
		if (!press) show(null);
	});
	function start_drag() {
		if (!press) return;
		const b = press.t.body;
		const p = press.point;
		press.dragging = true;
		b.wakeUp();
		// drag in a plane facing the viewer, so up and down on screen lift and drop the toy
		dragPlane.setFromNormalAndCoplanarPoint(fwd.clone().negate(), p);
		const local = b.pointToLocalFrame(new CANNON.Vec3(p.x, p.y, p.z));
		grab.position.set(p.x, p.y, p.z);
		joint = new CANNON.PointToPointConstraint(b, local, grab, new CANNON.Vec3(0, 0, 0), b.mass * 60);
		world.addConstraint(joint);
		b.angularDamping = 0.9;
		press.t.sq.v -= 2;
		canvas.style.cursor = 'grabbing';
		move_drag(press.e);
	}
	function move_drag(e: PointerEvent) {
		set_ray(e);
		if (!ray.ray.intersectPlane(dragPlane, hitP)) return;
		grab.position.set(clamp(hitP.x, -w / 2 + 0.3, w / 2 - 0.3), clamp(hitP.y, 0.1, h * 1.3), clamp(hitP.z, -DEPTH / 2 + 0.2, DEPTH / 2 - 0.2));
		press?.t.body.wakeUp();
		wake();
	}
	function end(e: PointerEvent, cancelled: boolean) {
		if (!press || e.pointerId !== press.id) return;
		const t = press.t;
		if (press.dragging) {
			if (joint) world.removeConstraint(joint);
			joint = null;
			t.body.angularDamping = 0.5;
			const v = t.body.velocity;
			const s = v.length();
			if (s > 12) v.scale(12 / s, v);
			canvas.style.cursor = 'grab';
		} else if (!cancelled) poke(t, press.point);
		press = null;
		if (e.pointerType !== 'mouse') show(null);
		wake();
	}
	canvas.addEventListener('pointerup', (e) => end(e, false));
	canvas.addEventListener('pointercancel', (e) => end(e, true));

	/** a light touch: hop, spin away from where it was poked */
	function poke(t: Toy, at: THREE.Vector3) {
		const b = t.body;
		b.wakeUp();
		const dx = clamp((t.outer.position.x - at.x) * 4, -1.5, 1.5);
		b.velocity.set(b.velocity.x + dx + rand(-0.6, 0.6), Math.max(b.velocity.y, 3.6), b.velocity.z + rand(-0.3, 0.3));
		b.angularVelocity.set(rand(-3, 3), rand(-3, 3), rand(-3, 3) - dx * 2);
		t.sq.v -= 3;
	}

	// ---------- the loop: runs only while something moves, on screen, in a visible tab ----------
	const UP = new CANNON.Vec3(0, 1, 0);
	const FWD = new CANNON.Vec3(0, 0, 1);
	world.addEventListener('preStep', () => {
		for (const t of toys) {
			if (!t.upright || (press?.dragging && press.t === t)) continue;
			const b = t.body;
			const u = b.quaternion.vmult(UP);
			const sp = b.velocity.length();
			if (u.y < 0.985 && b.position.y < t.size.y && sp < 3) {
				const ax = u.cross(UP);
				if (u.y < -0.95) ax.set(1, 0, 0);
				const k = t.upright * b.mass * 26 * (1 - sp / 3);
				b.torque.x += ax.x * k - b.angularVelocity.x * b.mass * 0.6;
				b.torque.z += ax.z * k - b.angularVelocity.z * b.mass * 0.6;
			}
			if (t.face && u.y > 0.95 && sp < 1.2) {
				const f = b.quaternion.vmult(FWD);
				let err = Math.atan2(f.x, f.z) - (t.turn ?? 0);
				err = Math.atan2(Math.sin(err), Math.cos(err));
				if (Math.abs(err) > 0.06) b.torque.y += (-err * 2.4 - b.angularVelocity.y * 0.8) * b.mass;
			}
		}
	});

	let raf = 0;
	let last = 0;
	let onscreen = true;
	let frame12 = -1;
	let calm = 0;
	const boilR = mulberry(99);
	function wake() {
		if (raf || !onscreen || document.hidden) return;
		last = performance.now();
		raf = requestAnimationFrame(tick);
	}
	function moving() {
		if (press) return true;
		for (const t of toys) if (t.body.sleepState !== CANNON.Body.SLEEPING || Math.abs(t.sq.s) > 0.002 || Math.abs(t.sq.v) > 0.02) return true;
		return false;
	}
	function tick(now: number) {
		raf = 0;
		const dt = Math.min((now - last) / 1000, 0.05);
		last = now;
		if (press && !press.dragging && now - press.at > 220) start_drag();
		world.step(1 / 60, dt, 4);
		for (const t of toys) {
			const b = t.body;
			if (b.position.y < -1 || Math.abs(b.position.x) > w / 2 + 1) {
				b.position.set(clamp(b.position.x, -w / 2 + 0.5, w / 2 - 0.5), h, 0);
				b.velocity.setZero();
			}
			const q = t.sq;
			q.v += (-240 * q.s - 11 * q.v) * dt;
			q.s = clamp(q.s + q.v * dt, -0.3, 0.32);
			t.inner.scale.set(1 + q.s * 0.5, 1 - q.s, 1 + q.s * 0.5);
			t.inner.position.y = (-t.size.y / 2) * q.s;
			sync(t);
		}
		const go = moving();
		// the clay boils at 12fps while it is played with, then settles still
		calm = go ? 0 : calm + dt;
		const f = Math.floor(now / (1000 / 12));
		if (f !== frame12) {
			frame12 = f;
			if (go) {
				G.uBoilAmp.value = 0.0035;
				G.uBoilOff.value.set(boilR() * 40, boilR() * 40, boilR() * 40);
				G.uBoilPhase.value = boilR() * 6.28;
			}
		}
		if (!go) G.uBoilAmp.value = 0;
		place_label();
		draw();
		if (go) wake();
	}
	function draw() {
		renderer.shadowMap.needsUpdate = true;
		renderer.render(scene, camera);
	}

	// ---------- theme, size, visibility ----------
	const mq = matchMedia('(prefers-color-scheme: dark)');
	const retheme = () => {
		light_for(dark_now());
		if (screen) screen.emissiveIntensity = dark_now() ? 0.75 : 0.5;
		draw();
	};
	const mo = new MutationObserver(retheme);
	mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-pref-theme'] });
	mq.addEventListener('change', retheme);
	const ro = new ResizeObserver(() => {
		frame_camera();
		size_set();
		walls_set();
		for (const t of toys) {
			const b = t.body;
			b.position.x = clamp(b.position.x, -w / 2 + t.size.x / 2, w / 2 - t.size.x / 2);
			sync(t);
		}
		draw();
	});
	const io = new IntersectionObserver((es) => {
		onscreen = es.some((e) => e.isIntersecting);
		if (onscreen) wake();
		else if (raf) (cancelAnimationFrame(raf), (raf = 0));
	});
	const vis = () => {
		if (document.hidden && raf) (cancelAnimationFrame(raf), (raf = 0));
		else wake();
	};
	document.addEventListener('visibilitychange', vis);

	size_set();
	light_for(dark_now());
	// compile shaders off the main thread where the browser can, then show the first frame
	await renderer.compileAsync(scene, camera).catch(() => {});
	draw();
	ro.observe(host);
	io.observe(host);
	opts.onReady?.();
	if (import.meta.env.DEV) (window as any).__shelf = { toys, world, moving };

	return () => {
		cancelAnimationFrame(raf);
		ro.disconnect();
		io.disconnect();
		mo.disconnect();
		mq.removeEventListener('change', retheme);
		document.removeEventListener('visibilitychange', vis);
		sound.close();
		renderer.dispose();
		canvas.remove();
		label.remove();
		mute.remove();
	};
}
