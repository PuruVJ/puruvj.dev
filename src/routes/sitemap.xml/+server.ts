import { puru } from '#lib/content.server.ts';
import { NAV, SITE } from '#lib/site.ts';

export const prerender = true;

const emit = puru.emit.sitemap();

/** ogygia's sitemap lists the posts; the plain pages are outline links, so they are added here */
export const GET: typeof emit = async (event) => {
	const xml = await (await emit(event)).text();
	const pages = ['/', ...NAV.map((n) => n.href)].map((p) => `  <url><loc>${SITE}${p === '/' ? '' : p}</loc></url>`).join('\n');
	return new Response(xml.replace(/(<urlset[^>]*>)/, `$1\n${pages}`), {
		headers: { 'content-type': 'application/xml' },
	});
};
