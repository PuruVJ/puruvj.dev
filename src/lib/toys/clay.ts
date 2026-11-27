// the clay look from the room prototype: lumpy displacement, thumbprints, mottled colour, a soft
// wrap-around light, and a stop-motion "boil" that only runs while someone plays with the toys.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const PI = Math.PI;

export function mulberry(a: number) {
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
const R = mulberry(7);
export const rr = (a: number, b: number) => a + R() * (b - a);

const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+10.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.5-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 105.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
vec3 hash33(vec3 p){ p=fract(p*vec3(.1031,.1030,.0973)); p+=dot(p,p.yxz+33.33); return fract((p.xxy+p.yxx)*p.zyx); }
`;

const VERT_HEAD = /* glsl */ `
uniform float uLump, uLumpFreq, uBoilAmp; uniform vec3 uSeed, uBoilOff;
varying vec3 vWPos; varying float vDisp;
${NOISE}
float clayDisp(vec3 p){
  float d = snoise(p*uLumpFreq + uSeed)*0.62 + snoise(p*uLumpFreq*2.4 + uSeed.zxy)*0.28 + snoise(p*uLumpFreq*6.0 + uSeed.yzx)*0.10;
  return d*uLump + snoise(p*5.0 + uBoilOff)*uBoilAmp;
}
`;

const LIGHT_HEAD = /* glsl */ `
uniform float uWrap, uSSS; uniform vec3 uSSSColor;
float gShadow = 1.0;
`;
const physPars = THREE.ShaderChunk.lights_physical_pars_fragment
	.replace(
		/float dotNL = saturate\( dot\( geometryNormal, directLight\.direction \) \);\s*vec3 irradiance = dotNL \* directLight\.color;/,
		`float rawNL = dot( geometryNormal, directLight.direction );
  float dotNL = saturate( rawNL );
  float wrapNL = saturate( ( rawNL + uWrap ) / ( 1.0 + uWrap ) );
  wrapNL = wrapNL * mix( 1.0, wrapNL, 0.35 );
  vec3 irradiance = dotNL * directLight.color;
  float term = smoothstep( -0.45, 0.0, rawNL ) * ( 1.0 - smoothstep( 0.0, 0.55, rawNL ) );
  vec3 dIrr = directLight.color * ( wrapNL + term * uSSS * uSSSColor );`,
	)
	.replace(
		'reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );',
		'reflectedLight.directDiffuse += dIrr * BRDF_Lambert( material.diffuseColor );',
	);

const FRAG_HEAD = /* glsl */ `
uniform float uPrint, uBump, uSpeck, uMottle, uPattern, uBoilPhase, uFine, uLint, uOil; uniform vec3 uSpeckColor, uBoilOff, uSeedF;
varying vec3 vWPos; varying float vDisp;
${NOISE}
float fingerprint(vec3 p){
  vec3 q = p*6.5 + uSeedF; vec3 i = floor(q); vec3 f = fract(q);
  float best = 9.0; vec3 bh = vec3(0.0); vec3 bc = vec3(0.0);
  for(int x=-1;x<=1;x++) for(int y=-1;y<=1;y++) for(int z=-1;z<=1;z++){
    vec3 g = vec3(float(x),float(y),float(z)); vec3 h = hash33(i+g); vec3 c = g + 0.15 + h*0.7;
    float d = length(c - f); if(d < best){ best = d; bh = h; bc = c - f; }
  }
  float warp = snoise(p*14.0 + bh*40.0)*1.3;
  float aniso = length(bc*vec3(1.0, 1.35, 0.8));
  float ring = sin(aniso*44.0 + warp + uBoilPhase*bh.y*3.0);
  float mask = smoothstep(0.62, 0.18, best) * step(0.42, bh.x);
  return ring*mask;
}
// thick oil paint, like the mountain on the home page: short raised strokes laid side by side.
// each patch of surface has its own stroke direction; across a stroke the paint rises in a soft
// ridge, along it the stroke starts and stops, so the marks read as separate dabs of a brush.
float impasto(vec3 p){
  float a = snoise(p*1.4 + uSeedF.yzx)*1.4 + 0.7;
  vec2 d = vec2(cos(a), sin(a));
  vec3 q = p*6.0;
  float u = dot(q.xz, d) + q.y*0.45;
  float v = dot(q.xz, vec2(-d.y, d.x)) + q.y*0.85;
  float lane = floor(v);
  float across = 1.0 - smoothstep(0.0, 0.5, abs(fract(v) - 0.5));
  float on = smoothstep(-0.15, 0.35, snoise(vec3(u*0.22, lane*7.13, lane*1.7) + uSeedF));
  return across*across*on;
}
float clayHeight(vec3 p){
  float h = fingerprint(p)*uPrint;
  h += impasto(p)*uOil;
  h += (snoise(p*40.0 + uBoilOff*0.37)*0.16 + snoise(p*110.0 + uBoilOff)*0.035)*uFine;
  h += snoise(p*12.0 + uSeedF)*0.35*uFine;
  h += snoise(vec3(p.x*9.0, p.y*30.0, p.z*9.0) + uSeedF.zyx)*0.18*uFine;
  if (uPattern > 0.5) h += (abs(sin(p.y*150.0)) + abs(sin((p.x*0.7+p.z*0.7)*150.0)))*0.25;
  return h;
}
vec3 clayPerturb(vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDir){
  vec3 vSigmaX = normalize(dFdx(surf_pos)); vec3 vSigmaY = normalize(dFdy(surf_pos)); vec3 vN = surf_norm;
  vec3 R1 = cross(vSigmaY, vN); vec3 R2 = cross(vN, vSigmaX);
  float fDet = dot(vSigmaX, R1) * faceDir;
  vec3 vGrad = sign(fDet) * (dHdxy.x * R1 + dHdxy.y * R2);
  return normalize(abs(fDet) * surf_norm - vGrad);
}
`;

/** shared per-frame state: the boil offsets step at 12fps, and only while the toys are played with */
export const G = {
	/** how much oil-paint relief sits on every toy (0 = plain clay) */
	uOil: { value: 2.0 },
	uBoilOff: { value: new THREE.Vector3() },
	uBoilPhase: { value: 0 },
	uBoilAmp: { value: 0 },
};

export type ClayOpts = {
	rough?: number;
	spec?: number;
	sheen?: number;
	flat?: boolean;
	map?: THREE.Texture | null;
	lump?: number;
	lumpFreq?: number;
	print?: number;
	fine?: number;
	bump?: number;
	speck?: number;
	speckColor?: string;
	mottle?: number;
	pattern?: number;
	lint?: number;
	wrap?: number;
	sss?: number;
};

const cache = new Map<string, THREE.MeshPhysicalMaterial>();
export function clay(hex: string, o: ClayOpts = {}) {
	const key = hex + JSON.stringify({ ...o, map: o.map ? (o.map as THREE.Texture).uuid : null });
	const hit = cache.get(key);
	if (hit) return hit;
	const base = new THREE.Color(hex);
	const hsl = { h: 0, s: 0, l: 0 };
	base.getHSL(hsl);
	const sss = new THREE.Color().setHSL((hsl.h + 0.98) % 1, Math.min(1, hsl.s * 1.25 + 0.25), Math.min(0.55, hsl.l * 0.9 + 0.1));
	const m = new THREE.MeshPhysicalMaterial({
		color: base,
		roughness: o.rough ?? 0.6,
		metalness: 0,
		specularIntensity: o.spec ?? 0.32,
		specularColor: new THREE.Color('#fff4e6'),
		sheen: o.sheen ?? 0.35,
		sheenRoughness: 0.55,
		sheenColor: base.clone().lerp(new THREE.Color('#fff1dc'), 0.55),
		flatShading: !!o.flat,
		map: o.map ?? null,
	});
	const u = {
		uLump: { value: o.lump ?? 0.018 },
		uLumpFreq: { value: o.lumpFreq ?? 2.6 },
		uSeed: { value: new THREE.Vector3(R() * 50, R() * 50, R() * 50) },
		uSeedF: { value: new THREE.Vector3(R() * 50, R() * 50, R() * 50) },
		uPrint: { value: o.print ?? 0.9 },
		uFine: { value: o.fine ?? 1 },
		uBump: { value: (o.bump ?? 0.045) * 2.6 },
		uSpeck: { value: o.speck ?? 0 },
		uSpeckColor: { value: new THREE.Color(o.speckColor || '#3a2a20') },
		uMottle: { value: o.mottle ?? 0.07 },
		uPattern: { value: o.pattern ?? 0 },
		uLint: { value: o.lint ?? 1 },
		uWrap: { value: o.wrap ?? 0.55 },
		uSSS: { value: o.sss ?? 0.45 },
		uSSSColor: { value: sss },
	};
	m.onBeforeCompile = (s) => {
		Object.assign(s.uniforms, u, G);
		s.vertexShader = s.vertexShader
			.replace('#include <common>', '#include <common>\n' + VERT_HEAD)
			.replace(
				'#include <normal_vertex>',
				`#include <normal_vertex>
        mat3 cMi = inverse(mat3(modelMatrix));
        vec3 cWP = (modelMatrix*vec4(position,1.0)).xyz;
        vec3 cWN = normalize(transpose(cMi)*objectNormal);
        vec3 cT = normalize(cross(cWN, abs(cWN.y) < 0.9 ? vec3(0.0,1.0,0.0) : vec3(1.0,0.0,0.0)));
        vec3 cB = cross(cWN, cT);
        float cE = 0.012;
        float cD0 = clayDisp(cWP); float cD1 = clayDisp(cWP + cT*cE); float cD2 = clayDisp(cWP + cB*cE);
        vec3 cN = normalize(cross(cT*cE + cWN*(cD1-cD0), cB*cE + cWN*(cD2-cD0)));
        vec3 clayOffset = cMi*(cWN*cD0);
        #ifndef FLAT_SHADED
          vNormal = normalize(mat3(viewMatrix)*cN);
        #endif
        vWPos = cWP + cWN*cD0; vDisp = cD0/max(uLump, 1e-4);`,
			)
			.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed += clayOffset;');
		s.fragmentShader = s.fragmentShader
			.replace('#include <common>', '#include <common>\n' + FRAG_HEAD + LIGHT_HEAD)
			.replace('#include <lights_physical_pars_fragment>', physPars)
			.replace(
				'#include <color_fragment>',
				`#include <color_fragment>
        float mot = snoise(vWPos*2.7 + uSeedF)*0.6 + snoise(vWPos*9.0 + uSeedF.zxy)*0.3;
        diffuseColor.rgb *= 1.0 + mot*uMottle;
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb*vec3(1.04,0.98,0.94), smoothstep(0.2,0.8,snoise(vWPos*1.3+uSeedF))*0.5);
        float spk = smoothstep(0.72, 0.8, snoise(vWPos*70.0 + uSeedF));
        diffuseColor.rgb = mix(diffuseColor.rgb, uSpeckColor, spk*uSpeck);
        float lint = smoothstep(0.86, 0.9, snoise(vWPos*38.0 + uSeedF.yzx)) * uLint;
        diffuseColor.rgb *= 1.0 - lint*0.35;
        if (uPattern > 0.5) diffuseColor.rgb *= 0.75 + 0.25*smoothstep(0.2, 0.9, abs(sin(vWPos.y*150.0))*abs(sin((vWPos.x*0.7+vWPos.z*0.7)*150.0)));
        diffuseColor.rgb *= mix(0.8, 1.03, smoothstep(-1.0, 0.5, vDisp));`,
			)
			.replace(
				'#include <normal_fragment_maps>',
				`#include <normal_fragment_maps>
        float clayH = clayHeight(vWPos);
        normal = clayPerturb(-vViewPosition, normal, vec2(dFdx(clayH), dFdy(clayH))*uBump, faceDirection);`,
			)
			.replace(
				'#include <roughnessmap_fragment>',
				`#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor + snoise(vWPos*6.0 + uSeedF)*0.12, 0.25, 1.0);`,
			);
		s.uniforms.uWrap = u.uWrap;
		s.uniforms.uSSS = u.uSSS;
		s.uniforms.uSSSColor = u.uSSSColor;
	};
	m.customProgramCacheKey = () => 'clay' + (o.flat ? 'f' : '') + (o.map ? 'm' : '');
	const d = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
	d.onBeforeCompile = (s) => {
		Object.assign(s.uniforms, u, G);
		s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\n' + VERT_HEAD).replace(
			'#include <begin_vertex>',
			`#include <begin_vertex>
        { mat3 cMi = inverse(mat3(modelMatrix)); vec3 cWP = (modelMatrix*vec4(position,1.0)).xyz;
          vec3 cWN = normalize(transpose(cMi)*normal); transformed += cMi*(cWN*clayDisp(cWP)); }`,
		);
	};
	d.customProgramCacheKey = () => 'claydepth';
	m.userData.depth = d;
	cache.set(key, m);
	return m;
}

// ---------- geometry helpers ----------
export const GEO = {
	sphere: new THREE.SphereGeometry(1, 48, 36),
	sphereLo: new THREE.SphereGeometry(1, 20, 14),
};

type V3 = [number, number, number];
export function part(
	geo: THREE.BufferGeometry,
	mat: THREE.Material,
	p: V3 = [0, 0, 0],
	s: V3 | number = [1, 1, 1],
	r: V3 = [0, 0, 0],
	parent?: THREE.Object3D,
) {
	const m = new THREE.Mesh(geo, mat);
	m.position.set(...p);
	if (typeof s === 'number') m.scale.setScalar(s);
	else m.scale.set(...s);
	m.rotation.set(...r);
	m.castShadow = true;
	m.receiveShadow = true;
	if (mat.userData.depth) m.customDepthMaterial = mat.userData.depth;
	parent?.add(m);
	return m;
}

export function weld(g: THREE.BufferGeometry) {
	g.deleteAttribute('normal');
	if (g.attributes.uv) g.deleteAttribute('uv');
	g = mergeVertices(g, 1e-4);
	g.computeVertexNormals();
	return g;
}

/** sweep a round-ish profile along a curve; radius(t, theta) */
export function sweep(points: V3[], radius: (t: number, th: number) => number, nT = 48, nR = 14, closed = false) {
	const curve = new THREE.CatmullRomCurve3(
		points.map((p) => new THREE.Vector3(...p)),
		closed,
		'centripetal',
	);
	const frames = curve.computeFrenetFrames(nT, closed);
	const pos: number[] = [];
	const idx: number[] = [];
	for (let i = 0; i <= nT; i++) {
		const t = i / nT;
		const c = curve.getPointAt(t);
		const N = frames.normals[i];
		const B = frames.binormals[i];
		for (let j = 0; j < nR; j++) {
			const th = (j / nR) * PI * 2;
			const r = radius(t, th);
			pos.push(
				c.x + r * (Math.cos(th) * N.x + Math.sin(th) * B.x),
				c.y + r * (Math.cos(th) * N.y + Math.sin(th) * B.y),
				c.z + r * (Math.cos(th) * N.z + Math.sin(th) * B.z),
			);
		}
	}
	for (let i = 0; i < nT; i++)
		for (let j = 0; j < nR; j++) {
			const a = i * nR + j;
			const b = i * nR + ((j + 1) % nR);
			const c = (i + 1) * nR + j;
			const d = (i + 1) * nR + ((j + 1) % nR);
			idx.push(a, b, c, b, d, c);
		}
	if (!closed) {
		const s0 = pos.length / 3;
		const c0 = curve.getPointAt(0);
		pos.push(c0.x, c0.y, c0.z);
		const s1 = s0 + 1;
		const c1 = curve.getPointAt(1);
		pos.push(c1.x, c1.y, c1.z);
		for (let j = 0; j < nR; j++) {
			idx.push(s0, (j + 1) % nR, j);
			idx.push(s1, nT * nR + j, nT * nR + ((j + 1) % nR));
		}
	}
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
	g.setIndex(idx);
	g.computeVertexNormals();
	return g;
}
export const taper =
	(a = 1, b = 1, k = 0.25) =>
	(t: number) => {
		const e = Math.min(1, Math.min(t / k, (1 - t) / k));
		const s = Math.sin((Math.max(0, e) * PI) / 2);
		return (a + (b - a) * t) * (0.35 + 0.65 * s);
	};
export const lathe = (pts: [number, number][], seg = 40) =>
	weld(new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg));
export const rbox = (w: number, h: number, d: number, r: number, seg = 4) => new RoundedBoxGeometry(w, h, d, seg, r);
