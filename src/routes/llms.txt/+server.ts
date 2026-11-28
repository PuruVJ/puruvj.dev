import { puru } from '$lib/content.server.ts';
import { SITE } from '$lib/site.ts';

export const prerender = true;

const emit = puru.emit.llms();

/**
 * ogygia's llms.txt, pointed at the markdown: every post link gets `.md` (agents read the
 * markdown, humans the page), and the page links, which the emitter leaves relative, get the origin.
 */
export const GET: typeof emit = async (event) => {
	const text = await (await emit(event)).text();
	const out = text
		.replace(/\]\(\/([^)]*)\)/g, `](${SITE}/$1)`)
		.replace(new RegExp(`\\]\\((${SITE}/writing/[^).]+)\\)`, 'g'), ']($1.md)');
	return new Response(out, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
