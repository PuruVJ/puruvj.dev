// the cat on the lost poster (404 page): the old site's photo, run through a photocopier.
// a 45° halftone screen in plain ink on a clear ground, so the poster's own paper shows through
// in light and dark alike. run once: node scripts/lost-cat.ts
import sharp from 'sharp';

const SRC = 'src/lib/lost/cat.jpg';
const OUT = 'static/lost/cat.png';
const W = 448; // output size (the poster prints it at ~280 css px)
const H = 400;
const SS = 3; // supersampling for smooth dots
const CELL = 4 * SS; // screen pitch, in supersampled px
const ANGLE = Math.PI / 4;

const w = W * SS;
const h = H * SS;
// the face sits a little low in the original; crop to the poster's frame
const { data } = await sharp(SRC)
	.grayscale()
	.normalise({ lower: 2, upper: 99 })
	.extract({ left: 40, top: 60, width: 330, height: 295 }) // the face, cropped close
	.resize(w, h, { fit: 'cover' })
	.gamma(1.0, 1.6) // open up the shadows so the fur reads
	.linear(1.25, -10) // photocopier: a touch more contrast
	.blur(SS * 0.9)
	.raw()
	.toBuffer({ resolveWithObject: true });

const ink = new Uint8Array(w * h);
const c = Math.cos(ANGLE);
const s = Math.sin(ANGLE);
for (let y = 0; y < h; y++) {
	for (let x = 0; x < w; x++) {
		// position in the rotated screen
		const u = (x * c + y * s) / CELL;
		const v = (-x * s + y * c) / CELL;
		const fu = u - Math.floor(u) - 0.5;
		const fv = v - Math.floor(v) - 0.5;
		// sample tone at the cell centre so each dot is one clean circle
		const cu = Math.floor(u) + 0.5;
		const cv = Math.floor(v) + 0.5;
		const sx = Math.round((cu * c - cv * s) * CELL);
		const sy = Math.round((cu * s + cv * c) * CELL);
		const tone = data[Math.min(h - 1, Math.max(0, sy)) * w + Math.min(w - 1, Math.max(0, sx))] / 255;
		const dark = 1 - tone;
		// dot radius from area: a full cell of ink at black, nothing at white
		const r = Math.sqrt(dark / Math.PI) * 1.02;
		const d = Math.hypot(fu, fv);
		// a little toner grit on the edges
		const grit = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
		ink[y * w + x] = d < r + (grit - 0.5) * 0.06 ? 255 : 0;
	}
}
const rgba = Buffer.alloc(w * h * 4);
for (let i = 0; i < w * h; i++) {
	rgba[i * 4] = 13;
	rgba[i * 4 + 1] = 13;
	rgba[i * 4 + 2] = 12;
	rgba[i * 4 + 3] = ink[i];
}
await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
	.resize(W, H, { kernel: 'lanczos3' })
	.png({ compressionLevel: 9, palette: true, colours: 8 })
	.toFile(OUT);
console.log('wrote', OUT);
