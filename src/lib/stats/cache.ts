// one stats result a day, shared by every build. cloudflare workers kv when a token is around
// (so ten preview deploys in a day reuse one result), else a file in node_modules/.cache.
// never throws: a failure means "use what we had", and no stats at all is a valid answer.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { compute, type Stats } from './compute.ts';

export const TTL = 24 * 60 * 60 * 1000;
const KEY = 'stats/stats.json';
const FILE = resolve('node_modules/.cache/puru-stats/stats.json');
/** a checked-in snapshot (refresh it with `pnpm stats:seed`). a build with no cache starts from
 *  here and only counts the days since, instead of every npm download since 2020. */
const SEED = resolve('src/lib/stats/seed.json');

type Store = { name: string; read(): Promise<Stats | null>; write(s: Stats): Promise<void> };

const file: Store = {
	name: 'file',
	async read() {
		try {
			return JSON.parse(await readFile(FILE, 'utf8'));
		} catch {
			return null;
		}
	},
	async write(s) {
		await mkdir(dirname(FILE), { recursive: true });
		await writeFile(FILE, JSON.stringify(s, null, '\t'));
	},
};

/** cloudflare workers kv, over the rest api (a build has no bindings). the build's own
 *  CLOUDFLARE_API_TOKEN works when it can edit kv; STATS_KV_TOKEN overrides it. */
const KV = {
	account: process.env.STATS_KV_ACCOUNT ?? 'a1f57716ab9ed74c3c41cc67dae0c404',
	namespace: process.env.STATS_KV_NAMESPACE ?? 'b247bd9d56fa41f3aa57127d7a59073f',
	token: () => process.env.STATS_KV_TOKEN ?? process.env.CLOUDFLARE_API_TOKEN,
};
const kv_url = () =>
	`https://api.cloudflare.com/client/v4/accounts/${KV.account}/storage/kv/namespaces/${KV.namespace}/values/${encodeURIComponent(KEY)}`;

const kv: Store = {
	name: 'workers kv',
	async read() {
		const res = await fetch(kv_url(), { headers: { authorization: `Bearer ${KV.token()}` } });
		return res.ok ? await res.json() : null;
	},
	async write(s) {
		const res = await fetch(kv_url(), {
			method: 'PUT',
			headers: { authorization: `Bearer ${KV.token()}`, 'content-type': 'application/json' },
			body: JSON.stringify(s),
		});
		if (!res.ok) throw new Error(`kv put ${res.status}`);
	},
};

const seed: Store = {
	name: 'seed',
	async read() {
		try {
			return JSON.parse(await readFile(SEED, 'utf8'));
		} catch {
			return null;
		}
	},
	async write() {},
};

const stores = (): Store[] => (KV.token() ? [kv, file, seed] : [file, seed]);

const fresh = (s: Stats | null) => !!s && Date.now() - Date.parse(s.fetchedAt) < TTL;

/** newest of what the stores hold */
async function read_any(log: (m: string) => void): Promise<Stats | null> {
	let best: Stats | null = null;
	for (const store of stores()) {
		const s = await store.read().catch(() => null);
		if (s && (!best || s.fetchedAt > best.fetchedAt)) best = s;
		if (s) log(`stats: ${store.name} has a result from ${s.fetchedAt}`);
	}
	return best;
}

/**
 * The stats for this build: the cached result if it is under a day old, else a fresh one.
 * Sections that fail now keep their last good value. `force` skips the cache.
 */
export async function get_stats(
	opts: { force?: boolean; full?: boolean; readOnly?: boolean; log?: (m: string) => void } = {},
): Promise<Stats | null> {
	const log = opts.log ?? ((m: string) => console.log(`[stats] ${m}`));
	try {
		const cached = await read_any(log);
		if (!opts.force && fresh(cached)) return cached;
		if (opts.readOnly || process.env.PURU_STATS === 'off') return cached;
		log('stats: older than a day, counting again');
		// npm downloads only add the days since the last count, unless `full` asks for the whole history
		const next = await compute(log, opts.full ? null : cached);
		// a section that failed is retried on the next build, so only a full result counts as fresh
		const whole = !!next.npm && !!next.github;
		const merged: Stats = {
			fetchedAt: whole ? next.fetchedAt : (cached?.fetchedAt ?? new Date(0).toISOString()),
			npm: next.npm ?? cached?.npm ?? null,
			// without a token the stars come back undated: keep the last dated series
			github: next.github
				? { ...next.github, starMonths: next.github.starMonths ?? cached?.github?.starMonths ?? null }
				: (cached?.github ?? null),
			code: next.code ?? cached?.code ?? null,
		};
		for (const store of stores()) {
			await store.write(merged).catch((e) => log(`stats: could not write ${store.name}: ${e?.message ?? e}`));
		}
		return merged;
	} catch (e) {
		log(`stats: failed (${e instanceof Error ? e.message : e}), using the last result`);
		return read_any(log).catch(() => null);
	}
}
