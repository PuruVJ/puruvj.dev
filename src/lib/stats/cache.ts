// one stats result a day, shared by every build. vercel blob when BLOB_READ_WRITE_TOKEN is set
// (so ten preview deploys in a day reuse one result), else a file in node_modules/.cache.
// never throws: a failure means "use what we had", and no stats at all is a valid answer.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { compute, type Stats } from './compute.ts';

export const TTL = 24 * 60 * 60 * 1000;
const KEY = 'stats/stats.json';
const FILE = resolve('node_modules/.cache/puru-stats/stats.json');

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

const blob: Store = {
	name: 'vercel blob',
	async read() {
		const { head } = await import('@vercel/blob');
		try {
			const meta = await head(KEY);
			const res = await fetch(`${meta.url}?t=${Date.now()}`, { cache: 'no-store' });
			return res.ok ? await res.json() : null;
		} catch {
			return null;
		}
	},
	async write(s) {
		const { put } = await import('@vercel/blob');
		await put(KEY, JSON.stringify(s), {
			access: 'public',
			addRandomSuffix: false,
			allowOverwrite: true,
			contentType: 'application/json',
			cacheControlMaxAge: 60,
		});
	},
};

const stores = (): Store[] => (process.env.BLOB_READ_WRITE_TOKEN ? [blob, file] : [file]);

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
