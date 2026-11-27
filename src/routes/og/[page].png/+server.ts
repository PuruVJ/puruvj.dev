import { error } from '@sveltejs/kit';
import { render, type Card } from '$lib/og/card.ts';
import { posts, projects, talks } from '$lib/content.server.ts';
import { read_stats } from '$lib/stats/source.server.ts';
import { CAREER, span } from '$lib/career.ts';
import { short, full } from '$lib/numbers.ts';

export const prerender = true;
export const entries = () => ['home', 'blog', 'work', 'career', 'speaking', 'stats'].map((page) => ({ page }));

async function card(page: string): Promise<Card | null> {
	const [p, s] = await Promise.all([posts(), read_stats()]);
	const dl = s?.npm ? short(s.npm.total) : null;
	const stars = s?.github ? short(s.github.stars) : null;
	switch (page) {
		case 'home':
			return {
				kicker: '01  puruvj.dev',
				title: 'puru vijayvargia',
				sub: 'on the svelte team. i make small, fast open source libraries for the web, and write about building them.',
				home: true,
				facts: [{ big: String(p.length), small: 'posts since 2020' }],
			};
		case 'blog':
			return {
				kicker: 'puruvj.dev / writing',
				title: 'writing',
				sub: 'notes from building things for the web. svelte, typescript, small libraries, and now and then life.',
				facts: [
					{ big: String(p.length), small: 'posts' },
					{ big: p.at(-1)!.date.slice(0, 4), small: 'writing since' },
				],
			};
		case 'work': {
			const w = await projects();
			return {
				kicker: 'puruvj.dev / work',
				title: 'work',
				sub: `${w.slice(0, 3).map((x) => x.title).join(', ')} and more: small libraries with large download counts, a few sites, and one framework.`,
				facts: [
					...(dl ? [{ big: dl, small: 'npm downloads' }] : []),
					...(stars ? [{ big: stars, small: 'github stars' }] : []),
				],
			};
		}
		case 'career':
			return {
				kicker: 'puruvj.dev / career',
				title: 'career',
				sub: 'frontend all the way down. product teams, developer tools, a database company, and the svelte team.',
				facts: CAREER.slice(0, 2).map((j) => ({ big: j.org, small: `${j.role}, ${span(j)}` })),
				size: 104,
			};
		case 'speaking': {
			const t = await talks();
			return {
				kicker: 'puruvj.dev / talks',
				title: 'talks',
				sub: 'on stage and on air. mostly svelte, sometimes react, always about making the web lighter.',
				facts: [
					{ big: String(t.filter((x) => x.kind === 'talk').length), small: 'talks' },
					{ big: String(t.filter((x) => x.kind === 'podcast').length), small: 'podcasts' },
				],
			};
		}
		case 'stats':
			return {
				kicker: 'puruvj.dev / stats',
				title: s?.npm ? full(s.npm.total) : 'stats',
				sub: 'every download of every package i maintain on npm, since the very first one.',
				facts: [
					...(stars ? [{ big: stars, small: 'github stars' }] : []),
					...(s?.code ? [{ big: full(s.code.commits), small: 'commits' }] : []),
				],
				size: 104,
			};
	}
	return null;
}

export const GET = async ({ params }) => {
	const c = await card(params.page);
	if (!c) error(404);
	return new Response(new Uint8Array(await render(c)), { headers: { 'content-type': 'image/png' } });
};
