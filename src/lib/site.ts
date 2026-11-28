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
export const theme = preference({
	name: 'theme',
	values: ['auto', 'light', 'dark'],
	default: 'auto',
});

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
			if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches)
				flip();
			else document.startViewTransition(flip);
		});
	});

/** marks the page as scripted before paint, so css can hold back things js will reveal */
export const js_flag = () =>
	script(() => {
		const root = document.documentElement;
		root.classList.add('js');
		// the first page of a visit gets the settle-in; every later page shows at once
		try {
			if (sessionStorage.getItem('seen')) root.classList.add('seen');
			else sessionStorage.setItem('seen', '1');
		} catch {}
	});

/** 2026-06-05 -> 2026.06 */
export const ym = (d: string) => d.slice(0, 7).replace('-', '.');
/** 2026-06-05 -> 06.05 */
export const md = (d: string) => d.slice(5, 10).replace('-', '.');
export const low = (s: string) => s.toLowerCase();

/** temporary: a small panel to try the paint brushes on the header and footer. the picks live in
 *  localStorage and are set on <html> before paint, so a reload or a new page keeps them */
export const paint_lab = () =>
	script(() => {
		const BRUSHES = ['off', 'brush', 'knife', 'dry', 'swirl', 'stipple'];
		const root = document.documentElement;
		const st = { corner: 'dry', salt: 'dry', k: '1' };
		try {
			Object.assign(st, JSON.parse(localStorage.getItem('paint') || '{}'));
		} catch {}
		const apply = () => {
			root.setAttribute('data-paint-corner', st.corner);
			root.setAttribute('data-paint-salt', st.salt);
			root.style.setProperty('--paint-k', st.k);
			try {
				localStorage.setItem('paint', JSON.stringify(st));
			} catch {}
		};
		apply();

		addEventListener('DOMContentLoaded', () => {
			const d = document.createElement('details');
			d.className = 'paint-lab';
			const sum = document.createElement('summary');
			const label = () => (sum.textContent = `✦ paint: ${st.corner} / ${st.salt}`);
			label();
			d.append(sum);
			for (const [key, name] of [
				['corner', 'corner patch'],
				['salt', 'salt spots'],
			] as const) {
				const g = document.createElement('div');
				g.className = 'grp';
				const t = document.createElement('span');
				t.textContent = name;
				const opts = document.createElement('div');
				opts.className = 'opts';
				const bs = BRUSHES.map((b) => {
					const el = document.createElement('button');
					el.type = 'button';
					el.textContent = b;
					el.setAttribute('aria-pressed', String(st[key] === b));
					el.onclick = () => {
						st[key] = b;
						bs.forEach((x) => x.setAttribute('aria-pressed', String(x.textContent === b)));
						apply();
						label();
					};
					return el;
				});
				opts.append(...bs);
				g.append(t, opts);
				d.append(g);
			}
			const g = document.createElement('div');
			g.className = 'grp';
			const t = document.createElement('span');
			const show = () => (t.textContent = `strength ${Math.round(+st.k * 100)}%`);
			show();
			const r = document.createElement('input');
			r.type = 'range';
			r.min = '0.3';
			r.max = '2';
			r.step = '0.05';
			r.value = st.k;
			r.oninput = () => {
				st.k = r.value;
				apply();
				show();
			};
			g.append(t, r);
			d.append(g);
			document.body.append(d);
		});
	});
