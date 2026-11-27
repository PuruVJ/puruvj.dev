// the miniatures, built from clay the same way as the room prototype. no figure of puru.
import * as THREE from 'three';
import { clay, part, weld, sweep, taper, lathe, rbox, GEO, PI, rr, mulberry } from './clay.ts';

const C = {
	ink: '#241c19',
	cream: '#e9dcc0',
	bezel: '#cdbb98',
	mustard: '#d39a2e',
	brick: '#a13c2c',
	sage: '#76924b',
	olive: '#4f6a2c',
	moss: '#7f9440',
	teal: '#4d8580',
	terracotta: '#b9643f',
	bone: '#efe4cb',
	pebble: '#8b8073',
	trunk: '#6b4630',
	soil: '#3b2a1f',
	charcoal: '#34302d',
	brass: '#b98b3c',
	duck: '#e2aa36',
	beak: '#cf6a2c',
	banana: '#cf9f3f',
};

function canvas(w: number, h: number) {
	const cv = document.createElement('canvas');
	cv.width = w;
	cv.height = h;
	return [cv, cv.getContext('2d')!] as const;
}

function screenTex() {
	const [cv, g] = canvas(256, 200);
	const grd = g.createRadialGradient(128, 100, 20, 128, 100, 165);
	grd.addColorStop(0, '#3f6a5c');
	grd.addColorStop(1, '#16271f');
	g.fillStyle = grd;
	g.fillRect(0, 0, 256, 200);
	g.fillStyle = 'rgba(240,199,102,.85)';
	g.beginPath();
	g.arc(60, 60, 18, 0, PI * 2);
	g.fill();
	g.strokeStyle = 'rgba(233,220,192,.85)';
	g.lineWidth = 7;
	g.lineCap = 'round';
	for (const [x0, x1, y] of [[110, 150, 50], [110, 125, 75], [35, 190, 120], [35, 150, 145], [35, 170, 170]]) {
		g.beginPath();
		g.moveTo(x0, y);
		g.lineTo(x1, y);
		g.stroke();
	}
	const t = new THREE.CanvasTexture(cv);
	t.colorSpace = THREE.SRGBColorSpace;
	return t;
}

function scribbleTex() {
	const [cv, g] = canvas(256, 200);
	const r = mulberry(21);
	g.fillStyle = '#ffffff';
	g.fillRect(0, 0, 256, 200);
	g.strokeStyle = 'rgba(70,60,80,.5)';
	g.lineWidth = 2;
	g.lineCap = 'round';
	for (let l = 0; l < 6; l++) {
		const y = 35 + l * 22;
		let x = 30;
		g.beginPath();
		g.moveTo(x, y);
		while (x < 210 - (l === 5 ? 100 : 0)) {
			x += 4 + r() * 5;
			g.lineTo(x, y + Math.sin(x * 0.35) * 3 + (r() - 0.5) * 2);
		}
		g.stroke();
	}
	const t = new THREE.CanvasTexture(cv);
	t.colorSpace = THREE.SRGBColorSpace;
	return t;
}

export function computer() {
	const g = new THREE.Group();
	const body = clay(C.cream, { lump: 0.018, print: 0.55, mottle: 0.1 });
	const dark = clay(C.bezel, { lump: 0.006 });
	part(rbox(0.8, 0.86, 0.74, 0.1, 5), body, [0, 0.49, 0], 1, [0, 0, 0], g);
	part(rbox(0.74, 0.07, 0.7, 0.03, 3), dark, [0, 0.04, 0], 1, [0, 0, 0], g);
	part(rbox(0.64, 0.5, 0.06, 0.05, 3), dark, [0, 0.58, 0.36], 1, [0, 0, 0], g);
	const tex = screenTex();
	const scr = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.5, roughness: 0.55 });
	const sm = new THREE.Mesh(rbox(0.52, 0.4, 0.03, 0.04, 3), scr);
	sm.position.set(0, 0.585, 0.385);
	g.add(sm);
	part(rbox(0.22, 0.028, 0.03, 0.012, 2), clay(C.ink, { lump: 0.001 }), [0.16, 0.2, 0.37], 1, [0, 0, 0], g);
	part(GEO.sphereLo, clay(C.terracotta, { lump: 0.002 }), [-0.26, 0.2, 0.37], [0.028, 0.028, 0.014], [0, 0, 0], g);
	return { g, screen: scr };
}

export function die(color: string, pipColor: string, values: number[]) {
	const g = new THREE.Group();
	const s = 0.27;
	const m = clay(color, { lump: 0.008, print: 1.1 });
	const pm = clay(pipColor, { lump: 0.001, fine: 0.4, sss: 0.2 });
	part(rbox(s, s, s, 0.05, 4), m, [0, s / 2, 0], 1, [0, 0, 0], g);
	const P: Record<number, number[][]> = {
		1: [[0, 0]],
		2: [[-1, -1], [1, 1]],
		3: [[-1, -1], [0, 0], [1, 1]],
		4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
		5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
		6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
	};
	const faces = [[0, 1, 0], [0, 0, 1], [1, 0, 0], [-1, 0, 0], [0, 0, -1], [0, -1, 0]];
	faces.forEach((n, fi) => {
		const N = new THREE.Vector3(...(n as [number, number, number]));
		const U = Math.abs(n[1]) ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
		const V = new THREE.Vector3().crossVectors(N, U);
		for (const [a, b] of P[values[fi]]) {
			const c = N.clone().multiplyScalar(s / 2 - 0.004).add(U.clone().multiplyScalar(a * 0.068)).add(V.clone().multiplyScalar(b * 0.068));
			const pip = part(GEO.sphereLo, pm, [c.x, c.y + s / 2, c.z], [0.026, 0.026, 0.008]);
			pip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), N);
			g.add(pip);
		}
	});
	return { g };
}

export function tree() {
	const g = new THREE.Group();
	const pot = clay(C.terracotta, { lump: 0.012, print: 1, mottle: 0.1 });
	part(lathe([[0.001, 0], [0.15, 0], [0.17, 0.04], [0.2, 0.25], [0.235, 0.26], [0.24, 0.31], [0.22, 0.33], [0.19, 0.31], [0.001, 0.3]]), pot, [0, 0, 0], 1, [0, 0, 0], g);
	part(GEO.sphere, clay(C.soil, { lump: 0.01, speck: 0.6, speckColor: '#5a4330' }), [0, 0.3, 0], [0.19, 0.03, 0.19], [0, 0, 0], g);
	const bark = clay(C.trunk, { lump: 0.008, print: 0.7 });
	part(sweep([[0, 0.28, 0], [0.02, 0.5, 0.01], [-0.03, 0.72, 0], [0.01, 0.92, 0.02]], taper(0.055, 0.035, 0.12), 32, 12), bark, [0, 0, 0], 1, [0, 0, 0], g);
	part(sweep([[-0.02, 0.62, 0], [0.1, 0.72, 0.02], [0.17, 0.86, 0.03]], taper(0.03, 0.02, 0.15), 24, 10), bark, [0, 0, 0], 1, [0, 0, 0], g);
	const leafs = [C.olive, C.sage, C.moss].map((c) => clay(c, { lump: 0.03, lumpFreq: 3.2, print: 0.9, mottle: 0.1 }));
	const blobs = [[0, 1.08, 0, 0.27, 0], [-0.17, 0.96, 0.06, 0.2, 1], [0.18, 1.0, 0.02, 0.22, 2], [0.05, 1.28, -0.02, 0.19, 1], [-0.1, 1.2, 0.12, 0.16, 2], [0.15, 1.2, 0.1, 0.14, 0], [0.0, 0.94, 0.16, 0.15, 2]];
	for (const [x, y, z, r, c] of blobs) part(GEO.sphere, leafs[c], [x, y, z], [r, r * 0.92, r], [rr(0, 1), rr(0, 3), 0], g);
	return { g };
}

export function popper() {
	const g = new THREE.Group();
	const body = clay(C.teal, { lump: 0.007, print: 0.9 });
	const L = 0.5;
	const Rm = 0.14;
	part(lathe([[0.001, 0], [0.022, 0.0], [Rm, L], [Rm - 0.016, L + 0.012], [0.05, L - 0.02], [0.001, L - 0.03]]), body, [0, 0, 0], 1, [0, 0, 0], g);
	for (const [col, ph] of [[C.mustard, 0], [C.cream, PI]] as const) {
		const pts: [number, number, number][] = [];
		for (let i = 0; i <= 60; i++) {
			const t = i / 60;
			const a = t * PI * 2 * 3.2 + ph;
			const rad = 0.022 + (Rm - 0.022) * t + 0.006;
			pts.push([Math.cos(a) * rad, t * L * 0.95 + 0.012, Math.sin(a) * rad]);
		}
		part(sweep(pts, (t, th) => 0.016 * (Math.abs(Math.cos(th)) * 0.45 + 0.55), 160, 8), clay(col, { lump: 0.002, fine: 0.5 }), [0, 0, 0], 1, [0, 0, 0], g);
	}
	const cols = [C.mustard, C.brick, C.cream, C.terracotta];
	[0.3, 1.9, 3.3, 4.9].forEach((a, i) => {
		const r0 = 0.05;
		const up = [0.14, 0.2, 0.12, 0.17][i];
		const out = [0.22, 0.18, 0.24, 0.2][i];
		const p: [number, number, number][] = [
			[Math.cos(a) * r0, L - 0.03, Math.sin(a) * r0],
			[Math.cos(a) * 0.08, L + up * 0.8, Math.sin(a) * 0.08],
			[Math.cos(a + 0.4) * out * 0.55, L + up, Math.sin(a + 0.4) * out * 0.55],
			[Math.cos(a + 0.9) * out * 0.85, L + up * 0.55, Math.sin(a + 0.9) * out * 0.85],
		];
		part(sweep(p, (t, th) => 0.016 * (Math.abs(Math.cos(th)) * 1.0 + 0.22) * (1 - t * 0.4), 48, 8), clay(cols[i], { lump: 0.002, fine: 0.4 }), [0, 0, 0], 1, [0, 0, 0], g);
	});
	return { g };
}

export function mic() {
	const g = new THREE.Group();
	const ch = clay(C.charcoal, { lump: 0.006, print: 0.9, sss: 0.15 });
	const brass = clay(C.brass, { lump: 0.003, sheen: 0.6, rough: 0.45 });
	part(lathe([[0.001, 0], [0.2, 0], [0.22, 0.02], [0.2, 0.05], [0.06, 0.07], [0.001, 0.075]]), ch, [0, 0, 0], 1, [0, 0, 0], g);
	part(sweep([[0, 0.05, 0], [0.005, 0.35, 0], [0.0, 0.66, 0.01]], () => 0.022, 20, 10), ch, [0, 0, 0], 1, [0, 0, 0], g);
	part(GEO.sphereLo, brass, [0, 0.67, 0.01], [0.035, 0.035, 0.035], [0, 0, 0], g);
	const head = new THREE.Group();
	head.position.set(0, 0.69, 0.01);
	head.rotation.set(-0.35, 0, -0.25);
	g.add(head);
	part(weld(new THREE.CylinderGeometry(0.075, 0.05, 0.22, 20, 4)), ch, [0, 0.1, 0], 1, [0, 0, 0], head);
	part(weld(new THREE.TorusGeometry(0.078, 0.014, 8, 28)), brass, [0, 0.21, 0], 1, [PI / 2, 0, 0], head);
	part(GEO.sphere, clay('#5d5a56', { lump: 0.004, pattern: 1, bump: 0.02, print: 0.3 }), [0, 0.29, 0], [0.105, 0.12, 0.105], [0, 0, 0], head);
	return { g };
}

export function papers() {
	const g = new THREE.Group();
	const paper = clay('#ece3cf', { lump: 0.004, lumpFreq: 3, print: 0.5, sss: 0.3, wrap: 0.4 });
	for (let i = 0; i < 4; i++) part(rbox(0.6, 0.012, 0.44, 0.005, 2), paper, [rr(-0.03, 0.03), 0.01 + i * 0.014, rr(-0.03, 0.03)], 1, [0, rr(-0.14, 0.14), 0], g);
	const top = clay('#ece3cf', { lump: 0.003, print: 0.4, map: scribbleTex(), sss: 0.3 });
	part(rbox(0.6, 0.012, 0.44, 0.005, 2), top, [0.02, 0.07, 0.0], 1, [0, 0.06, 0], g);
	return { g };
}

export function duck() {
	const g = new THREE.Group();
	const y = clay(C.duck, { lump: 0.01, print: 0.9, sheen: 0.45 });
	part(GEO.sphere, y, [0, 0.12, 0], [0.21, 0.14, 0.16], [0, 0, 0], g);
	part(GEO.sphere, y, [-0.17, 0.19, 0], [0.08, 0.06, 0.07], [0, 0, 0.7], g);
	part(GEO.sphere, y, [0.1, 0.31, 0], [0.105, 0.1, 0.1], [0, 0, 0], g);
	const bk = clay(C.beak, { lump: 0.003 });
	part(GEO.sphere, bk, [0.205, 0.29, 0], [0.06, 0.022, 0.05], [0, 0, -0.1], g);
	part(GEO.sphere, bk, [0.195, 0.27, 0], [0.05, 0.016, 0.04], [0, 0, 0.1], g);
	const ink = clay(C.ink, { lump: 0.001, fine: 0.3 });
	for (const s of [-1, 1]) part(GEO.sphereLo, ink, [0.15, 0.34, s * 0.065], [0.014, 0.016, 0.01], [0, s * 1.0, 0], g);
	part(GEO.sphere, y, [0.0, 0.17, 0.12], [0.1, 0.05, 0.04], [0.3, 0, -0.2], g);
	part(GEO.sphere, y, [0.0, 0.17, -0.12], [0.1, 0.05, 0.04], [-0.3, 0, -0.2], g);
	return { g };
}

export function banana() {
	const g = new THREE.Group();
	const pts: [number, number, number][] = [];
	for (let i = 0; i <= 8; i++) {
		const a = -0.95 + (i / 8) * 1.9;
		pts.push([Math.sin(a) * 0.32, 0.052 + (1 - Math.cos(a)) * 0.32, Math.sin(a * 2) * 0.015]);
	}
	const r = (t: number, th: number) => {
		const e = Math.sin(Math.min(1, t * 1.02) * PI);
		return (0.012 + 0.048 * Math.pow(e, 0.6)) * (1 + 0.07 * Math.cos(th * 5));
	};
	part(weld(sweep(pts, r, 48, 20)), clay(C.banana, { lump: 0.006, print: 0.7, speck: 0.8, speckColor: '#6a4424' }), [0, 0, 0], 1, [0, 0, 0], g);
	const st = clay('#5c4027', { lump: 0.002 });
	part(sweep([pts[0], [pts[0][0] - 0.06, 0.09, pts[0][2] + 0.02]], taper(0.016, 0.014, 0.2), 8, 8), st, [0, 0, 0], 1, [0, 0, 0], g);
	part(GEO.sphereLo, st, pts[8], [0.016, 0.016, 0.016], [0, 0, 0], g);
	return { g };
}

export function pebble() {
	const g = new THREE.Group();
	part(GEO.sphere, clay(C.pebble, { lump: 0.02, lumpFreq: 5, speck: 0.7, speckColor: '#cfc6b6', mottle: 0.12, sss: 0.2 }), [0, 0.06, 0], [0.17, 0.08, 0.13], [0, 0, 0], g);
	return { g };
}

export const DICE = {
	white: () => die(C.bone, C.brick, [5, 1, 3, 4, 6, 2]),
	red: () => die(C.brick, C.bone, [2, 3, 6, 1, 4, 5]),
};
