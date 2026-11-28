// hawa mahal's street front, drawn from the east facade on siredeori bazaar, in the timeline's 1px
// hand. pure: it returns path data, the page draws it.
//
// the facade is a thin screen, not a stack of terraces. it is thirteen upright columns of
// jharokhas (small projecting bay windows), each bay a little box on a tapered bracket, with a
// lattice window and a curved roof: a bulb dome on the narrow bays, a wide round hood on the broad
// ones. the columns run wide, narrow, narrow, wide... across the face. the lowest storey is a row of
// arches over the street. three storeys of bays run the full width; above them the middle nine
// columns rise one bay more, each a little taller toward the centre, so the top edge is a round,
// bristling crown of domes and finials. a lower wing with a balustrade on the left, a tower with a
// gallery and a small pavilion on the right. behind it, the aravalli ridge with a fort wall.

export const VW = 640;
export const VH = 340;
const G = 322; // the street
const CX = VW / 2;

const BASE = 50; // the arched street storey
const PITCH = 56; // one storey of bays
const ROWS = 3; // storeys of bays across the whole face

/** the columns, from the centre out: offset, wide or narrow */
const HALF: [number, boolean][] = [
	[0, true],
	[33, false],
	[67, true],
	[100, false],
	[125, false],
	[157, true],
	[187, false],
];
const COLS = [...HALF.slice(1).map(([d, w]) => [-d, w] as const).reverse(), ...HALF].map(
	([d, wide]) => ({ x: CX + d, d, wide, w: wide ? 30 : 20 }),
);
const EDGE = 201; // half the facade's width
const CROWN = 125; // columns this close to the centre rise one bay more

const f = (n: number) => +n.toFixed(2);

/** a bulb dome on a base `w` wide at (c, y), with its finial */
const dome = (c: number, y: number, w: number, h: number) =>
	`M${f(c - w / 2)} ${f(y)}C${f(c - w / 2 - w * 0.16)} ${f(y - h * 0.5)} ${f(c - w * 0.1)} ${f(y - h * 0.72)} ${f(c)} ${f(y - h)}` +
	`C${f(c + w * 0.1)} ${f(y - h * 0.72)} ${f(c + w / 2 + w * 0.16)} ${f(y - h * 0.5)} ${f(c + w / 2)} ${f(y)}` +
	`M${f(c)} ${f(y - h)}V${f(y - h - h * 0.45)}`;

/** a round hood over a broad bay, `w` wide at (c, y), with a rib inside and a finial */
const hood = (c: number, y: number, w: number, h: number) => ({
	main:
		`M${f(c - w / 2)} ${f(y)}C${f(c - w / 2)} ${f(y - h * 1.33)} ${f(c + w / 2)} ${f(y - h * 1.33)} ${f(c + w / 2)} ${f(y)}` +
		`M${f(c)} ${f(y - h)}V${f(y - h - 5)}`,
	fine:
		`M${f(c - w * 0.22)} ${f(y)}C${f(c - w * 0.22)} ${f(y - h * 1.2)} ${f(c + w * 0.22)} ${f(y - h * 1.2)} ${f(c + w * 0.22)} ${f(y)}`,
});

/** a small arched window: sill at y, `w` wide, `h` tall */
const arch = (c: number, y: number, w: number, h: number) => {
	const r = w / 2;
	return `M${f(c - r)} ${f(y)}V${f(y - h + r)}A${f(r)} ${f(r)} 0 0 1 ${f(c + r)} ${f(y - h + r)}V${f(y)}Z`;
};

/**
 * one jharokha standing on y0, scaled up or down by s: a tapered bracket, a sill, the bay with its
 * three faces and lattice windows, an eave, and its roof. returns where the eave and the top are.
 */
function bay(c: number, y0: number, w: number, wide: boolean, s: number) {
	let main = '';
	let fine = '';
	const hb = 9 * s;
	const hw = 25 * s;
	const sill = y0 - hb;
	const eave = sill - hw;
	const half = w / 2;
	// the bracket, narrowing to a small drop
	main += `M${f(c - half)} ${f(sill)}L${f(c - w * 0.26)} ${f(y0)}H${f(c + w * 0.26)}L${f(c + half)} ${f(sill)}`;
	fine += `M${f(c - w * 0.36)} ${f(sill + hb * 0.45)}H${f(c + w * 0.36)}`;
	// the sill, the bay's sides, the eave
	main += `M${f(c - half - 1.5)} ${f(sill)}H${f(c + half + 1.5)}`;
	main += `M${f(c - half)} ${f(sill)}V${f(eave)}M${f(c + half)} ${f(sill)}V${f(eave)}`;
	main += `M${f(c - half - 2)} ${f(eave)}H${f(c + half + 2)}`;
	// the three faces of the bay, and a lattice window in each
	const k = wide ? 0.27 : 0.24;
	fine += `M${f(c - w * k)} ${f(sill)}V${f(eave)}M${f(c + w * k)} ${f(sill)}V${f(eave)}`;
	const wh = hw - 7 * s;
	fine += arch(c, sill - 2 * s, w * k * 2 - 4, wh);
	if (wide) {
		const sw = half - w * k - 3;
		fine += arch(c - (half + w * k) / 2, sill - 2 * s, sw, wh * 0.8);
		fine += arch(c + (half + w * k) / 2, sill - 2 * s, sw, wh * 0.8);
		// a bar of lattice across the middle window
		fine += `M${f(c - w * k + 2)} ${f(sill - 2 * s - wh * 0.45)}H${f(c + w * k - 2)}`;
	}
	// the roof
	let top: number;
	if (wide) {
		const h = 13 * s;
		const r = hood(c, eave - 0.5, w - 2, h);
		main += r.main;
		fine += r.fine;
		top = eave - h - 5;
	} else {
		const h = 14 * s;
		main += dome(c, eave - 0.5, w * 0.92, h);
		top = eave - h * 1.45;
	}
	return { main, fine, eave, top };
}

export function hawa_mahal() {
	let main = ''; // outlines: currentColor
	let fine = ''; // windows, lattice, bands: quieter
	let hills = '';
	const L = CX - EDGE;
	const R = CX + EDGE;

	// the street, edge to edge
	main += `M0 ${G}H${VW}`;

	// the street storey: a plinth, an arch under each column, and a deep cornice over them
	main += `M${L} ${G}V${G - BASE}M${R} ${G}V${G - BASE}`;
	fine += `M${L} ${G - 6}H${R}`;
	for (const col of COLS) {
		const w = col.wide ? 20 : 12;
		const l = col.x - w / 2;
		const r = col.x + w / 2;
		const s = G - 6 - (col.wide ? 20 : 18);
		const rad = w * 0.95;
		const rise = Math.sqrt(rad * rad - (rad - w / 2) ** 2);
		main += `M${l} ${G - 6}V${f(s)}A${f(rad)} ${f(rad)} 0 0 1 ${col.x} ${f(s - rise)}A${f(rad)} ${f(rad)} 0 0 1 ${r} ${f(s)}V${G - 6}`;
		// a little dome-shaped panel over each arch, as on the real front
		fine += dome(col.x, f(s - rise - 4), w * 0.6, 6);
	}
	main += `M${L - 4} ${G - BASE}H${R + 4}`;
	fine += `M${L - 2} ${G - BASE + 3}H${R + 2}`;

	// the columns of bays
	const eaves: number[] = [];
	COLS.forEach((col) => {
		let y = G - BASE;
		let e = y;
		// the skyline is a round crown: each column's top follows one curve, so the last bay in
		// each column is stretched or squeezed to meet it
		const crown = Math.abs(col.d) <= CROWN;
		const t = col.d / CROWN;
		const top = crown ? 254 + 38 * (1 - t * t) : 216 + (200 - Math.abs(col.d)) * 0.28;
		for (let row = 0; row < ROWS; row++) {
			const last = row === ROWS - 1 && !crown;
			const s = last ? (top - BASE - PITCH * (ROWS - 1)) / PITCH : 1;
			const b = bay(col.x, y, col.w, col.wide, s);
			main += b.main;
			fine += b.fine;
			e = b.eave;
			y -= PITCH;
		}
		// the crown: the middle columns rise one more bay, taller toward the centre
		if (crown) {
			const s = (top - BASE - PITCH * ROWS) / PITCH;
			const b = bay(col.x, y, col.w, col.wide, s);
			main += b.main;
			fine += b.fine;
			e = b.eave;
		}
		eaves.push(e);
	});

	// the wall the bays hang on: a band at each storey between the columns, and its top edge
	for (let i = 0; i <= COLS.length; i++) {
		const a = COLS[i - 1];
		const b = COLS[i];
		const x0 = a ? a.x + a.w / 2 : L;
		const x1 = b ? b.x - b.w / 2 : R;
		const top = Math.max(a ? eaves[i - 1] : -Infinity, b ? eaves[i] : -Infinity);
		for (let row = 1; row <= ROWS; row++) {
			const yb = G - BASE - (row - 1) * PITCH - 9;
			if (yb > top) fine += `M${f(x0)} ${f(yb)}H${f(x1)}`;
		}
		main += `M${f(x0)} ${f(top)}H${f(x1)}`;
		// the wall climbs beside a taller column, behind its bracket and roof, to the bay above
		if (a && eaves[i - 1] < top) main += `M${f(x0)} ${f(top)}V${f(eaves[i - 1])}`;
		if (b && eaves[i] < top) main += `M${f(x1)} ${f(top)}V${f(eaves[i])}`;
		// a pinnacle on the wall between bays: the skyline bristles
		if (a && b && x1 - x0 >= 4) main += dome((x0 + x1) / 2, top - 0.5, 4, 5);
		// a small square lattice window in the wall between bays, on each storey
		if (x1 - x0 >= 6) {
			for (let row = 0; row < ROWS; row++) {
				const yy = G - BASE - row * PITCH - 30;
				if (yy - 4 > top) fine += `M${f((x0 + x1) / 2 - 1.5)} ${yy}h3v-4h-3Z`;
			}
		}
	}
	// the facade's sides
	main += `M${L} ${G - BASE}V${f(eaves[0])}M${R} ${G - BASE}V${f(eaves[eaves.length - 1])}`;

	// the left wing: a plain wall with a balustrade
	const WL = 34;
	const WT = G - 118;
	main += `M${WL} ${G}V${WT}H${L}`;
	main += `M${WL - 2} ${WT}H${L}M${WL} ${WT - 10}H${L}M${WL} ${WT - 10}V${WT}`;
	for (let x = WL + 4; x < L - 1; x += 4.5) fine += `M${f(x)} ${WT - 1}V${WT - 9}`;
	for (const yy of [G - 34, G - 76]) {
		for (let x = WL + 10; x < L - 8; x += 15) fine += arch(x + 4, yy, 6, 12);
	}

	// the right side: a tower with a gallery and a small pavilion, then a lower wall
	const T0 = R;
	const T1 = R + 42;
	const TT = G - 194;
	main += `M${T1} ${G}V${TT}M${T0 - 1} ${TT}H${T1 + 3}`;
	main += `M${T0} ${TT - 11}H${T1 + 2}M${T1 + 2} ${TT}V${TT - 11}`;
	for (let x = T0 + 3; x < T1; x += 4.5) fine += `M${f(x)} ${TT - 1}V${TT - 10}`;
	for (let i = 0; i < 4; i++) fine += arch(T0 + 21, G - 30 - i * 40, 6, 12);
	{
		const p0 = T0 + 10;
		const p1 = T1 - 8;
		const pt = TT - 11 - 18;
		main += `M${p0} ${TT - 11}V${pt}M${p1} ${TT - 11}V${pt}M${p0 - 2} ${pt}H${p1 + 2}`;
		for (const c of [p0 + 5, (p0 + p1) / 2, p1 - 5]) fine += arch(c, TT - 11, 5, 12);
		main += dome((p0 + p1) / 2, pt - 0.5, 14, 8);
	}
	const RW = VW - 28;
	main += `M${T1} ${WT + 10}H${RW}V${G}M${T1} ${WT}H${RW}M${RW} ${WT}V${WT + 10}`;
	for (let x = T1 + 4; x < RW - 1; x += 4.5) fine += `M${f(x)} ${WT + 1}V${WT + 9}`;
	for (const yy of [G - 34, G - 76]) {
		for (let x = T1 + 10; x < RW - 8; x += 15) fine += arch(x + 4, yy, 6, 12);
	}

	// the aravallis behind, with nahargarh's wall along the left ridge
	const ridge: [number, number][] = [
		[0, 176], [24, 166], [52, 156], [78, 160], [104, 150], [132, 156], [170, 150], [320, 146],
		[470, 152], [508, 158], [540, 150], [574, 158], [606, 150], [640, 160],
	];
	hills += 'M' + ridge.map(([x, yy]) => `${x} ${yy}`).join('L');
	for (let x = 30; x < 100; x += 6) {
		const yy = 166 - (x - 30) * 0.14;
		hills += `M${x} ${f(yy)}v-3h3v3`;
	}

	// what hides the hills: the wings, the tower and the facade's whole outline
	const box = (x0: number, y0: number, x1: number, y1: number) => `M${x0} ${y0}H${x1}V${y1}H${x0}Z`;
	let mask = box(WL, G, RW, WT - 11) + box(T0, G, T1 + 3, TT - 40);
	mask += box(L, G, R, Math.min(...eaves) - 30);

	return { main, fine, hills, mask };
}

/** twilight: a thin crescent low over the hills, and the first few stars */
export const MOON = { x: 72, y: 70, r: 11 };
export const STARS: [number, number, number][] = [
	[30, 124, 3],
	[150, 40, 2.5],
	[178, 56, 2],
	[470, 46, 3],
	[598, 82, 2.5],
	[622, 126, 2],
];
