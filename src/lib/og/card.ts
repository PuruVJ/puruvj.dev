// open graph cards, drawn at build time: the site's own block grid, fonts and ink, at 1200×630.
// satori lays out a small tree of flex boxes into svg; resvg turns the svg into a png.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const W = 1200;
const H = 630;
const PAPER = '#f4f3ef';
const INK = '#0d0d0c';
const INK2 = '#4a4a47';
const INK3 = '#686760';
const HILL = ['#e8e6e0', '#dcd9d2', '#cbc8c0'];

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
const me = () => (photo ??= `data:image/jpeg;base64,${readFileSync(resolve('static/photos/puru.jpg')).toString('base64')}`);

type Node = { type: string; props: Record<string, unknown> & { style?: Record<string, unknown>; children?: unknown } };
const el = (type: string, style: Record<string, unknown>, ...children: unknown[]): Node => ({
	type,
	props: { style: { display: 'flex', ...style }, children: children.length === 1 ? children[0] : children },
});
const text = (style: Record<string, unknown>, s: string) => el('div', style, s);

/** the fonts are latin only: emoji and other symbols would draw as boxes, so they go */
const clean = (s: string) =>
	s
		.replace(/[^\p{Script=Latin}\p{N}\p{P}\p{Zs}+=<>|~^$`×→↗–—'’"“”…]/gu, '')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase();

/** the mountain from the home page, simplified: three flat sheets, a snow cap and the sun */
function hills(w: number, h: number) {
	const p = (pts: [number, number][]) => 'M' + pts.map(([x, y]) => `${(x * w).toFixed(1)} ${(y * h).toFixed(1)}`).join('L') + 'Z';
	return {
		type: 'svg',
		props: {
			width: w,
			height: h,
			viewBox: `0 0 ${w} ${h}`,
			style: { position: 'absolute', right: 0, bottom: 0 },
			children: [
				{ type: 'path', props: { fill: HILL[0], d: p([[0, 1], [0, 0.62], [0.18, 0.5], [0.34, 0.66], [0.5, 0.48], [0.6, 0.56], [1, 0.44], [1, 1]]) } },
				{ type: 'path', props: { fill: HILL[1], d: p([[0.28, 1], [0.5, 0.74], [0.6, 0.66], [0.78, 0.16], [0.84, 0.1], [0.9, 0.2], [1, 0.36], [1, 1]]) } },
				{ type: 'path', props: { fill: HILL[2], d: p([[0.84, 0.1], [0.9, 0.2], [1, 0.36], [1, 1], [0.86, 1]]) } },
				{ type: 'path', props: { fill: '#fbfaf7', d: p([[0.81, 0.13], [0.84, 0.1], [0.87, 0.15], [0.845, 0.2], [0.83, 0.17]]) } },
				{ type: 'circle', props: { fill: '#d6d3cb', cx: 0.62 * w, cy: 0.16 * h, r: 22 } },
			],
		},
	};
}

/** a description, cut at a word to about three lines */
const short_sub = (s: string, max = 150) => (s.length <= max ? s : s.slice(0, s.lastIndexOf(' ', max)).replace(/[,.;:]$/, '') + '…');

export type Card = {
	/** the mono label at the top left: "01  puruvj.dev", "writing · 2026.06.05" */
	kicker: string;
	/** right side of the label row */
	aside?: string;
	title: string;
	sub?: string;
	/** the right-hand column: up to three facts, each a big line over a small one */
	facts?: { big: string; small: string }[];
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
		{ flex: 1, justifyContent: 'space-between', fontFamily: 'mono', fontSize: 20, color: INK3, letterSpacing: '0.02em' },
		text({}, c.kicker),
		c.aside ? text({}, c.aside) : el('div', {}),
	);

	const name = c.home
		? el(
				'div',
				{ flexDirection: 'column', fontFamily: 'display', fontSize: 128, lineHeight: 0.86, letterSpacing: '-0.045em', color: INK },
				el(
					'div',
					{ alignItems: 'flex-end' },
					text({}, words[0]),
					{
						type: 'img',
						props: {
							src: me(),
							width: 90,
							height: 90,
							style: { marginLeft: 20, marginBottom: 10, border: `2px solid ${INK}`, objectFit: 'cover' },
						},
					},
				),
				text({}, words.slice(1).join(' ')),
			)
		: text(
				{
					fontFamily: 'display',
					fontSize: size,
					lineHeight: 0.94,
					letterSpacing: '-0.04em',
					color: INK,
					maxWidth: 780,
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
		...(c.home ? [hills(470, 330)] : []),
		el('div', { position: 'relative' }, head),
		el(
			'div',
			{ flexDirection: 'column', marginTop: 'auto', position: 'relative' },
			name,
			c.sub
				? text(
						{ marginTop: 26, fontFamily: 'sans', fontSize: 27, lineHeight: 1.3, color: INK2, maxWidth: 720, letterSpacing: '-0.01em' },
						short_sub(clean(c.sub)),
					)
				: el('div', {}),
		),
	);

	const facts = (c.facts ?? []).slice(0, 3);
	const side = el(
		'div',
		{ flexDirection: 'column', width: 300, gap: 1 },
		...facts.map((f) =>
			el(
				'div',
				{ flexDirection: 'column', flex: 1, background: PAPER, padding: '28px 30px', justifyContent: 'flex-end' },
				text({ fontFamily: 'display', fontSize: 52, letterSpacing: '-0.035em', color: INK, lineHeight: 1 }, f.big),
				text({ marginTop: 10, fontFamily: 'mono', fontSize: 17, color: INK3 }, f.small),
			),
		),
		el(
			'div',
			{ background: PAPER, padding: '22px 30px', justifyContent: 'space-between', alignItems: 'center' },
			text({ fontFamily: 'sans', fontWeight: 500, fontSize: 22, color: INK, letterSpacing: '-0.02em' }, 'puruvj.dev'),
			c.home
				? el('div', {})
				: {
						type: 'img',
						props: { src: me(), width: 44, height: 44, style: { border: `1.5px solid ${INK}`, objectFit: 'cover' } },
					},
		),
	);

	// the sheet: ink showing through 1px gaps between paper blocks, like the site's grid
	const tree = el(
		'div',
		{ width: W, height: H, background: PAPER, padding: 16 },
		el('div', { width: W - 32, height: H - 32, background: INK, gap: 1, padding: 1, overflow: 'hidden' }, main, side),
	);

	const svg = await satori(tree as never, { width: W, height: H, fonts: load_fonts() });
	return new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng();
}
