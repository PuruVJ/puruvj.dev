import { dev } from '$app/environment';
import { content, type Source } from '@ogygia/content';
import { get_stats } from './cache.ts';
import type { Stats } from './compute.ts';

let once: Promise<Stats | null> | undefined;
// the dev server only reads the cache: `pnpm stats` or a build does the counting
const load = () => (once ??= get_stats({ readOnly: dev }));

/**
 * The stats as an ogygia content source: one entry, `all`. It is counted (or read from the shared
 * one-day cache) the first time a page asks, once per build process.
 */
const source: Source = {
	async refs() {
		const s = await load();
		return s ? [{ id: 'all', data: s as unknown as Record<string, unknown> }] : [];
	},
	async get(id) {
		if (id !== 'all') return null;
		const s = await load();
		return s ? { id, data: s as unknown as Record<string, unknown> } : null;
	},
};

export const stats = content({ loader: source });

export async function read_stats(): Promise<Stats | null> {
	const e = await stats.get('all');
	return (e?.data as unknown as Stats) ?? null;
}
