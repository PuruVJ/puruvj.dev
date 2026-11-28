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
		/** the last day counted (yyyy-mm-dd): the next count only adds the days after it */
		through: string;
		packages: Record<string, number>;
		groups: Record<string, number>;
		/** downloads per month (yyyy-mm), every package, and per project group */
		months?: Record<string, number>;
		groupMonths?: Record<string, Record<string, number>>;
	} | null;
	github: {
		stars: number;
		repos: number;
		byRepo: Record<string, number>;
		/** stars gained per month (yyyy-mm), from each stargazer's starred_at. needs a token. */
		starMonths?: Record<string, number> | null;
	} | null;
	code: {
		additions: number;
		deletions: number;
		commits: number;
		repos: number;
		/** the user's additions, deletions and commits per week (keyed by the week's sunday) */
		weeks?: Record<string, [number, number, number]>;
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
		for (const o of objs) if (!o.package.name.startsWith('@aibind/')) names.add(o.package.name);
		if (objs.length < 250) break;
	}
	// predecessors that may not list the user as a maintainer any more
	for (const list of Object.values(GROUPS)) for (const p of list) if (!p.includes('*')) names.add(p);
	return [...names].sort();
}

const DAY = 86_400_000;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

/** yesterday: the newest day npm has a full count for */
const last_day = () => iso(Date.now() - DAY);

/** date windows, newest first, each at most `days` long, from `since` (npm's first data by default) to yesterday */
function windows(days: number, since = '2015-01-10'): [string, string][] {
	const out: [string, string][] = [];
	const start = Date.parse(since);
	let end = Date.parse(last_day());
	while (end >= start) {
		const from = Math.max(start, end - (days - 1) * DAY);
		out.push([iso(from), iso(end)]);
		end = from - DAY;
	}
	return out;
}

type Row = { day: string; downloads: number };
const sum = (rows: Row[] | undefined) => (rows ?? []).reduce((n, r) => n + r.downloads, 0);

/** per-package downloads by month, filled as the daily rows come in */
type Months = Record<string, Record<string, number>>;
function track(m: Months | undefined, pkg: string, rows: Row[] | undefined) {
	if (!m || !rows) return;
	const t = (m[pkg] ??= {});
	for (const r of rows) if (r.downloads) t[r.day.slice(0, 7)] = (t[r.day.slice(0, 7)] ?? 0) + r.downloads;
}

/** all-time downloads for one package: walk back until a window is empty (before it existed) */
async function all_time(pkg: string, m?: Months): Promise<number> {
	let total = 0;
	for (const [a, b] of windows(540)) {
		const r = await get_json(`https://api.npmjs.org/downloads/range/${a}:${b}/${pkg}`);
		track(m, pkg, r?.downloads);
		const n = sum(r?.downloads);
		total += n;
		if (n === 0) break;
	}
	return total;
}

/** unscoped packages go 128 at a time over 365-day windows (npm's bulk limits) */
async function all_time_bulk(pkgs: string[], m?: Months): Promise<Record<string, number>> {
	const out: Record<string, number> = Object.fromEntries(pkgs.map((p) => [p, 0]));
	let alive = [...pkgs];
	for (const [a, b] of windows(365)) {
		if (!alive.length) break;
		const still: string[] = [];
		for (let i = 0; i < alive.length; i += 128) {
			const batch = alive.slice(i, i + 128);
			if (batch.length === 1) {
				const r = await get_json(`https://api.npmjs.org/downloads/range/${a}:${b}/${batch[0]}`);
				track(m, batch[0], r?.downloads);
				const n = sum(r?.downloads);
				out[batch[0]] += n;
				if (n > 0) still.push(batch[0]);
				continue;
			}
			const r = await get_json(`https://api.npmjs.org/downloads/range/${a}:${b}/${batch.join(',')}`);
			for (const p of batch) {
				track(m, p, r?.[p]?.downloads);
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

/**
 * Downloads since the last count, added to it: one call per scoped package and one bulk call for
 * the rest, instead of the whole history. Packages without a last count get the full walk.
 */
async function since_last(prev: NonNullable<Stats['npm']>, pkgs: string[], log: Log, m: Months) {
	const from = iso(Date.parse(prev.through) + DAY);
	const to = last_day();
	const packages: Record<string, number> = {};
	const known = pkgs.filter((p) => p in prev.packages);
	for (const p of known) packages[p] = prev.packages[p];
	if (from <= to) {
		const days = (Date.parse(to) - Date.parse(from)) / DAY + 1;
		if (days > 365) return null; // too far behind for one window: count everything again
		const plain = known.filter((p) => !p.startsWith('@'));
		for (let i = 0; i < plain.length; i += 128) {
			const batch = plain.slice(i, i + 128);
			const r = await get_json(`https://api.npmjs.org/downloads/range/${from}:${to}/${batch.join(',')}`);
			for (const p of batch) {
				const rows = batch.length === 1 ? r?.downloads : r?.[p]?.downloads;
				track(m, p, rows);
				packages[p] += sum(rows);
			}
		}
		for (const p of known.filter((p) => p.startsWith('@'))) {
			const r = await get_json(`https://api.npmjs.org/downloads/range/${from}:${to}/${p}`);
			track(m, p, r?.downloads);
			packages[p] += sum(r?.downloads);
		}
	}
	const fresh = pkgs.filter((p) => !(p in prev.packages));
	if (fresh.length) log(`npm: ${fresh.length} new packages, counting their whole history`);
	Object.assign(packages, await all_time_bulk(fresh.filter((p) => !p.startsWith('@')), m));
	for (const p of fresh.filter((p) => p.startsWith('@'))) packages[p] = await all_time(p, m);
	return packages;
}

export async function npm_stats(log: Log, prev?: Stats['npm']): Promise<NonNullable<Stats['npm']>> {
	const pkgs = await npm_packages();
	// a count from before the monthly series existed can't be extended: its series would start today
	if (prev && !prev.months) prev = null;
	log(`npm: ${pkgs.length} packages${prev?.through ? `, adding the days since ${prev.through}` : ', counting every day since 2015'}`);
	let m: Months = {};
	let packages = prev?.through ? await since_last(prev, pkgs, log, m) : null;
	let incremental = !!packages;
	if (!packages) {
		m = {};
		incremental = false;
		const scoped = pkgs.filter((p) => p.startsWith('@'));
		packages = await all_time_bulk(pkgs.filter((p) => !p.startsWith('@')), m);
		for (const p of scoped) packages[p] = await all_time(p, m);
	}
	// the new months, added onto the old series (or the whole series, after a full count)
	const add = (into: Record<string, number>, from: Record<string, number>) => {
		for (const [k, n] of Object.entries(from)) into[k] = (into[k] ?? 0) + n;
		return into;
	};
	const months = add(incremental ? { ...prev!.months } : {}, {});
	const groupMonths: Record<string, Record<string, number>> = {};
	for (const g of Object.keys(GROUPS)) groupMonths[g] = incremental ? { ...(prev!.groupMonths?.[g] ?? {}) } : {};
	for (const [p, pm] of Object.entries(m)) {
		add(months, pm);
		for (const [g, pats] of Object.entries(GROUPS)) if (in_group(p, pats)) add(groupMonths[g], pm);
	}
	const groups: Record<string, number> = {};
	for (const [g, pats] of Object.entries(GROUPS)) {
		groups[g] = Object.entries(packages)
			.filter(([p]) => in_group(p, pats))
			.reduce((n, [, d]) => n + d, 0);
	}
	const total = Object.values(packages).reduce((a, b) => a + b, 0);
	log(`npm: ${total.toLocaleString()} downloads, all time`);
	return { total, packages, groups, through: last_day(), months, groupMonths };
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
	const starMonths = process.env.GITHUB_TOKEN ? await star_months(list, log) : null;
	return { stars, repos: list.length, byRepo, starMonths };
}

/** when each star arrived. one call per 100 stars, so only with a token. */
async function star_months(list: Repo[], log: Log): Promise<Record<string, number> | null> {
	const out: Record<string, number> = {};
	const headers = { ...gh_headers(), accept: 'application/vnd.github.star+json' };
	let seen = 0;
	await pool(
		list.filter((r) => r.stargazers_count > 0),
		4,
		async (r) => {
			for (let page = 1; page <= 400; page++) {
				const rows: { starred_at: string }[] | null = await get_json(
					`https://api.github.com/repos/${r.full_name}/stargazers?per_page=100&page=${page}`,
					{ headers },
					3,
				);
				if (!rows) break;
				for (const x of rows) {
					const k = x.starred_at.slice(0, 7);
					out[k] = (out[k] ?? 0) + 1;
				}
				seen += rows.length;
				if (rows.length < 100) break;
			}
		},
	);
	log(`github: ${seen} stars dated`);
	return seen ? out : null;
}

/** lines added and removed by the user across their repos. github computes these lazily (202). */
export async function code_stats(log: Log, all?: Repo[]): Promise<NonNullable<Stats['code']>> {
	const list = (all ?? (await repos())).filter((r) => r.size > 0);
	let pending = list.map((r) => r.full_name);
	const done = new Map<string, { a: number; d: number; c: number }>();
	const weeks: Record<string, [number, number, number]> = {};
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
			for (const w of me?.weeks ?? []) {
				if (!w.a && !w.d && !w.c) continue;
				const k = iso(w.w * 1000);
				const t = (weeks[k] ??= [0, 0, 0]);
				t[0] += w.a;
				t[1] += w.d;
				t[2] += w.c;
			}
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
	return { additions, deletions, commits, repos: done.size, weeks };
}

/** everything, section by section. a failed section comes back null. */
export async function compute(log: Log = console.log, prev?: Stats | null): Promise<Stats> {
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
		safe('npm', () => npm_stats(log, prev?.npm)),
		list ? safe('github', () => github_stats(log, list)) : null,
		// the contributor stats cost one call per repo: only with a token (60 calls an hour without)
		list && process.env.GITHUB_TOKEN ? safe('code', () => code_stats(log, list)) : null,
	]);
	return { fetchedAt: new Date().toISOString(), npm, github, code };
}
