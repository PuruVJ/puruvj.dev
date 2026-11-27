import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { handle as ogygiaHandle } from 'ogygia/server';

const OWN = /^https?:\/\/(www\.)?puruvj\.dev(\/|$)/;

/** every link that leaves the site opens in a new tab, and gets a small ↗ unless it already has one.
 *  done once on the finished html, so markdown posts and components all follow the same rule. */
function outward(html: string) {
	return html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/g, (whole, attrs: string, inner: string) => {
		const href = /\bhref="([^"]*)"/.exec(attrs)?.[1];
		if (!href || !/^https?:/.test(href) || OWN.test(href)) return whole;
		let a = attrs;
		if (!/\btarget=/.test(a)) a += ' target="_blank"';
		if (!/\brel=/.test(a)) a += ' rel="noopener"';
		if (!/[↗]|<(img|svg)\b/.test(inner)) {
			a = /\bclass="/.test(a) ? a.replace(/\bclass="/, 'class="ext ') : a + ' class="ext"';
		}
		return `<a${a}>${inner}</a>`;
	});
}

const external_links: Handle = ({ event, resolve }) =>
	resolve(event, { transformPageChunk: ({ html }) => outward(html) });

export const handle = sequence(ogygiaHandle(), external_links);
