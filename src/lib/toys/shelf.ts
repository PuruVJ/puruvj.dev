// the toy shelf: clay miniatures on the footer's top rule. poke, flick, drag, knock them over.
// loaded only after the page has settled (see Shelf.svelte). renders on demand: when nothing
// moves, nothing runs. the physics (rapier, a wasm build) is fetched only when someone reaches
// for a toy: until then they just sit there, which needs no physics at all.
import * as THREE from 'three';
import type * as RAPIER from '@dimforge/rapier3d';
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
	phone?: boolean;
	/** where its weight sits, as a fraction of its height. a heavy base (the mic, the pot) sits
	 *  low, so it rocks back when nudged and only falls when pushed past its tipping point. */
	com?: number;
	/** what it is made of: clay is soft and dead, the dice are hard and bounce a little */
	stuff?: 'clay' | 'hard';
};

const DEFS: Def[] = [
	{ id: 'duck', label: 'a duck. dm me on x ↗', href: 'https://x.com/puruvjdev', build: T.duck, at: 0.06, turn: 0.5, phone: true, com: 0.38, scale: 1.7 },
	{ id: 'die-w', label: 'neodrag →', href: 'https://neodrag.dev', build: T.DICE.white, at: 0.15, z: 0.3, turn: 0.5, phone: true, stuff: 'hard', scale: 1.45 },
	{ id: 'die-r', label: 'neodrag →', href: 'https://neodrag.dev', build: T.DICE.red, at: 0.185, z: -0.4, turn: -0.3, stuff: 'hard', scale: 1.45 },
	{ id: 'banana', label: 'just a banana.', build: T.banana, at: 0.29, turn: 0.2, phone: true, scale: 1.35 },
	{ id: 'pebble', label: 'just a pebble.', build: T.pebble, at: 0.37, z: 0.3, stuff: 'hard', scale: 1.4 },
	{ id: 'mic', label: 'talks →', href: '/speaking', build: T.mic, at: 0.47, turn: 0.4, com: 0.1, scale: 1.05 },
	{ id: 'computer', label: 'macos web →', href: 'https://macos-web.app', build: T.computer, at: 0.59, turn: -0.35, phone: true, com: 0.42, scale: 0.95 },
	{ id: 'papers', label: 'career →', href: '/career', build: T.papers, at: 0.71, turn: 0.15, scale: 1.25 },
	{ id: 'popper', label: 'neoconfetti →', href: 'https://npm.im/@neoconfetti/svelte', build: T.popper, at: 0.81, turn: 0.3, phone: true, com: 0.3, scale: 1.3 },
	{ id: 'tree', label: 'ogygia, growing →', href: 'https://ogygiajs.dev', build: T.tree, at: 0.92, turn: 0.2, com: 0.22, scale: 0.82 },
];

/** the shelf in world units: 1 unit is PX css pixels */
const DEPTH = 1.1;
const TILT = 0.2;

type Toy = Def & {
	outer: THREE.Group;
	inner: THREE.Group;
	body?: RAPIER.RigidBody;
	collider?: RAPIER.Collider;
	/** how long it has been nearly still on something, in seconds */
	calm: number;
	size: THREE.Vector3;
	/** height of the body's origin (the middle of its drawing) above its base */
	low: number;
	/** its outline for the physics: the drawing's own points, wrapped tight (a convex hull) */
	hull: Float32Array;
	mass: number;
	/** the physics pose after the last step and the one before, drawn blended between them */
	pos: THREE.Vector3;
	quat: THREE.Quaternion;
	pos0: THREE.Vector3;
	quat0: THREE.Quaternion;
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
	/** a squeeze toy pressed: the soft squish of the rubber, then the little whistle of air forced
	 *  through its squeaker. a clean, round tone (no buzz), a short rise as the air starts, a wobble
	 *  as the rubber flexes, and a breath of air. hard is 0..1; a harder squeeze is louder and higher */
	const squeak = (hard: number) => {
		if (!ac || !noise || ac.state !== 'running' || muted()) return;
		const t = ac.currentTime;
		const f0 = rand(1500, 1750) * (1 + 0.15 * hard);
		const dur = rand(0.13, 0.17) + 0.03 * hard;
		const amp = 0.03 + 0.04 * hard;
		const g = ac.createGain();
		g.connect(ac.destination);
		g.gain.setValueAtTime(0.0001, t);
		g.gain.exponentialRampToValueAtTime(amp, t + 0.02);
		g.gain.setValueAtTime(amp * 0.9, t + dur * 0.6);
		g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
		// the whistle: a sine and a softer octave, sliding up as the air gets going, sagging at the end
		const tone = (mult: number, level: number) => {
			const o = ac!.createOscillator();
			const og = ac!.createGain();
			o.type = 'sine';
			o.frequency.setValueAtTime(f0 * mult * 0.82, t);
			o.frequency.exponentialRampToValueAtTime(f0 * mult, t + 0.035);
			o.frequency.exponentialRampToValueAtTime(f0 * mult * 0.93, t + dur);
			og.gain.value = level;
			o.connect(og);
			og.connect(g);
			return o;
		};
		const o1 = tone(1, 1);
		const o2 = tone(2, 0.18);
		// the rubber flexing: a gentle, quick wobble
		const lfo = ac.createOscillator();
		const lg = ac.createGain();
		lfo.frequency.value = rand(11, 15);
		lg.gain.value = f0 * 0.012;
		lfo.connect(lg);
		lg.connect(o1.frequency);
		// air through the hole, soft and quiet
		const s = ac.createBufferSource();
		const nf = ac.createBiquadFilter();
		const ng = ac.createGain();
		s.buffer = noise;
		nf.type = 'bandpass';
		nf.frequency.value = f0 * 1.4;
		nf.Q.value = 3;
		ng.gain.value = 0.12;
		s.connect(nf);
		nf.connect(ng);
		ng.connect(g);
		// the squish: a low, dull press of the rubber body, just before the air
		const sq = ac.createBufferSource();
		const sf = ac.createBiquadFilter();
		const sg = ac.createGain();
		sq.buffer = noise;
		sf.type = 'lowpass';
		sf.frequency.value = 420;
		sg.gain.setValueAtTime(0.0001, t);
		sg.gain.exponentialRampToValueAtTime(amp * 1.4, t + 0.008);
		sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
		sq.connect(sf);
		sf.connect(sg);
		sg.connect(ac.destination);
		for (const n of [o1, o2, lfo, s, sq]) {
			n.start(t);
			n.stop(t + dur + 0.02);
		}
	};
	return { unlock, tock, squeak, close: () => ac?.close() };
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
		box.setFromObject(inner, true);
		g.position.sub(box.getCenter(new THREE.Vector3()));
		inner.updateMatrixWorld(true);
		const hull = hull_points(inner);
		box.setFromArray(hull);
		const size = box.getSize(new THREE.Vector3());
		const low = -box.min.y;
		const outer = new THREE.Group();
		outer.add(inner);
		scene.add(outer);
		const x = (d.at - 0.5) * w;
		const pos = new THREE.Vector3(x, low, (d.z ?? 0) * (DEPTH / 2 - Math.min(size.z, DEPTH) / 2) * 0.8);
		const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, d.turn ?? 0, 0));
		const blob = new THREE.Mesh(blobGeo, blobMat);
		blob.rotation.x = -PI / 2;
		blob.renderOrder = -1;
		scene.add(blob);
		const mass = clamp(size.x * size.y * size.z * 2.2, 0.3, 2.2);
		const t: Toy = { ...d, outer, inner, size, low, hull, mass, pos, quat, pos0: pos.clone(), quat0: quat.clone(), blob, last: 0, calm: 0 };
		g.traverse((m) => {
			if ((m as THREE.Mesh).isMesh) {
				m.userData.toy = t;
				pick.push(m);
			}
		});
		toys.push(t);
		sync(t, 1);
		await yield_();
	}

	/** every vertex of the drawing, in the toy's own frame, thinned to a few hundred */
	function hull_points(o: THREE.Object3D) {
		const all: number[] = [];
		const v = new THREE.Vector3();
		o.traverse((m) => {
			const geo = (m as THREE.Mesh).isMesh && (m as THREE.Mesh).geometry;
			if (!geo) return;
			const p = geo.attributes.position;
			for (let i = 0; i < p.count; i++) {
				v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld);
				all.push(v.x, v.y, v.z);
			}
		});
		const n = all.length / 3;
		const every = Math.max(1, Math.floor(n / 600));
		const out: number[] = [];
		for (let i = 0; i < n; i += every) out.push(all[i * 3], all[i * 3 + 1], all[i * 3 + 2]);
		return new Float32Array(out);
	}

	function sync(t: Toy, a: number) {
		t.outer.position.lerpVectors(t.pos0, t.pos, a);
		t.outer.quaternion.slerpQuaternions(t.quat0, t.quat, a);
		const p = t.outer.position;
		// the contact shadow stays on the shelf, fading as the toy lifts off it
		const lift = clamp(p.y - t.low, 0, 2);
		const k = Math.max(0, 1 - lift * 1.6);
		t.blob.position.set(p.x, 0.003, p.z);
		t.blob.scale.set(t.size.x * 1.15 * (1 + lift * 0.5), Math.min(t.size.z, DEPTH) * 1.1, 1);
		t.blob.visible = k > 0.02;
		t.blob.scale.multiplyScalar(0.6 + 0.4 * k);
	}

	// ---------- physics: rapier, fetched the first time someone reaches for a toy ----------
	// true scale: one unit is about 10 cm, so gravity is 9.81 m/s² = 98 units/s². at this scale
	// small things fall fast and land hard, which is what makes them read as real objects.
	const GRAVITY = 98.1;
	// a fixed step, so the toys behave the same at 30fps and at 144fps. the drawing is blended
	// between the last two steps, so motion stays smooth whatever the screen's own rate.
	const STEP = 1 / 120;
	type Phys = {
		R: typeof RAPIER;
		world: RAPIER.World;
		events: RAPIER.EventQueue;
		walls: Record<'left' | 'right' | 'lid', RAPIER.RigidBody>;
		by_collider: Map<number, Toy>;
	};
	let phys: Phys | null = null;
	let loading = false;
	let dead = false;
	/** things done to the toys before the physics arrived: replayed once it has */
	let queued: (() => void)[] = [];
	function need() {
		if (loading) return;
		loading = true;
		import('@dimforge/rapier3d')
			.then((R) => {
				if (dead) return;
				phys = build(R);
				for (const f of queued) f();
				queued = [];
				if (press && press.want) start_drag();
				wake();
			})
			.catch(() => (loading = false));
	}

	function build(R: typeof RAPIER): Phys {
		const world = new R.World({ x: 0, y: -GRAVITY, z: 0 });
		world.timestep = STEP;
		// a few more solver passes than the default: cheap for ten bodies, and stacks stay put
		world.numSolverIterations = 8;
		const Rule = R.CoefficientCombineRule;
		// the slab the toys stand on, and invisible walls (sides, front, back, lid). the walls are
		// slick, so a tumbling toy can never wedge between them and hang in the air.
		const slab = (x: number, y: number, z: number, hx: number, hy: number, hz: number, floor = false) => {
			const b = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x, y, z));
			const c = R.ColliderDesc.cuboid(hx, hy, hz);
			if (floor) c.setFriction(0.6).setRestitution(0.15);
			else c.setFriction(0).setFrictionCombineRule(Rule.Min).setRestitution(0.1);
			world.createCollider(c, b);
			return b;
		};
		const T = 2;
		slab(0, -T, 0, 500, T, 50, true);
		slab(0, 0, -DEPTH / 2 - T, 500, 500, T);
		slab(0, 0, DEPTH / 2 + T, 500, 500, T);
		const walls = {
			left: slab(-w / 2 - T, 0, 0, T, 500, 50),
			right: slab(w / 2 + T, 0, 0, T, 500, 50),
			lid: slab(0, h * 1.6 + T, 0, 500, T, 50),
		};
		const by_collider = new Map<number, Toy>();
		for (const t of toys) {
			const hard = t.stuff === 'hard';
			const body = world.createRigidBody(
				R.RigidBodyDesc.dynamic()
					.setTranslation(t.pos.x, t.pos.y + 0.001, t.pos.z)
					.setRotation(t.quat)
					// a little air, and some rolling resistance: rapier has no rolling friction, so a
					// round thing would otherwise roll off the end of the shelf
					.setLinearDamping(0.08)
					.setAngularDamping(hard ? 0.35 : 0.6)
					// a hard throw moves further than its own size in one step: sweep it, so it can
					// never pass through the shelf or a wall
					.setCcdEnabled(true)
					.setSleeping(true),
			);
			// its weight: where `com` says (a heavy base sits low), with a spin resistance close to
			// that of a solid block of its size
			const s = t.size;
			const m = t.mass;
			const k = m / 12;
			const col = (R.ColliderDesc.convexHull(t.hull) ?? R.ColliderDesc.cuboid(s.x / 2, s.y / 2, s.z / 2))
				.setMassProperties(
					m,
					{ x: 0, y: -t.low + (t.com ?? 0.5) * s.y, z: 0 },
					{ x: k * (s.y * s.y + s.z * s.z), y: k * (s.x * s.x + s.z * s.z), z: k * (s.x * s.x + s.y * s.y) },
					{ x: 0, y: 0, z: 0, w: 1 },
				)
				// clay is soft and dead: grippy, and it barely bounces. the dice and the pebble are
				// hard: they skid a little and clack back up.
				.setFriction(hard ? 0.45 : 0.75)
				.setRestitution(hard ? 0.45 : 0.04)
				.setRestitutionCombineRule(hard ? Rule.Average : Rule.Min)
				.setActiveEvents(R.ActiveEvents.CONTACT_FORCE_EVENTS)
				// only knocks loud enough to hear: resting weight on the shelf stays well below this
				.setContactForceEventThreshold((m * 1.8) / STEP);
			const c = world.createCollider(col, body);
			by_collider.set(c.handle, t);
			t.body = body;
			t.collider = c;
		}
		return { R, world, events: new R.EventQueue(true), walls, by_collider };
	}

	function walls_set() {
		if (!phys) return;
		phys.walls.left.setTranslation({ x: -w / 2 - 2, y: 0, z: 0 }, true);
		phys.walls.right.setTranslation({ x: w / 2 + 2, y: 0, z: 0 }, true);
		phys.walls.lid.setTranslation({ x: 0, y: h * 1.6 + 2, z: 0 }, true);
	}

	/** put a toy somewhere without it flying there: it lands there, still */
	function place(t: Toy, x: number, y: number, z: number, still: boolean) {
		t.pos.set(x, y, z);
		t.pos0.copy(t.pos);
		if (!t.body) return;
		t.body.setTranslation({ x, y, z }, true);
		if (still) {
			t.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
			t.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
		}
	}

	// the hand: a spring from the held spot to the pointer, critically damped, that also carries the
	// toy's own weight. it is a force, not a rigid joint, so a toy jammed against a wall or another
	// toy pushes back instead of exploding through it.
	const HAND = 32;
	const grab = { local: new THREE.Vector3(), target: new THREE.Vector3(), vel: new THREE.Vector3(), at: 0 };
	const tmpV = new THREE.Vector3();
	const tmpQ = new THREE.Quaternion();
	function hold(t: Toy) {
		const b = t.body!;
		const r = b.rotation();
		const p = b.translation();
		tmpQ.set(r.x, r.y, r.z, r.w);
		const at = tmpV.copy(grab.local).applyQuaternion(tmpQ).add(p as THREE.Vector3Like);
		const v = b.velocityAtPoint(at);
		// the pointer's own speed fades once it stops moving, so a held toy comes to rest
		if (performance.now() - grab.at > 40) grab.vel.multiplyScalar(0.85);
		const ax = HAND * HAND * (grab.target.x - at.x) + 2 * HAND * (grab.vel.x - v.x);
		const ay = HAND * HAND * (grab.target.y - at.y) + 2 * HAND * (grab.vel.y - v.y) + GRAVITY;
		const az = HAND * HAND * (grab.target.z - at.z) + 2 * HAND * (grab.vel.z - v.z);
		// no superhuman hands: about ten g at most
		const a = Math.hypot(ax, ay, az);
		const cap = a > 1000 ? 1000 / a : 1;
		const k = t.mass * STEP * cap;
		b.applyImpulseAtPoint({ x: ax * k, y: ay * k, z: az * k }, at, true);
	}

	/** what rapier leaves out: a real thing resting on a shelf touches it with a patch, not a point,
	 *  and that patch resists spinning in place and rolling. without it a banana spins like a top on
	 *  its curve. it is a steady drag, like friction, so it stops things in a moment, not slowly
	 *  forever. and once something is barely moving on a surface, it is put to sleep. */
	function rest(P: Phys, t: Toy) {
		const b = t.body!;
		const c = t.collider!;
		let touching = false;
		P.world.contactPairsWith(c, (o) => {
			if (!touching) P.world.contactPair(c, o, (m) => void (touching ||= m.numContacts() > 0));
		});
		if (!touching) return void (t.calm = 0);
		const w = b.angvel();
		// spin about the vertical, then the roll that is left
		const spin = w.y;
		const ds = Math.min(Math.abs(spin), 24 * STEP) * Math.sign(spin);
		const rx = w.x;
		const rz = w.z;
		const roll = Math.hypot(rx, rz);
		const k = roll > 0 ? Math.max(0, 1 - (5 * STEP) / roll) : 0;
		b.setAngvel({ x: rx * k, y: spin - ds, z: rz * k }, false);
		const v = b.linvel();
		const still = Math.hypot(v.x, v.y, v.z) < 0.25 && Math.hypot(rx * k, spin - ds, rz * k) < 0.5;
		t.calm = still ? t.calm + STEP : 0;
		if (t.calm > 0.4) b.sleep();
	}

	function step() {
		const P = phys!;
		if (press?.dragging) hold(press.t);
		for (const t of toys) {
			t.pos0.copy(t.pos);
			t.quat0.copy(t.quat);
		}
		P.world.step(P.events);
		P.events.drainContactForceEvents((e) => {
			const dv = e.totalForceMagnitude() * STEP;
			for (const h of [e.collider1(), e.collider2()]) {
				const t = P.by_collider.get(h);
				if (!t) continue;
				const iv = dv / t.mass;
				const now = performance.now();
				if (iv < 1.8 || now - t.last < 90) continue;
				t.last = now;
				sound.tock(iv, Math.cbrt(t.size.x * t.size.y * t.size.z) * 2);
			}
		});
		for (const t of toys) {
			const b = t.body!;
			if (!b.isSleeping() && !(press?.dragging && press.t === t)) rest(P, t);
			const p = b.translation();
			const r = b.rotation();
			t.pos.set(p.x, p.y, p.z);
			t.quat.set(r.x, r.y, r.z, r.w);
			if (p.y < -1 || Math.abs(p.x) > w / 2 + 1) place(t, clamp(p.x, -w / 2 + 0.5, w / 2 - 0.5), h, 0, true);
		}
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
	let press: null | {
		t: Toy;
		x: number;
		y: number;
		at: number;
		point: THREE.Vector3;
		id: number;
		dragging: boolean;
		/** a drag that started before the physics had arrived */
		want: boolean;
		e: PointerEvent;
	} = null;
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
		if (t.href) {
			label.href = t.href;
			// outside links open in a new tab, like every other one on the site
			if (/^https?:/.test(t.href)) Object.assign(label, { target: '_blank', rel: 'noopener' });
			else label.removeAttribute('target');
		} else label.removeAttribute('href');
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

	// the physics is fetched the moment a pointer comes onto the shelf: a mouse hovers first, so it
	// is usually there before the click. a finger's first touch fetches it and is replayed after.
	canvas.addEventListener('pointerenter', need);
	canvas.addEventListener('pointerdown', (e) => {
		need();
		sound.unlock();
		const hh = hit(e);
		if (!hh) return;
		e.preventDefault();
		canvas.setPointerCapture(e.pointerId);
		press = { t: hh.object.userData.toy, x: e.clientX, y: e.clientY, at: performance.now(), point: hh.point.clone(), id: e.pointerId, dragging: false, want: false, e };
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
		if (!press || press.dragging) return;
		if (!phys) return void (press.want = true);
		const b = press.t.body!;
		const p = press.point;
		press.dragging = true;
		// drag in a plane facing the viewer, so up and down on screen lift and drop the toy
		dragPlane.setFromNormalAndCoplanarPoint(fwd.clone().negate(), p);
		// the held spot, in the toy's own frame: it swings from there, like a thing held by a corner
		const r = b.rotation();
		const tr = b.translation();
		grab.local.set(p.x - tr.x, p.y - tr.y, p.z - tr.z).applyQuaternion(tmpQ.set(r.x, r.y, r.z, r.w).invert());
		grab.target.copy(p);
		grab.vel.set(0, 0, 0);
		grab.at = performance.now();
		// a held thing stops spinning quickly, and never dozes off in the hand
		b.setAngularDamping(4);
		b.wakeUp();
		canvas.style.cursor = 'grabbing';
		move_drag(press.e);
	}
	function move_drag(e: PointerEvent) {
		set_ray(e);
		if (!ray.ray.intersectPlane(dragPlane, hitP)) return;
		hitP.set(clamp(hitP.x, -w / 2 + 0.3, w / 2 - 0.3), clamp(hitP.y, 0.1, h * 1.3), clamp(hitP.z, -DEPTH / 2 + 0.2, DEPTH / 2 - 0.2));
		const now = performance.now();
		const dt = Math.max((now - grab.at) / 1000, 1 / 240);
		// the hand's speed, smoothed over a few events: it is what a throw carries away
		grab.vel.lerp(tmpV.subVectors(hitP, grab.target).divideScalar(dt), 0.5);
		grab.target.copy(hitP);
		grab.at = now;
		press?.t.body?.wakeUp();
		wake();
	}
	function end(e: PointerEvent, cancelled: boolean) {
		if (!press || e.pointerId !== press.id) return;
		const t = press.t;
		if (press.dragging) {
			const b = t.body!;
			b.setAngularDamping(t.stuff === 'hard' ? 0.35 : 0.6);
			// a throw keeps its speed, up to a strong flick of the wrist: 3 m/s
			const v = b.linvel();
			const s = Math.hypot(v.x, v.y, v.z);
			if (s > 30) b.setLinvel({ x: (v.x * 30) / s, y: (v.y * 30) / s, z: (v.z * 30) / s }, true);
			b.wakeUp();
			canvas.style.cursor = 'grab';
		} else if (!cancelled) {
			const at = press.point;
			// the duck squeaks when poked: a quick, firm tap is a harder squeeze
			if (t.id === 'duck') {
				sound.squeak(clamp(1.15 - (performance.now() - press.at) / 300, 0, 1));
			}
			if (phys) poke(t, at);
			else queued.push(() => poke(t, at));
		}
		press = null;
		if (e.pointerType !== 'mouse') show(null);
		wake();
	}
	canvas.addEventListener('pointerup', (e) => end(e, false));
	canvas.addEventListener('pointercancel', (e) => end(e, true));

	/** a flick: one push, at the exact spot that was touched, away from the finger and a little up.
	 *  where it lands decides what happens: low on a wide thing slides it, high on a tall thing
	 *  tips it. no made-up spin. */
	function poke(t: Toy, at: THREE.Vector3) {
		const b = t.body!;
		const c = b.translation();
		const side = clamp((c.x - at.x) / Math.max(t.size.x / 2, 0.01), -1, 1);
		const m = t.mass;
		const away = { x: (side * 2.4 + (at.x < c.x ? 0.6 : -0.6)) * m, y: 6.2 * m, z: -1.2 * m };
		b.applyImpulseAtPoint(away, at, true);
	}

	// ---------- the loop: runs only while something moves, on screen, in a visible tab ----------
	let raf = 0;
	let last = 0;
	let acc = 0;
	let onscreen = true;
	let frame12 = -1;
	const boilR = mulberry(99);
	function wake() {
		if (raf || !onscreen || document.hidden) return;
		last = performance.now();
		raf = requestAnimationFrame(tick);
	}
	function moving() {
		if (press) return true;
		if (!phys) return false;
		for (const t of toys) if (!t.body!.isSleeping()) return true;
		return false;
	}
	function tick(now: number) {
		raf = 0;
		const dt = Math.min((now - last) / 1000, 0.1);
		last = now;
		if (press && !press.dragging && now - press.at > 220) start_drag();
		let a = 1;
		if (phys) {
			acc += dt;
			while (acc >= STEP) {
				step();
				acc -= STEP;
			}
			a = acc / STEP;
		}
		for (const t of toys) sync(t, a);
		const go = moving();
		// the clay boils at 12fps while it is played with, then settles still
		const f = Math.floor(now / (1000 / 12));
		if (f !== frame12) {
			frame12 = f;
			if (go) {
				G.uBoilAmp.value = 0.0035;
				G.uBoilOff.value.set(boilR() * 40, boilR() * 40, boilR() * 40);
				G.uBoilPhase.value = boilR() * 6.28;
			}
		}
		if (!go) {
			G.uBoilAmp.value = 0;
			// asleep: draw the resting pose itself, not a blend
			acc = 0;
			for (const t of toys) (t.pos0.copy(t.pos), t.quat0.copy(t.quat), sync(t, 1));
		}
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
			const x = clamp(t.pos.x, -w / 2 + t.size.x / 2, w / 2 - t.size.x / 2);
			if (x !== t.pos.x) place(t, x, t.pos.y, t.pos.z, false);
			sync(t, 1);
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
	if (import.meta.env.DEV) (window as any).__shelf = { toys, phys: () => phys, moving, need };

	return () => {
		dead = true;
		cancelAnimationFrame(raf);
		phys?.events.free();
		phys?.world.free();
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
