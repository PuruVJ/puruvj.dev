import { preference } from 'ogygia';

export const SITE = 'https://puruvj.dev';
export const EMAIL = 'devpuruvj@gmail.com';

export const ELSEWHERE = [
	{ name: 'github', href: 'https://github.com/puruvj' },
	{ name: 'x', href: 'https://x.com/puruvjdev' },
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

/** 2026-06-05 -> 2026.06 */
export const ym = (d: string) => d.slice(0, 7).replace('-', '.');
/** 2026-06-05 -> 06.05 */
export const md = (d: string) => d.slice(5, 10).replace('-', '.');
export const low = (s: string) => s.toLowerCase();
