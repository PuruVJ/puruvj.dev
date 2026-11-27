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
