import { talks } from '#lib/content.server.ts';

export const load = async () => {
	const all = await talks();
	return { talks: all.filter((t) => t.kind === 'talk'), podcasts: all.filter((t) => t.kind === 'podcast') };
};
