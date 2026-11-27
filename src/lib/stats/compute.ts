// the numbers behind /stats, /work and the home page. pure fetch, no framework imports, so
// `node scripts/stats.ts` can run it too. every section fails on its own: a dead api leaves that
// section null, and the caller fills it from the last good value.

export const NPM_USER = 'puruvj';
export const GITHUB_USER = 'PuruVJ';
export const GITHUB_ORGS = ['ogygiajs'];

/** a project's packages: exact names, or `@scope/*` for every package in a scope */
export const GROUPS: Record<string, string[]> = {
	ogygia: ['ogygia', '@ogygia/*'],
	neodrag: ['@neodrag/*', 'svelte-drag'],
	neoconfetti: ['@neoconfetti/*', 'svelte-confetti-explosion'],
	neotraverse: ['neotraverse'],
	neosanitize: ['neosanitize'],
	heisenbench: ['heisenbench'],
};

export type Stats = {
	fetchedAt: string;
	npm: {
		total: number;
		packages: Record<string, number>;
		groups: Record<string, number>;
	} | null;
	github: {
		stars: number;
		repos: number;
		byRepo: Record<string, number>;
	} | null;
	code: {
		additions: number;
		deletions: number;
		commits: number;
		repos: number;
	} | null;
};

type Log = (msg: string) => void;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const UA = { 'user-agent': 'puruvj.dev-stats' };

/** fetch json, backing off on 429 and 5xx */
async function get_json(url: string, init: RequestInit = {}, tries = 10): Promise<any> {
	let wait = 2000;
	for (let i = 0; i < tries; i++) {
		// npm's download api rate-limits hard (and says `retry-after: 0`): pace every call
		if (url.includes('api.npmjs.org')) await sleep(350);
		const res = await fetch(url, { ...init, headers: { ...UA, ...(init.headers as object) } });
		if (res.status === 429 || res.status >= 500) {
			const after = Number(res.headers.get('retry-after'));
			await sleep(Math.max(after * 1000 || 0, wait));
			wait = Math.min(wait * 2, 30_000);
			continue;
		}
		if (res.status === 404) return null;
		if (!res.ok) throw new Error(`${res.status} ${url}`);
		return res.json();
	}
	throw new Error(`gave up on ${url}`);
}

async function pool<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
	const out: R[] = new Array(items.length);
	let next = 0;
	await Promise.all(
		Array.from({ length: Math.min(n, items.length) }, async () => {
			while (next < items.length) {
				const i = next++;
				out[i] = await fn(items[i]);
			}
		}),
	);
	return out;
}

// ---------- npm ----------

export async function npm_packages(): Promise<string[]> {
	const names = new Set<string>();
	for (let from = 0; ; from += 250) {
		const r = await get_json(
			`https://registry.npmjs.org/-/v1/search?text=maintainer:${NPM_USER}&size=250&from=${from}`,
		);
		const objs = r?.objects ?? [];
		for (const o of objs) names.add(o.package.name);
		if (objs.length < 250) break;
	}
	// predecessors that may not list the user as a maintainer any more
	for (const list of Object.values(GROUPS)) for (const p of list) if (!p.includes('*')) names.add(p);
	return [...names].sort();
}

const DAY = 86_400_000;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

/** date windows, newest first, each at most `days` long, back to 2015-01-10 (npm's first data) */
function windows(days: number): [string, string][] {
	const out: [string, string][] = [];
	const start = Date.parse('2015-01-10');
	let end = Date.now() - DAY;
	while (end >= start) {
		const from = Math.max(start, end - (days - 1) * DAY);
		out.push([iso(from), iso(end)]);
		end = from - DAY;
	}
	return out;
}

const sum = (rows: { downloads: number }[] | undefined) => (rows ?? []).reduce((n, r) => n + r.downloads, 0);

/** all-time downloads for one package: walk back until a window is empty (before it existed) */
async function all_time(pkg: string): Promise<number> {
	let total = 0;
	for (const [a, b] of windows(540)) {
		const r = await get_json(`https://api.npmjs.org/downloads/range/${a}:${b}/${pkg}`);
		const n = sum(r?.downloads);
		total += n;
		if (n === 0) break;
	}
	return total;
}

/** unscoped packages go 128 at a time over 365-day windows (npm's bulk limits) */
async function all_time_bulk(pkgs: string[]): Promise<Record<string, number>> {
	const out: Record<string, number> = Object.fromEntries(pkgs.map((p) => [p, 0]));
	let alive = [...pkgs];
	for (const [a, b] of windows(365)) {
		if (!alive.length) break;
		const still: string[] = [];
		for (let i = 0; i < alive.length; i += 128) {
			const batch = alive.slice(i, i + 128);
			if (batch.length === 1) {
				const r = await get_json(`https://api.npmjs.org/downloads/range/${a}:${b}/${batch[0]}`);
				const n = sum(r?.downloads);
				out[batch[0]] += n;
				if (n > 0) still.push(batch[0]);
				continue;
			}
			const r = await get_json(`https://api.npmjs.org/downloads/range/${a}:${b}/${batch.join(',')}`);
			for (const p of batch) {
				const n = sum(r?.[p]?.downloads);
				out[p] += n;
				if (n > 0) still.push(p);
			}
		}
		alive = still;
	}
	return out;
}

function in_group(pkg: string, patterns: string[]) {
	return patterns.some((p) => (p.endsWith('/*') ? pkg.startsWith(p.slice(0, -1)) : pkg === p));
}

export async function npm_stats(log: Log): Promise<NonNullable<Stats['npm']>> {
	const pkgs = await npm_packages();
	log(`npm: ${pkgs.length} packages`);
	const scoped = pkgs.filter((p) => p.startsWith('@'));
	const plain = pkgs.filter((p) => !p.startsWith('@'));
	const packages: Record<string, number> = await all_time_bulk(plain);
	const counts = await pool(scoped, 1, all_time);
	scoped.forEach((p, i) => (packages[p] = counts[i]));
	const groups: Record<string, number> = {};
	for (const [g, pats] of Object.entries(GROUPS)) {
		groups[g] = Object.entries(packages)
			.filter(([p]) => in_group(p, pats))
			.reduce((n, [, d]) => n + d, 0);
	}
	const total = Object.values(packages).reduce((a, b) => a + b, 0);
	log(`npm: ${total.toLocaleString()} downloads, all time`);
	return { total, packages, groups };
}

// ---------- github ----------

function gh_headers(): Record<string, string> {
	const token = process.env.GITHUB_TOKEN;
	return {
		accept: 'application/vnd.github+json',
		...(token ? { authorization: `Bearer ${token}` } : {}),
	};
}

type Repo = { full_name: string; fork: boolean; stargazers_count: number; archived: boolean; size: number };

async function repos(): Promise<Repo[]> {
	const out: Repo[] = [];
	const lists = [
		`https://api.github.com/users/${GITHUB_USER}/repos?type=owner&per_page=100`,
		...GITHUB_ORGS.map((o) => `https://api.github.com/orgs/${o}/repos?type=sources&per_page=100`),
	];
	for (const base of lists) {
		for (let page = 1; ; page++) {
			const r: Repo[] | null = await get_json(`${base}&page=${page}`, { headers: gh_headers() }, 3);
			if (!r) break;
			out.push(...r);
			if (r.length < 100) break;
		}
	}
	return out.filter((r) => !r.fork);
}

export async function github_stats(log: Log, all?: Repo[]): Promise<NonNullable<Stats['github']>> {
	const list = all ?? (await repos());
	const byRepo = Object.fromEntries(list.map((r) => [r.full_name.toLowerCase(), r.stargazers_count]));
	const stars = list.reduce((n, r) => n + r.stargazers_count, 0);
	log(`github: ${list.length} repos, ${stars} stars`);
	return { stars, repos: list.length, byRepo };
}

/** lines added and removed by the user across their repos. github computes these lazily (202). */
export async function code_stats(log: Log, all?: Repo[]): Promise<NonNullable<Stats['code']>> {
	const list = (all ?? (await repos())).filter((r) => r.size > 0);
	let pending = list.map((r) => r.full_name);
	const done = new Map<string, { a: number; d: number; c: number }>();
	for (let round = 0; round < 6 && pending.length; round++) {
		if (round) await sleep(3000 * round);
		const again: string[] = [];
		await pool(pending, 4, async (name) => {
			const res = await fetch(`https://api.github.com/repos/${name}/stats/contributors`, {
				headers: { ...UA, ...gh_headers() },
			});
			if (res.status === 202) return again.push(name);
			if (res.status === 204 || res.status === 404 || res.status === 409) return done.set(name, { a: 0, d: 0, c: 0 });
			if (!res.ok) throw new Error(`${res.status} contributors ${name}`);
			const rows: any[] = await res.json();
			const me = rows.find((r) => r.author?.login?.toLowerCase() === GITHUB_USER.toLowerCase());
			const a = me ? me.weeks.reduce((n: number, w: any) => n + w.a, 0) : 0;
			const d = me ? me.weeks.reduce((n: number, w: any) => n + w.d, 0) : 0;
			done.set(name, { a, d, c: me?.total ?? 0 });
		});
		pending = again;
	}
	if (pending.length) log(`code: github was still counting ${pending.length} repos, left out`);
	let additions = 0;
	let deletions = 0;
	let commits = 0;
	for (const v of done.values()) {
		additions += v.a;
		deletions += v.d;
		commits += v.c;
	}
	log(`code: +${additions} -${deletions}, ${commits} commits over ${done.size} repos`);
	return { additions, deletions, commits, repos: done.size };
}

/** everything, section by section. a failed section comes back null. */
export async function compute(log: Log = console.log): Promise<Stats> {
	const safe = async <T>(name: string, fn: () => Promise<T>): Promise<T | null> => {
		try {
			return await fn();
		} catch (e) {
			log(`${name} failed: ${e instanceof Error ? e.message : e}`);
			return null;
		}
	};
	const list = await safe('github repos', repos);
	const [npm, github, code] = await Promise.all([
		safe('npm', () => npm_stats(log)),
		list ? safe('github', () => github_stats(log, list)) : null,
		// the contributor stats cost one call per repo: only with a token (60 calls an hour without)
		list && process.env.GITHUB_TOKEN ? safe('code', () => code_stats(log, list)) : null,
	]);
	return { fetchedAt: new Date().toISOString(), npm, github, code };
}
