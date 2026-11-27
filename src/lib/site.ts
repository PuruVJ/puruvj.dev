import { preference, script } from 'ogygia';

export const SITE = 'https://puruvj.dev';
/** the way to reach me: a dm on x */
export const DM = 'https://x.com/puruvjdev';

export const ELSEWHERE = [
	{ name: 'github', href: 'https://github.com/puruvj' },
	{ name: 'x', href: 'https://x.com/puruvjdev' },
	{ name: 'bluesky', href: 'https://bsky.app/profile/puruvj.dev' },
	{ name: 'dev.to', href: 'https://dev.to/puruvj' },
	{ name: 'rss', href: '/rss.xml' },
];

export const NAV = [
	{ name: 'writing', href: '/blog' },
	{ name: 'work', href: '/work' },
	{ name: 'career', href: '/career' },
	{ name: 'talks', href: '/speaking' },
	{ name: 'stats', href: '/stats' },
];

/** light / dark / follow the system. lives on <html data-pref-theme>, set before paint. */
export const theme = preference({ name: 'theme', values: ['auto', 'light', 'dark'], default: 'auto' });

/** the one theme button: steps through device → light → dark → device. the icon shows the mode. */
export const theme_toggle = () =>
	script(() => {
		document.addEventListener('click', (e) => {
			const t = e.target as Element | null;
			const btn = t?.closest?.('[data-theme-toggle]');
			if (!btn) return;
			const root = document.documentElement;
			const cur = root.getAttribute('data-pref-theme') ?? 'auto';
			const next = cur === 'light' ? 'dark' : cur === 'dark' ? 'auto' : 'light';
			try {
				localStorage.setItem('og-pref-theme', next);
			} catch {}
			const flip = () => root.setAttribute('data-pref-theme', next);
			// a soft crossfade where the browser can do it; instant for reduced motion
			if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) flip();
			else document.startViewTransition(flip);
		});
	});

/** marks the page as scripted before paint, so css can hold back things js will reveal */
export const js_flag = () => script(() => document.documentElement.classList.add('js'));

/** 2026-06-05 -> 2026.06 */
export const ym = (d: string) => d.slice(0, 7).replace('-', '.');
/** 2026-06-05 -> 06.05 */
export const md = (d: string) => d.slice(5, 10).replace('-', '.');
export const low = (s: string) => s.toLowerCase();

/** the flourish lab (experiment branch only): which extras are on lives in <html data-fl>,
 *  read from localStorage before paint. a small panel bottom-left flips them one by one. */
export const flourish_lab = () =>
	script(() => {
		const ALL = ['marks', 'wipe', 'tick', 'settle', 'label', 'grain', 'nudge', 'type', 'colophon'];
		const HELP: Record<string, string> = {
			marks: 'register crosses in block corners',
			wipe: 'link underline runs in on hover',
			tick: 'clock colon breathes',
			settle: 'blocks fade in one by one on load',
			label: 'block number inks in on hover',
			grain: 'faint paper grain',
			nudge: 'arrows lean forward on hover',
			type: 'balanced headings, hanging quotes',
			colophon: 'footer says when it was printed',
		};
		const root = document.documentElement;
		let on: string[] = ALL;
		try {
			const saved = localStorage.getItem('fl');
			if (saved !== null) on = saved.split(' ').filter((k) => ALL.includes(k));
		} catch {}
		const apply = () => {
			root.setAttribute('data-fl', on.join(' '));
			try {
				localStorage.setItem('fl', on.join(' '));
			} catch {}
		};
		root.setAttribute('data-fl', on.join(' '));

		addEventListener('DOMContentLoaded', () => {
			// wrap the arrows in links so they can lean
			for (const a of document.querySelectorAll('a')) {
				const walk = document.createTreeWalker(a, NodeFilter.SHOW_TEXT);
				const hits: Text[] = [];
				while (walk.nextNode()) if (/[→↗]/.test(walk.currentNode.nodeValue!)) hits.push(walk.currentNode as Text);
				for (const t of hits) {
					const parts = t.nodeValue!.split(/([→↗])/);
					t.replaceWith(
						...parts.map((p) => {
							if (p !== '→' && p !== '↗') return p;
							const s = document.createElement('span');
							s.className = p === '↗' ? 'arr ne' : 'arr';
							s.textContent = p;
							return s;
						}),
					);
				}
			}

			// the panel
			const d = document.createElement('details');
			d.className = 'fl-lab';
			const sum = document.createElement('summary');
			const count = () => (sum.textContent = `✦ flourishes ${on.length}/${ALL.length}`);
			count();
			d.append(sum);
			const boxes: HTMLInputElement[] = [];
			for (const k of ALL) {
				const l = document.createElement('label');
				const i = document.createElement('input');
				i.type = 'checkbox';
				i.checked = on.includes(k);
				i.onchange = () => {
					on = ALL.filter((x) => (x === k ? i.checked : on.includes(x)));
					apply();
					count();
				};
				boxes.push(i);
				const name = document.createElement('span');
				name.textContent = k;
				const help = document.createElement('small');
				help.textContent = HELP[k];
				l.append(i, name, help);
				d.append(l);
			}
			const row = document.createElement('div');
			row.className = 'row';
			const set = (next: string[]) => {
				on = next;
				boxes.forEach((b, j) => (b.checked = on.includes(ALL[j])));
				apply();
				count();
			};
			for (const [txt, fn] of [
				['all on', () => set(ALL)],
				['all off', () => set([])],
			] as const) {
				const b = document.createElement('button');
				b.type = 'button';
				b.textContent = txt;
				b.onclick = fn;
				row.append(b);
			}
			d.append(row);
			document.body.append(d);
		});
	});
