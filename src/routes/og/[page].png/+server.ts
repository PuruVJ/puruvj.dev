import { error } from '@sveltejs/kit';
import { render, type Card } from '#lib/og/card.ts';
import { posts, projects, talks } from '#lib/content.server.ts';
import { read_stats } from '#lib/stats/source.server.ts';
import { CAREER, span } from '#lib/career.ts';
import { full } from '#lib/numbers.ts';
import { LIFE_LEDE } from '#lib/life.ts';

export const prerender = true;
export const entries = () =>
	['home', 'writing', 'work', 'career', 'speaking', 'stats', 'life'].map((page) => ({ page }));

async function card(page: string): Promise<Card | null> {
	const [p, s] = await Promise.all([posts(), read_stats()]);
	switch (page) {
		case 'home':
			return {
				kicker: 'puruvj.dev',
				title: 'puru vijayvargia',
				sub: 'engineer. svelte guy. i make small, reliable, blazing fast open source tools for the web.',
				home: true,
			};
		case 'writing':
			return {
				kicker: 'puruvj.dev / writing',
				title: 'writing',
				sub: 'notes from building things for the web. svelte, typescript, small libraries, and now and then life.',
			};
		case 'work': {
			const w = await projects();
			return {
				kicker: 'puruvj.dev / work',
				title: 'work',
				sub: `${w
					.slice(0, 3)
					.map((x) => x.title)
					.join(
						', ',
					)} and more: small libraries with large download counts, a few sites, and one framework.`,
			};
		}
		case 'career':
			return {
				kicker: 'puruvj.dev / career',
				title: 'career',
				sub: 'frontend all the way down. product teams, developer tools, a database company, and the svelte team.',
				size: 104,
			};
		case 'speaking': {
			const t = await talks();
			return {
				kicker: 'puruvj.dev / talks',
				title: 'talks',
				sub: 'on stage and on air. mostly svelte, sometimes react, always about making the web lighter.',
			};
		}
		case 'stats':
			return {
				kicker: 'puruvj.dev / stats',
				title: s?.npm ? full(s.npm.total) : 'stats',
				sub: 'every download of every package i maintain on npm, since the very first one.',
				size: 104,
			};
		case 'life':
			return {
				kicker: 'puruvj.dev / life',
				title: 'life',
				sub: LIFE_LEDE,
				size: 104,
				oil: true,
			};
	}
	return null;
}

export const GET = async ({ params }) => {
	const c = await card(params.page);
	if (!c) error(404);
	return new Response(new Uint8Array(await render(c)), {
		headers: { 'content-type': 'image/png' },
	});
};
