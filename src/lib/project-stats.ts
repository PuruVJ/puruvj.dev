import type { Stats } from './stats/compute.ts';

/** `https://github.com/ogygiajs/bench/tree/main/...` -> `ogygiajs/bench` */
export function repo_of(url: string) {
	const m = url.match(/github\.com\/([^/]+\/[^/#?]+)/);
	return m ? m[1].toLowerCase() : null;
}

/** the numbers one project shows: downloads for its package group, stars for its own repo */
export function project_numbers(p: { stats: string; repo: { url: string } }, s: Stats | null) {
	const repo = repo_of(p.repo.url);
	// svelte.dev lives in the svelte repo: those stars are the whole team's, not this project's
	const own = repo && (repo.startsWith('puruvj/') || repo.startsWith('ogygiajs/'));
	return {
		downloads: s?.npm?.groups[p.stats] ?? null,
		stars: own ? (s?.github?.byRepo[repo!] ?? null) : null,
	};
}
