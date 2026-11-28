import { SITE } from '#lib/site.ts';

/** where this copy of the site lives, for absolute links in meta tags (social cards need them).
 *  a cloudflare preview build points at its own preview address, not at the live site. */
function origin() {
	const branch = process.env.WORKERS_CI_BRANCH;
	if (!branch || branch === 'main') return SITE;
	const alias = branch.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
	return `https://${alias}-puruvj-dev.devpuruvj.workers.dev`;
}

export const load = () => ({ origin: origin() });
