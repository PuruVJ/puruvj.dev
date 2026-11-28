// hawa mahal's street front, as a line drawing in the timeline's 1px hand. pure: it returns path
// data, the page draws it. bottom to top: a row of pointed shop arches, then five storeys of
// jharokhas (small projecting windows, each under a curved bangaldar roof, every other one with a
// little dome), stepping in to a pyramid. where a storey steps in, its terrace carries a row of
// small domed kiosks; the top carries three chhatris. behind it, the aravalli hills, then the sky.

export const VW = 640;
export const VH = 340;
const G = 322; // the street
const CX = VW / 2;
const B = 20; // one bay

/** bays per level, bottom up: the arches, then the five storeys */
const PLINTH = 29;
const STOREYS = [
	{ bays: 27, h: 46 },
	{ bays: 23, h: 46 },
	{ bays: 17, h: 46 },
	{ bays: 11, h: 44 },
	{ bays: 5, h: 42 },
];
const PLINTH_H = 32;

const f = (n: number) => +n.toFixed(2);
const left = (bays: number) => CX - (bays * B) / 2;

/** a small dome on a base `w` wide at (c, y), with its finial */
const dome = (c: number, y: number, w: number, h: number) =>
	`M${f(c - w / 2)} ${f(y)}C${f(c - w / 2 - w * 0.06)} ${f(y - h * 0.55)} ${f(c - w * 0.12)} ${f(y - h * 0.7)} ${f(c)} ${f(y - h)}` +
	`C${f(c + w * 0.12)} ${f(y - h * 0.7)} ${f(c + w / 2 + w * 0.06)} ${f(y - h * 0.55)} ${f(c + w / 2)} ${f(y)}` +
	`M${f(c)} ${f(y - h)}V${f(y - h - h * 0.28)}`;

/** a pillared kiosk standing on a terrace at (c, y): two posts, an eave, a dome */
const kiosk = (c: number, y: number, w: number) => {
	const ph = w * 0.5;
	return (
		`M${f(c - w / 2 + 1)} ${y}V${f(y - ph)}M${f(c + w / 2 - 1)} ${y}V${f(y - ph)}` +
		`M${f(c - w / 2 - 1.5)} ${f(y - ph)}H${f(c + w / 2 + 1.5)}` +
		dome(c, y - ph - 0.5, w, w * 0.8)
	);
};

export function hawa_mahal() {
	let main = ''; // outlines: currentColor
	let fine = ''; // windows and arches: quieter
	let hills = '';

	// the street, edge to edge
	main += `M0 ${G}H${VW}`;

	// the arcade: pointed shop arches under a double band
	{
		const x0 = left(PLINTH);
		const x1 = x0 + PLINTH * B;
		const top = G - PLINTH_H;
		main += `M${x0} ${G}V${top}H${x1}V${G}`;
		fine += `M${x0} ${top + 3}H${x1}`;
		for (let i = 0; i < PLINTH; i++) {
			const l = x0 + i * B + 4;
			const r = l + 12;
			const c = (l + r) / 2;
			const s = G - 15;
			fine += `M${l} ${G}V${s}A12 12 0 0 1 ${c} ${f(s - 10.39)}A12 12 0 0 1 ${r} ${s}V${G}`;
		}
	}

	// the storeys
	let y = G - PLINTH_H;
	STOREYS.forEach((st, k) => {
		const x0 = left(st.bays);
		const x1 = x0 + st.bays * B;
		const top = y - st.h;
		main += `M${x0} ${y}V${top}M${x1} ${y}V${top}`;
		fine += `M${x0} ${y - 3}H${x1}`;
		for (let i = 0; i < st.bays; i++) {
			const l = x0 + i * B + 3;
			const r = l + B - 6;
			const c = (l + r) / 2;
			const yb = y - 4;
			const yt = y - 30;
			// the oriel's sides and its window, a round arch with a sill
			fine += `M${l} ${yb}V${yt}M${r} ${yb}V${yt}`;
			fine += `M${l + 3} ${yb - 1}V${yt + 9}A4 4 0 0 1 ${r - 3} ${yt + 9}V${yb - 1}Z`;
			// the eave and the curved roof over it
			main += `M${l - 2} ${yt}H${r + 2}M${l - 2} ${yt}Q${c} ${yt - 8} ${r + 2} ${yt}`;
			// every other bay a small dome, the rows offset so they make a honeycomb
			if ((i + k) % 2 === 0) fine += dome(c, yt - 3.6, 8, 9.5);
		}
		// the terrace where this storey steps in under the next one: a parapet and kiosks
		const next = STOREYS[k + 1];
		main += `M${x0} ${top}H${x1}`;
		if (next) {
			const n0 = left(next.bays);
			for (let i = 0; i < st.bays; i++) {
				const c = x0 + i * B + B / 2;
				if (c < n0 || c > n0 + next.bays * B) main += kiosk(c, top, 9);
			}
		}
		y = top;
	});

	// the crown: three chhatris on the top storey, the middle one tallest
	main += kiosk(CX, y, 22) + kiosk(CX - 32, y, 13) + kiosk(CX + 32, y, 13);
	main += `M${CX - 48} ${y}V${y - 4}M${CX + 48} ${y}V${y - 4}`;

	// the aravallis behind, low and long, with a fort wall along one ridge
	const ridge: [number, number][] = [
		[0, 236], [38, 226], [70, 214], [104, 206], [132, 211], [168, 198], [204, 190], [240, 196],
		[276, 186], [312, 192], [348, 184], [384, 190], [420, 198], [456, 192], [494, 204], [530, 200],
		[566, 212], [604, 222], [640, 228],
	];
	hills += 'M' + ridge.map(([x, yy]) => `${x} ${yy}`).join('L');
	// the battlement on the near ridge: a small crenellated run with two bastions
	for (let x = 160; x < 250; x += 6) {
		const yy = 200 - (x - 160) * 0.08;
		hills += `M${x} ${f(yy)}v-3h3v3`;
	}

	// what hides the hills: the building's own outline, as filled boxes (kiosks and crown included)
	const box = (x: number, y0: number, w: number, h: number) => `M${x} ${y0}h${w}v${-h}h${-w}Z`;
	let mask = box(left(PLINTH), G, PLINTH * B, PLINTH_H);
	let yy = G - PLINTH_H;
	for (const st of STOREYS) {
		mask += box(left(st.bays) - 2, yy, st.bays * B + 4, st.h + 14);
		yy -= st.h;
	}
	mask += box(CX - 50, yy, 100, 34);

	return { main, fine, hills, mask };
}

/** twilight: a thin crescent low over the hills, and the first few stars */
export const MOON = { x: 92, y: 74, r: 11 };
export const STARS: [number, number, number][] = [
	[48, 132, 3],
	[168, 46, 2.5],
	[238, 62, 2],
	[470, 40, 3],
	[566, 92, 2.5],
	[604, 150, 2],
];
