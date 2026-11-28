// open graph cards, drawn at build time: the site's own block grid, fonts and ink, at 1200×630.
// satori lays out a small tree of flex boxes into svg; resvg turns the svg into a png.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { terrain, body, sky, STILL, VW, VH } from '../home/mountain.ts';

const W = 1200;
const H = 630;
const PAPER = '#f4f3ef';
const INK = '#0d0d0c';
const INK2 = '#4a4a47';
const INK3 = '#686760';

const font = (f: string) => readFileSync(resolve('src/lib/og/fonts', f));
let fonts: Parameters<typeof satori>[1]['fonts'] | undefined;
const load_fonts = () =>
	(fonts ??= [
		{ name: 'display', data: font('instrument-display.ttf'), weight: 600, style: 'normal' },
		{ name: 'sans', data: font('instrument-text.ttf'), weight: 400, style: 'normal' },
		{ name: 'sans', data: font('instrument-text-medium.ttf'), weight: 500, style: 'normal' },
		{ name: 'mono', data: font('plex-mono-400.ttf'), weight: 400, style: 'normal' },
		{ name: 'mono', data: font('plex-mono-600.ttf'), weight: 600, style: 'normal' },
	]);

let photo: string | undefined;
const me = () =>
	(photo ??= `data:image/jpeg;base64,${readFileSync(resolve('src/lib/home/puru.jpg')).toString('base64')}`);

type Node = {
	type: string;
	props: Record<string, unknown> & { style?: Record<string, unknown>; children?: unknown };
};
const el = (type: string, style: Record<string, unknown>, ...children: unknown[]): Node => ({
	type,
	props: {
		style: { display: 'flex', ...style },
		children: children.length === 1 ? children[0] : children,
	},
});
const text = (style: Record<string, unknown>, s: string) => el('div', style, s);

/** the fonts are latin only: emoji and other symbols would draw as boxes, so they go */
const clean = (s: string) =>
	s
		.replace(/[^\p{Script=Latin}\p{N}\p{P}\p{Zs}+=<>|~^$`×→↗–—'’"“”…]/gu, '')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase();

/** the home page's oil-painted mountain, in its daylight colours. the page sets these from css;
 *  a png has no css, so the tones are written straight onto the filters. */
const OIL_TONES: Record<string, string> = {
	back: 'rgb(228 227 224)',
	lit: 'rgb(217 216 213)',
	shade: 'rgb(184 183 180)',
	snow: 'rgb(250 249 246)',
	sun: 'rgb(218 217 214)',
	moon: 'rgb(174 173 170)',
};
function oil_mountain() {
	const s0 = sky(STILL);
	const svg = `${terrain()}<g transform="translate(${s0.x.toFixed(1)} ${s0.y.toFixed(1)})">${body('sun')}</g>`;
	return svg
		.replace(/class="tone-(\w+)"/g, (_, k: string) => `flood-color="${OIL_TONES[k]}"`)
		.replace(/class="sheen"/g, 'lighting-color="#fff"');
}
/** satori can't draw svg filters, so it lays out a stand-in box of this colour, and the painting
 *  is swapped into the svg in its place before resvg (which can) renders the png */
const OIL_SLOT = '#010203';
const hills = (w: number, h: number) =>
	el('div', {
		position: 'absolute',
		right: 0,
		bottom: 0,
		width: w,
		height: h,
		backgroundColor: OIL_SLOT,
	});
function paint_in(svg: string) {
	return svg.replace(
		new RegExp(`<rect([^>]*)fill="${OIL_SLOT}"([^>]*)/>`),
		(_, a: string, b: string) => {
			const at = (k: string) => new RegExp(`\\b${k}="([^"]+)"`).exec(a + b)?.[1] ?? '0';
			return `<svg x="${at('x')}" y="${at('y')}" width="${at('width')}" height="${at('height')}" viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMaxYMax meet" overflow="hidden">${oil_mountain()}</svg>`;
		},
	);
}

/** a description, cut at a word to about three lines */
const short_sub = (s: string, max = 150) =>
	s.length <= max ? s : s.slice(0, s.lastIndexOf(' ', max)).replace(/[,.;:]$/, '') + '…';

export type Card = {
	/** the mono label at the top left: "01  puruvj.dev", "writing · 2026.06.05" */
	kicker: string;
	/** right side of the label row */
	aside?: string;
	title: string;
	sub?: string;
	/** the home card: photo after the first word of the title, and the mountain behind */
	home?: boolean;
	/** long titles step down a size */
	size?: number;
};

export async function render(c: Card): Promise<Buffer> {
	const title = clean(c.title);
	const size = c.size ?? (title.length > 70 ? 64 : title.length > 42 ? 78 : 104);
	const words = title.split(' ');

	const head = el(
		'div',
		{
			flex: 1,
			justifyContent: 'space-between',
			fontFamily: 'mono',
			fontSize: 20,
			color: INK3,
			letterSpacing: '0.02em',
		},
		text({}, c.kicker),
		c.aside ? text({}, c.aside) : el('div', {}),
	);

	const name = c.home
		? el(
				'div',
				{
					flexDirection: 'column',
					fontFamily: 'display',
					fontSize: 128,
					lineHeight: 0.86,
					letterSpacing: '-0.045em',
					color: INK,
				},
				el('div', { alignItems: 'flex-end' }, text({}, words[0]), {
					type: 'img',
					props: {
						src: me(),
						width: 90,
						height: 90,
						style: {
							marginLeft: 20,
							marginBottom: 10,
							border: `2px solid ${INK}`,
							objectFit: 'cover',
						},
					},
				}),
				text({}, words.slice(1).join(' ')),
			)
		: text(
				{
					fontFamily: 'display',
					fontSize: size,
					lineHeight: 0.94,
					letterSpacing: '-0.04em',
					color: INK,
					maxWidth: 980,
				},
				title,
			);

	const main = el(
		'div',
		{
			flexDirection: 'column',
			flex: 1,
			background: PAPER,
			padding: '40px 48px 44px',
			position: 'relative',
			overflow: 'hidden',
			minHeight: 0,
		},
		// the hills come first and everything after sits on top of them
		...(c.home ? [hills(720, 540)] : []),
		el('div', { position: 'relative' }, head),
		el(
			'div',
			{ flexDirection: 'column', marginTop: 'auto', position: 'relative' },
			name,
			c.sub
				? text(
						{
							marginTop: 26,
							fontFamily: 'sans',
							fontSize: 27,
							lineHeight: 1.3,
							color: INK2,
							maxWidth: c.home ? 520 : 820,
							letterSpacing: '-0.01em',
						},
						short_sub(clean(c.sub)),
					)
				: el('div', {}),
		),
	);

	// the sheet: ink showing through 1px gaps between paper blocks, like the site's grid
	const tree = el(
		'div',
		{ width: W, height: H, background: PAPER, padding: 16 },
		el(
			'div',
			{ width: W - 32, height: H - 32, background: INK, gap: 1, padding: 1, overflow: 'hidden' },
			main,
		),
	);

	const svg = await satori(tree as never, { width: W, height: H, fonts: load_fonts() });
	return new Resvg(c.home ? paint_in(svg) : svg, { fitTo: { mode: 'width', value: W } })
		.render()
		.asPng();
}
