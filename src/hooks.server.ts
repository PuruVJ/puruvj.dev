import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit/hooks';
import { handle as ogygiaHandle } from 'ogygia/server';

const OWN = /^https?:\/\/(www\.)?puruvj\.dev(\/|$)/;

/** every link that leaves the site opens in a new tab, and gets a small ↗ unless it already has one.
 *  done once on the finished html, so markdown posts and components all follow the same rule. */
function outward(html: string) {
	return html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/g, (_whole, attrs: string, inner: string) => {
		// every arrow in a link gets a span, so css can lean it forward on hover
		inner = inner.replace(
			/(^|>)([^<]*)/g,
			(_m: string, gt: string, txt: string) =>
				gt +
				txt
					.replace(/→/g, '<span class="arr">→</span>')
					.replace(/↗/g, '<span class="arr ne">↗</span>'),
		);
		const href = /\bhref="([^"]*)"/.exec(attrs)?.[1];
		// files, not pages (the résumé, the feed, markdown copies): the router's viewport prefetch
		// would download them just for being on screen
		if (href && /\.(pdf|xml|txt|md|png)$/.test(href) && !/preload-data/.test(attrs))
			attrs += ' data-sveltekit-preload-data="off"';
		if (!href || !/^https?:/.test(href) || OWN.test(href)) return `<a${attrs}>${inner}</a>`;
		let a = attrs;
		if (!/\btarget=/.test(a)) a += ' target="_blank"';
		if (!/\brel=/.test(a)) a += ' rel="noopener"';
		if (!/[↗]|<(img|svg)\b/.test(inner)) {
			a = /\bclass="/.test(a) ? a.replace(/\bclass="/, 'class="ext ') : a + ' class="ext"';
		}
		return `<a${a}>${inner}</a>`;
	});
}

/** long inline code (`React.Dispatch<React.SetStateAction<string>>`, or a run like `get`/`map`/`set`)
 *  has no spaces, so on a phone it pushed the page sideways. give it soft break points after its
 *  dots, slashes and angle brackets, and after a slash between two code words, so a line breaks
 *  between names, never inside one. code blocks keep their own lines. */
function soft_breaks(html: string) {
	return html
		.replace(/(<pre\b[^>]*>)?<code>([^<]*)<\/code>/g, (whole, pre: string | undefined, txt: string) =>
			pre || txt.length < 14 ? whole : `<code>${txt.replace(/([./_,]|&lt;|&gt;|>)(?=.)/g, '$1<wbr>')}</code>`,
		)
		.replace(/<\/code>\//g, '</code>/<wbr>');
}

const external_links: Handle = ({ event, resolve }) =>
	resolve(event, { transformPageChunk: ({ html }) => soft_breaks(outward(html)) });

export const handle = sequence(ogygiaHandle(), external_links);
