// images and videos wait for ogygia's image package. until then the prose drops them (the files
// stay in the content folders), and outside links open in a new tab.
type Node = {
	type: string;
	tagName?: string;
	value?: string;
	properties?: Record<string, unknown>;
	children?: Node[];
};

const MEDIA = new Set(['img', 'video', 'picture', 'figure', 'source']);
const MEDIA_FILE = /\.(png|jpe?g|gif|webp|avif|svg|mp4|webm)$/i;
const RAW_MEDIA = /<(video|picture|figure)\b[\s\S]*?<\/\1>|<(img|source)\b[^>]*>/gi;

function is_local_media(href: string) {
	return !/^[a-z]+:|^\/\//i.test(href) && MEDIA_FILE.test(href);
}

function walk(node: Node) {
	if (!node.children) return;
	const out: Node[] = [];
	for (const c of node.children) {
		if (c.type === 'element' && MEDIA.has(c.tagName!)) continue;
		if (c.type === 'raw' && c.value) {
			c.value = c.value.replace(RAW_MEDIA, '');
			if (!c.value.trim()) continue;
		}
		if (c.type === 'element' && c.tagName === 'a') {
			const href = String(c.properties?.href ?? '');
			// a link to a gif or video beside the post: keep the words, drop the link
			if (is_local_media(href)) {
				walk(c);
				out.push(...(c.children ?? []));
				continue;
			}
			if (/^https?:\/\//.test(href) && !href.startsWith('https://puruvj.dev')) {
				c.properties!.target = '_blank';
				c.properties!.rel = ['noopener', 'noreferrer'];
			}
		}
		walk(c);
		out.push(c);
	}
	// a paragraph that only held an image is empty now: drop it
	node.children = out.filter(
		(c) =>
			!(
				c.type === 'element' &&
				c.tagName === 'p' &&
				(c.children ?? []).every((k) => k.type === 'text' && !String(k.value).trim())
			),
	);
}

export function rehypeQuiet() {
	return (tree: Node) => walk(tree);
}
