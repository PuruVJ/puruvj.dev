// the ridge: the name block's bottom edge is cut along a low mountain line, and that line is the
// rule between the name block and the blocks under it. x in % of the block's width, y in px above
// its bottom edge. low under the menu, rising on the right where the mountain stands.
const RIDGE: [number, number][] = [
	[0, 16],
	[14, 30],
	[24, 20],
	[40, 48],
	[52, 38],
	[66, 76],
	[78, 104],
	[86, 88],
	[93, 98],
	[100, 72],
];

/** how tall the ridge is: about half on desktop, about a third on a phone */
export const DESK = 0.5;
export const PHONE = 0.3;

const at = (k: number) => RIDGE.map(([x, y]) => [x, Math.round(y * k)] as const);

/** the highest point, in px: how far the name block reaches down past its grid row */
export const rise = (k: number) => Math.max(...at(k).map(([, y]) => y));

/** clip-path for the name block: everything above the ridge */
export const clip = (k: number) =>
	`polygon(0 0, 100% 0, ${at(k)
		.slice()
		.reverse()
		.map(([x, y]) => `${x}% calc(100% - ${y}px)`)
		.join(', ')})`;

/** the ridge as polyline points in a 100-wide box `rise + 1` tall, drawn half a pixel inside the
 *  clip so the whole line shows */
export const line = (k: number) =>
	at(k)
		.map(([x, y]) => `${x},${(rise(k) - y + 0.5).toFixed(1)}`)
		.join(' ');
