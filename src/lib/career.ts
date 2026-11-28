export type Job = {
	org: string;
	role: string;
	from: string; // yyyy-mm
	to: string | null; // null = now
	note?: string;
	href?: string;
};

/** newest first. the home page shows the first three. */
export const CAREER: Job[] = [
	{ org: 'schneider electric', role: 'software engineer', from: '2026-02', to: null, href: 'https://www.se.com' },
	{ org: 'svelte team', role: 'maintainer', from: '2023-02', to: null, note: 'ongoing, alongside everything else', href: 'https://svelte.dev' },
	{ org: 'beyonk', role: 'software engineer', from: '2025-04', to: '2025-12', href: 'https://beyonk.com' },
	{ org: 'clockwork labs', role: 'senior frontend engineer', from: '2024-02', to: '2024-12', note: 'spacetimedb site: 15× faster, 50× smaller', href: 'https://clockworklabs.io' },
	{ org: 'stackblitz', role: 'senior frontend engineer', from: '2022-01', to: '2023-03', href: 'https://stackblitz.com' },
	{ org: 'rigo', role: 'senior frontend engineer', from: '2021-08', to: '2021-12' },
];

/** "2026 – now", "2025", "2022 – 23" */
export function span(j: Job) {
	const a = j.from.slice(0, 4);
	if (!j.to) return `${a} – now`;
	const b = j.to.slice(0, 4);
	return a === b ? a : `${a} – ${b.slice(2)}`;
}
